use chrono::Local;
use std::fs;
use std::path::PathBuf;

pub fn current_timestamp() -> String {
    Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}