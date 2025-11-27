use reqwest::Client;
use serde_json::json;
use std::env;

#[tauri::command]
pub async fn summarize_text(text: String) -> Result<String, String> {
    // ...existing code...
    let ai_key = std::env::var("AI_KEY").map_err(|_| "Missing AI_KEY".to_string())?;
    let model = std::env::var("MODEL").unwrap_or_else(|_| "openai/gpt-oss-120b".to_string());

    let client = Client::new();
    let payload_value = json!({ "inputs": text });
    let payload = serde_json::to_string(&payload_value).map_err(|e| e.to_string())?;
    let url = format!("https://router.huggingface.co/models/{}", model);

    println!("HF request URL: {}", url);
    println!("HF request payload: {}", payload);

    let res = client
        .post(&url)
        .bearer_auth(ai_key)
        .header("Content-Type", "application/json")
        .body(payload.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body_text = res.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        if status.as_u16() == 404 {
            return Err(format!(
                "Model not found (404). MODEL='{}'. Check MODEL env var and that your token has access. URL: {}",
                model, url
            ));
        }
        return Err(format!("Request failed: {} - {}", status, body_text));
    }

    let json: serde_json::Value = serde_json::from_str(&body_text).map_err(|e| e.to_string())?;
    Ok(json.to_string())
}

#[tauri::command]
pub async fn send_message(prompt: String) -> Result<String, String> {
    // Changed: use chat completions endpoint with messages + model
    let ai_key = env::var("AI_KEY").map_err(|_| "Missing AI_KEY".to_string())?;
    let model = env::var("MODEL").unwrap_or_else(|_| "openai/gpt-oss-120b".to_string());

    let client = Client::new();
    let payload_value = json!({
        "model": model,
        "messages": [
            { "role": "user", "content": prompt }
        ],
        "stream": false
    });
    let payload = serde_json::to_string(&payload_value).map_err(|e| e.to_string())?;
    let url = "https://router.huggingface.co/v1/chat/completions";

    println!("HF chat request URL: {}", url);
    println!("HF chat request payload: {}", payload);

    let res = client
        .post(url)
        .bearer_auth(ai_key)
        .header("Content-Type", "application/json")
        .body(payload.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body_text = res.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        if status.as_u16() == 404 {
            return Err(format!(
                "Chat endpoint/model not found (404). MODEL='{}'. Check MODEL env var and token access. URL: {}",
                model, url
            ));
        }
        return Err(format!("Request failed: {} - {}", status, body_text));
    }

    // Try to extract assistant content from standard chat-completions response
    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body_text) {
        // OpenAI-like response: choices[0].message.content
        if let Some(choice) = val.get("choices").and_then(|c| c.get(0)) {
            if let Some(msg) = choice.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                return Ok(msg.to_string());
            }
            // sometimes the assistant text is under choices[0].text
            if let Some(text) = choice.get("text").and_then(|t| t.as_str()) {
                return Ok(text.to_string());
            }
        }
        // fallbacks: top-level fields
        if let Some(content) = val.get("content").and_then(|c| c.as_str()) {
            return Ok(content.to_string());
        }
        return Ok(val.to_string());
    }

    Ok(body_text)
}