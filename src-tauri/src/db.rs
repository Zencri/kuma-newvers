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

    if first_time {
        conn.execute(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );",
            [],
        )?;
        println!("Created new database at {:?}", db_path);
    } else {
        println!("Using existing database at {:?}", db_path);
    }

    Ok(conn)
}