use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

pub struct OllamaProcess {
    pub child: Mutex<Option<Child>>,
}

pub fn start_ollama(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let child = spawn_ollama(app.handle())?;
    app.manage(OllamaProcess {
        child: Mutex::new(Some(child)),
    });
    Ok(())
}

fn spawn_ollama(app_handle: &tauri::AppHandle) -> Result<Child, Box<dyn std::error::Error>> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;

    let ollama_dir = resource_dir.join("resources").join("ollama");
    let ollama_bin = ollama_dir.join("ollama");

    if !ollama_bin.exists() {
        return Err(format!("Ollama binary not found at {:?}", ollama_bin).into());
    }

    // Kill any stale Ollama processes from previous runs
    kill_stale_ollama(&ollama_bin);

    let child = Command::new(&ollama_bin)
        .arg("serve")
        .env("DYLD_LIBRARY_PATH", &ollama_dir)
        .env("LD_LIBRARY_PATH", &ollama_dir)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn Ollama: {e}"))?;

    log::info!("Ollama started (pid: {})", child.id());
    Ok(child)
}

pub fn stop_ollama(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<OllamaProcess>() {
        if let Ok(mut guard) = state.child.lock() {
            if let Some(mut child) = guard.take() {
                let pid = child.id();
                log::info!("Stopping Ollama process (pid: {})", pid);
                // Kill child processes first, then the main process
                #[cfg(unix)]
                {
                    let _ = Command::new("pkill")
                        .args(["-9", "-P", &pid.to_string()])
                        .output();
                }
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
    // Also kill any remaining ollama processes started by this app
    #[cfg(unix)]
    {
        if let Ok(resource_dir) = app.path().resource_dir() {
            let ollama_bin = resource_dir.join("resources").join("ollama").join("ollama");
            let bin_str = ollama_bin.to_string_lossy();
            let _ = Command::new("pkill")
                .args(["-9", "-f", &bin_str])
                .output();
        }
    }
}

#[tauri::command]
pub async fn restart_ollama(app_handle: tauri::AppHandle) -> Result<(), String> {
    stop_ollama(&app_handle);
    std::thread::sleep(std::time::Duration::from_millis(500));

    let child = spawn_ollama(&app_handle)
        .map_err(|e| format!("Failed to restart Ollama: {e}"))?;

    if let Some(state) = app_handle.try_state::<OllamaProcess>() {
        *state.child.lock().unwrap() = Some(child);
    }

    Ok(())
}

/// Kill any stale Ollama processes that match our binary path.
/// This prevents zombie accumulation during dev restarts.
fn kill_stale_ollama(ollama_bin: &std::path::Path) {
    let bin_str = ollama_bin.to_string_lossy();
    #[cfg(unix)]
    {
        // Find PIDs of processes matching our ollama binary
        if let Ok(output) = Command::new("pgrep").args(["-f", &bin_str]).output() {
            let pids = String::from_utf8_lossy(&output.stdout);
            let count = pids.lines().filter(|l| !l.trim().is_empty()).count();
            if count > 0 {
                log::info!("Killing {} stale Ollama process(es)", count);
                let _ = Command::new("pkill").args(["-9", "-f", &bin_str]).output();
                // Brief pause to let the OS clean up
                std::thread::sleep(std::time::Duration::from_millis(300));
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
