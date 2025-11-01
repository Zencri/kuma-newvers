use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::fs;
use dirs::data_dir;

fn get_db_path() -> PathBuf {
    let mut path = data_dir().expect("Cannot find data_dir");
    path.push("Kuma");
    fs::create_dir_all(&path).expect("Failed to create data dir");
    path.push("data.db");
    path
}

pub fn init_db() -> Result<Connection> {
    let db_path = get_db_path();
    let first_time = !db_path.exists();
    let conn = Connection::open(&db_path)?;
    conn.pragma_update(None, "foreign_keys", "ON")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id INTEGER NOT NULL,
            sender TEXT CHECK(sender IN ('User', 'Bot')) NOT NULL,
            content TEXT NOT NULL,
            response TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
        )",
        [],
    )?;

    migrate_schema(&conn)?;

    println!("Using database at {:?}", db_path);
    Ok(conn)
}

fn migrate_schema(conn: &Connection) -> Result<()> {
    // v0.1.0 Initial
    // (No migrations needed for initial version)


    Ok(())
}

fn add_column_if_missing(conn: &Connection, table: &str, column_def: &str) -> Result<()> {
    let parts: Vec<&str> = column_def.split_whitespace().collect();
    if parts.is_empty() {
        return Ok(());
    }

    let column_name = parts[0];
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let existing_cols = stmt
        .query_map([], |row| Ok(row.get::<_, String>(1)?))?
        .collect::<Result<Vec<_>, _>>()?;

    if !existing_cols.iter().any(|c| c == column_name) {
        let sql = format!("ALTER TABLE {} ADD COLUMN {}", table, column_def);
        conn.execute(&sql, [])?;
        println!("Added missing column '{}' to table '{}'", column_name, table); // debugging purpose
    }

    Ok(())
}

#[tauri::command]
pub fn save_message(user: String, content: String, response: String) -> Result<(), String> {
    let conn = init_db().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO messages (user, content, response) VALUES (?1, ?2, ?3)",
        (&user, &content, &response),
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_messages() -> Result<Vec<(String, String, String, String)>, String> {
    let conn = init_db().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT user, content, response, created_at FROM messages ORDER BY id DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    Ok(rows.filter_map(Result::ok).collect())
}