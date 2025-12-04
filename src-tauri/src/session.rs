use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use dirs::data_dir;

use crate::models::User;
use crate::db;

#[derive(Serialize, Deserialize)]
struct Session {
  current_user_id: Option<i64>,
}

fn session_path() -> Result<PathBuf, String> {
  let mut p = data_dir().ok_or("Cannot find data_dir")?;
  p.push("Kuma");
  fs::create_dir_all(&p).map_err(|e| e.to_string())?;
  p.push("session.json");
  Ok(p)
}

#[tauri::command]
pub fn set_current_user(user_id: Option<i64>) -> Result<(), String> {
  let path = session_path()?;
  let session = Session { current_user_id: user_id };
  let json = serde_json::to_string(&session).map_err(|e| e.to_string())?;
  fs::write(path, json).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_current_user() -> Result<Option<User>, String> {
  let path = session_path()?;
  if !path.exists() {
    return Ok(None);
  }
  let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
  let session: Session = serde_json::from_str(&data).map_err(|e| e.to_string())?;
  if let Some(uid) = session.current_user_id {
    let conn = db::init_db().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM users WHERE id = ?1").map_err(|e| e.to_string())?;
    let user = stmt.query_row([uid], |row| {
      Ok(User {
        id: row.get(0)?,
        name: row.get(1)?,
        created_at: row.get(2)?,
      })
    }).map_err(|e| e.to_string())?;
    print!("Loaded current user: {:?}", user);
    Ok(Some(user))
  } else {
    Ok(None)
  }
}