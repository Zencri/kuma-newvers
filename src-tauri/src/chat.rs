use reqwest::Client;
use serde_json::json;

#[tauri::command]
pub async fn summarize_text(text: String) -> Result<String, String> {
    let ai_key = std::env::var("AI_KEY").map_err(|_| "Missing AI_KEY".to_string())?;
    let model = std::env::var("MODEL").unwrap_or_else(|_| "mistralai/Mistral-7B-Instruct-v0.3".to_string());

    let client = Client::new();
    let res = client.post(format!("https://api-inference.huggingface.co/models/{}", model))
        .bearer_auth(ai_key)
        .json(&json!({ "inputs": text }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;

    Ok(json.to_string())
}