use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

pub struct OllamaProcess {
    pub child: Mutex<Option<Child>>,
}

pub fn start_ollama(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;

    let ollama_dir = resource_dir.join("resources").join("ollama");
    let ollama_bin = ollama_dir.join("ollama");

    if !ollama_bin.exists() {
        return Err(format!("Ollama binary not found at {:?}", ollama_bin).into());
    }

    let child = Command::new(&ollama_bin)
        .arg("serve")
        .env("DYLD_LIBRARY_PATH", &ollama_dir)
        .env("LD_LIBRARY_PATH", &ollama_dir)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn Ollama: {e}"))?;

    log::info!("Ollama started (pid: {})", child.id());

    app.manage(OllamaProcess {
        child: Mutex::new(Some(child)),
    });

    Ok(())
}

pub fn stop_ollama(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<OllamaProcess>() {
        if let Ok(mut guard) = state.child.lock() {
            if let Some(mut child) = guard.take() {
                log::info!("Stopping Ollama process");
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

pub async fn wait_for_ready(max_attempts: u32, interval_ms: u64) -> bool {
    for attempt in 1..=max_attempts {
        match reqwest::get("http://localhost:11434").await {
            Ok(resp) if resp.status().is_success() => {
                log::info!("Ollama ready after {} attempt(s)", attempt);
                return true;
            }
            _ => {
                log::debug!("Ollama not ready (attempt {}/{})", attempt, max_attempts);
                tokio::time::sleep(std::time::Duration::from_millis(interval_ms)).await;
            }
        }
    }
    log::warn!("Ollama did not become ready after {} attempts", max_attempts);
    false
}
