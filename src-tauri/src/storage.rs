use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn storage_dir(app: &tauri::AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| dirs::data_dir().unwrap_or_default().join("com.innertalk.ai"));
    fs::create_dir_all(&dir).ok();
    dir
}

#[tauri::command]
pub fn save_store(app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
    let path = storage_dir(&app).join(format!("{key}.json"));
    fs::write(&path, &value).map_err(|e| format!("Failed to save {key}: {e}"))
}

#[tauri::command]
pub fn load_store(app: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
    let path = storage_dir(&app).join(format!("{key}.json"));
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| format!("Failed to load {key}: {e}"))?;
        Ok(Some(data))
    } else {
        Ok(None)
    }
}
