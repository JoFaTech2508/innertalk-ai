mod ollama;
mod sidecar;

use tauri::RunEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            match sidecar::start_ollama(app) {
                Ok(()) => log::info!("Ollama sidecar started"),
                Err(e) => log::error!("Failed to start Ollama: {e}"),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ollama::check_ollama,
            ollama::list_models,
            ollama::get_system_ram,
            ollama::chat,
            ollama::pull_model,
            ollama::delete_model,
            ollama::wait_for_ollama,
            ollama::get_storage_info,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                sidecar::stop_ollama(app_handle);
            }
        });
}
