use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Sender {
    User,
    Bot,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub thread_id: i64,
    pub sender: Sender,
    pub content: String,
    pub response: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Thread {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}