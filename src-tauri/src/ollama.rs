use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

const OLLAMA_BASE: &str = "http://localhost:11434";

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
    model: String,
    messages: Vec<ChatMessage>,
    on_event: Channel<StreamEvent>,
) -> Result<(), String> {
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

    read_ndjson_stream::<ChatChunk, _>(resp, |chunk| {
        if chunk.done {
            let _ = on_event.send(StreamEvent::Done {
                total_duration: chunk.total_duration.unwrap_or(0),
            });
        } else if let Some(msg) = chunk.message {
            if !msg.content.is_empty() {
                let _ = on_event.send(StreamEvent::Token {
                    content: msg.content,
                });
            }
        }
    })
    .await
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
