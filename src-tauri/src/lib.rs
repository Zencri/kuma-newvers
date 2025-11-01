#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(ai_key: &str) {
  let ai_key_owned = ai_key.to_owned();
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(move |app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      println!("AI ready with key prefix: {}", &ai_key_owned[..5]);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}