use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::ipc::Channel;
use tauri::{Emitter, Manager};

const OLLAMA_BASE: &str = "http://localhost:11434";

// ── Chat cancellation ───────────────────────────────────────────────

pub struct ChatCancelFlag(pub AtomicBool);

// ── Public types (sent to frontend) ──────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "event", content = "data")]
pub enum StreamEvent {
    #[serde(rename = "token")]
    Token { content: String },
    #[serde(rename = "done")]
    Done {
        #[serde(rename = "totalDuration")]
        total_duration: u64,
    },
    #[serde(rename = "error")]
    Error { message: String },
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "event", content = "data")]
pub enum PullEvent {
    #[serde(rename = "progress")]
    Progress {
        status: String,
        completed: Option<u64>,
        total: Option<u64>,
    },
    #[serde(rename = "done")]
    Done {},
    #[serde(rename = "error")]
    Error { message: String },
}

// ── Internal deserialization types ───────────────────────────────────

#[derive(Debug, Deserialize)]
struct TagsResponse {
    models: Option<Vec<ModelDetail>>,
}

#[derive(Debug, Deserialize)]
struct ModelDetail {
    name: String,
    size: u64,
}

#[derive(Debug, Deserialize)]
struct ChatChunk {
    message: Option<ChatChunkMessage>,
    done: bool,
    total_duration: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct ChatChunkMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct PullChunk {
    status: Option<String>,
    completed: Option<u64>,
    total: Option<u64>,
}

// ── Helper: read newline-delimited JSON stream ───────────────────────

async fn read_ndjson_stream<T, F>(
    resp: reqwest::Response,
    mut handler: F,
) -> Result<(), String>
where
    T: for<'de> Deserialize<'de>,
    F: FnMut(T),
{
    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&bytes));

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();

            if line.is_empty() {
                continue;
            }

            if let Ok(parsed) = serde_json::from_str::<T>(&line) {
                handler(parsed);
            }
        }
    }

    Ok(())
}

// ── Commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn check_ollama() -> Result<bool, String> {
    match reqwest::get(OLLAMA_BASE).await {
        Ok(r) => Ok(r.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn list_models() -> Result<Vec<OllamaModel>, String> {
    let url = format!("{}/api/tags", OLLAMA_BASE);
    let resp = reqwest::get(&url)
        .await
        .map_err(|e| format!("Cannot reach Ollama: {e}"))?;
    let tags: TagsResponse = resp
        .json()
        .await
        .map_err(|e| format!("Bad response: {e}"))?;

    Ok(tags
        .models
        .unwrap_or_default()
        .into_iter()
        .map(|m| OllamaModel {
            name: m.name,
            size: m.size,
        })
        .collect())
}

#[tauri::command]
pub async fn get_system_ram() -> Result<u64, String> {
    let mut sys = sysinfo::System::new();
    sys.refresh_memory();
    let gb = ((sys.total_memory() as f64) / (1024.0 * 1024.0 * 1024.0)).round() as u64;
    Ok(gb)
}

#[tauri::command]
pub async fn chat(
    app_handle: tauri::AppHandle,
    model: String,
    messages: Vec<ChatMessage>,
    on_event: Channel<StreamEvent>,
) -> Result<(), String> {
    // Reset cancel flag at start
    if let Some(flag) = app_handle.try_state::<ChatCancelFlag>() {
        flag.0.store(false, Ordering::Relaxed);
    }

    let client = reqwest::Client::new();
    let url = format!("{}/api/chat", OLLAMA_BASE);

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true,
    });

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Cannot reach Ollama: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Ollama error ({status}): {text}"));
    }

    // Stream with cancel checking
    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        // Check cancel flag
        if let Some(flag) = app_handle.try_state::<ChatCancelFlag>() {
            if flag.0.load(Ordering::Relaxed) {
                let _ = on_event.send(StreamEvent::Done { total_duration: 0 });
                return Ok(());
            }
        }

        let bytes = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&bytes));

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();

            if line.is_empty() {
                continue;
            }

            if let Ok(parsed) = serde_json::from_str::<ChatChunk>(&line) {
                if parsed.done {
                    let _ = on_event.send(StreamEvent::Done {
                        total_duration: parsed.total_duration.unwrap_or(0),
                    });
                } else if let Some(msg) = parsed.message {
                    if !msg.content.is_empty() {
                        let _ = on_event.send(StreamEvent::Token {
                            content: msg.content,
                        });
                    }
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn cancel_chat(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(flag) = app_handle.try_state::<ChatCancelFlag>() {
        flag.0.store(true, Ordering::Relaxed);
    }
    Ok(())
}

#[tauri::command]
pub async fn pull_model(
    name: String,
    on_event: Channel<PullEvent>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/pull", OLLAMA_BASE);

    let body = serde_json::json!({
        "name": name,
        "stream": true,
    });

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Cannot reach Ollama: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Pull failed: {}", resp.status()));
    }

    read_ndjson_stream::<PullChunk, _>(resp, |chunk| {
        let status = chunk.status.unwrap_or_default();
        if status == "success" {
            let _ = on_event.send(PullEvent::Done {});
        } else {
            let _ = on_event.send(PullEvent::Progress {
                status,
                completed: chunk.completed,
                total: chunk.total,
            });
        }
    })
    .await
}

#[tauri::command]
pub async fn wait_for_ollama() -> Result<bool, String> {
    let client = reqwest::Client::new();
    for _ in 0..30 {
        if let Ok(r) = client.get(OLLAMA_BASE).send().await {
            if r.status().is_success() {
                return Ok(true);
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }
    Ok(false)
}

#[tauri::command]
pub async fn delete_model(name: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/delete", OLLAMA_BASE);

    let resp = client
        .delete(&url)
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await
        .map_err(|e| format!("Cannot reach Ollama: {e}"))?;

    if resp.status().is_success() {
        Ok(())
    } else {
        let text = resp.text().await.unwrap_or_default();
        Err(format!("Delete failed: {text}"))
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageInfo {
    pub path: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub fn get_storage_info(app_handle: tauri::AppHandle) -> Result<StorageInfo, String> {
    // First check app-bundled models dir
    let app_models_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?
        .join("models");

    let app_size = dir_size(&app_models_dir);

    if app_size > 0 {
        return Ok(StorageInfo {
            path: app_models_dir.to_string_lossy().to_string(),
            size_bytes: app_size,
        });
    }

    // Fall back to default Ollama models dir (~/.ollama/models)
    if let Some(home) = dirs::home_dir() {
        let default_dir = home.join(".ollama").join("models");
        let size = dir_size(&default_dir);
        return Ok(StorageInfo {
            path: default_dir.to_string_lossy().to_string(),
            size_bytes: size,
        });
    }

    Ok(StorageInfo {
        path: app_models_dir.to_string_lossy().to_string(),
        size_bytes: 0,
    })
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Cannot read file: {e}"))?;

    if metadata.len() > 10 * 1024 * 1024 {
        return Err("File too large (max 10 MB)".to_string());
    }

    std::fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read file: {e}"))
}

#[derive(Debug, Serialize)]
pub struct FolderFile {
    pub name: String,
    pub path: String,
    pub content: String,
}

#[tauri::command]
pub fn read_folder_files(path: String) -> Result<Vec<FolderFile>, String> {
    let text_extensions = [
        "txt", "md", "json", "csv", "xml", "yaml", "yml", "toml", "ini", "cfg", "log",
        "js", "ts", "tsx", "jsx", "py", "rs", "go", "java", "c", "cpp", "h", "hpp",
        "css", "html", "sql", "sh", "bash", "zsh", "swift", "kt", "rb", "php",
        "env", "gitignore", "dockerfile", "makefile",
    ];

    let mut files = Vec::new();
    collect_text_files(std::path::Path::new(&path), &text_extensions, &mut files, 0);
    Ok(files)
}

fn collect_text_files(dir: &std::path::Path, exts: &[&str], out: &mut Vec<FolderFile>, depth: usize) {
    if depth > 5 { return; }
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" {
            continue;
        }
        if path.is_dir() {
            collect_text_files(&path, exts, out, depth + 1);
        } else if let Ok(meta) = entry.metadata() {
            if meta.len() > 1024 * 1024 { continue; } // skip files > 1MB
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            let fname = name.to_lowercase();
            if exts.iter().any(|e| *e == ext.to_lowercase()) || fname == "makefile" || fname == "dockerfile" {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    out.push(FolderFile {
                        name: path.strip_prefix(dir.parent().unwrap_or(dir))
                            .unwrap_or(&path)
                            .to_string_lossy()
                            .to_string(),
                        path: path.to_string_lossy().to_string(),
                        content,
                    });
                }
            }
        }
    }
}

fn dir_size(path: &std::path::Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let meta = entry.metadata();
            if let Ok(m) = meta {
                if m.is_dir() {
                    total += dir_size(&entry.path());
                } else {
                    total += m.len();
                }
            }
        }
    }
    total
}

// ── File watching ───────────────────────────────────────────────────

use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

pub struct FolderWatchers(pub Mutex<HashMap<String, notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>>>);

#[tauri::command]
pub fn watch_folder(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let watchers_state = app_handle.state::<FolderWatchers>();
    let mut watchers = watchers_state.0.lock().map_err(|e| e.to_string())?;

    // Already watching
    if watchers.contains_key(&path) {
        return Ok(());
    }

    let app = app_handle.clone();
    let watch_path = path.clone();

    let mut debouncer = new_debouncer(Duration::from_secs(2), move |events: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
        if let Ok(events) = events {
            let has_changes = events.iter().any(|e| matches!(e.kind, DebouncedEventKind::Any));
            if has_changes {
                let _ = app.emit("folder-changed", &watch_path);
            }
        }
    }).map_err(|e| format!("Failed to create watcher: {e}"))?;

    debouncer.watcher().watch(std::path::Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch folder: {e}"))?;

    watchers.insert(path, debouncer);
    Ok(())
}

#[tauri::command]
pub fn unwatch_folder(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let watchers_state = app_handle.state::<FolderWatchers>();
    let mut watchers = watchers_state.0.lock().map_err(|e| e.to_string())?;
    watchers.remove(&path);
    Ok(())
}
