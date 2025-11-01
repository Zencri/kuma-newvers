// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
use std::env;
use dotenvy::dotenv;

fn main() {
  dotenv().ok();
  db::init_db().expect("Failed to initialize database");

  let ai_key = env::var("AI_KEY").expect("Missing AI_KEY");
  let model = env::var("MODEL").unwrap_or_else(|_| "mistralai/Mistral-7B-Instruct-v0.2".to_string());
  let notes = env::var("NOTES").unwrap_or_default();

  println!("Using model: {}", model);
  println!("Notes: {}", notes);

  app_lib::run(&ai_key);
}
