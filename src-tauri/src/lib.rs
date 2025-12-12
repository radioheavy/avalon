use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeResponse {
    pub success: bool,
    pub output: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIUpdateRequest {
    pub user_request: String,
    pub current_path: Option<Vec<String>>,
    pub current_value: Option<serde_json::Value>,
    pub full_prompt: Option<serde_json::Value>,
}

// Claude CLI yolunu bul
fn find_claude_path() -> Option<String> {
    let possible_paths = [
        format!("{}/.local/bin/claude", std::env::var("HOME").unwrap_or_default()),
        "/usr/local/bin/claude".to_string(),
        "/opt/homebrew/bin/claude".to_string(),
        format!("{}/.npm-global/bin/claude", std::env::var("HOME").unwrap_or_default()),
    ];

    for path in &possible_paths {
        if std::path::Path::new(path).exists() {
            return Some(path.clone());
        }
    }

    // Fallback - belki PATH'te
    Some("claude".to_string())
}

// Claude CLI'ı çağıran command
#[tauri::command]
async fn call_claude(prompt: String) -> Result<ClaudeResponse, String> {
    let claude_path = find_claude_path().unwrap_or_else(|| "claude".to_string());

    // Claude CLI'ı çağır
    let output = Command::new(&claude_path)
        .args(["--print", &prompt])
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                let stdout = String::from_utf8_lossy(&result.stdout).to_string();
                Ok(ClaudeResponse {
                    success: true,
                    output: Some(stdout),
                    error: None,
                })
            } else {
                let stderr = String::from_utf8_lossy(&result.stderr).to_string();
                Ok(ClaudeResponse {
                    success: false,
                    output: None,
                    error: Some(stderr),
                })
            }
        }
        Err(e) => {
            Ok(ClaudeResponse {
                success: false,
                output: None,
                error: Some(format!("Failed to execute claude: {}", e)),
            })
        }
    }
}

// AI ile prompt güncelleme
#[tauri::command]
async fn ai_update_value(request: AIUpdateRequest) -> Result<ClaudeResponse, String> {
    let system_prompt = r#"Sen bir prompt mühendisisin. Kullanıcının image generation prompt'larını düzenlemesine yardım ediyorsun.

Kurallar:
1. JSON yapısını koru - yeni key ekleme, var olanı değiştir
2. Sadece istenen alanı güncelle
3. Değişiklikleri Türkçe açıkla
4. Tutarlı ol (diğer alanlarla çelişme)
5. Yaratıcı ol ama mantıklı kal
6. Yanıtı her zaman aşağıdaki JSON formatında ver:

{
  "success": true,
  "updatedValue": <güncellenmiş değer>,
  "explanation": "Yapılan değişikliklerin kısa açıklaması"
}"#;

    let path_str = request.current_path
        .map(|p| p.join("."))
        .unwrap_or_else(|| "root".to_string());

    let current_value_str = request.current_value
        .map(|v| serde_json::to_string_pretty(&v).unwrap_or_default())
        .unwrap_or_else(|| "null".to_string());

    let full_prompt_str = request.full_prompt
        .map(|v| serde_json::to_string_pretty(&v).unwrap_or_default())
        .unwrap_or_else(|| "{}".to_string());

    let user_message = format!(
        r#"Kullanıcı İsteği: "{}"

Seçili Alan: {}

Mevcut Değer:
{}

Tam Prompt Yapısı (bağlam için):
{}

Lütfen kullanıcının isteğine göre sadece seçili alanın değerini güncelle ve JSON formatında yanıt ver."#,
        request.user_request,
        path_str,
        current_value_str,
        full_prompt_str
    );

    let full_prompt = format!("{}\n\n{}", system_prompt, user_message);

    call_claude(full_prompt).await
}

// Image prompt expansion - Nano Banana Pro için
#[tauri::command]
async fn expand_image_prompt(prompt: String) -> Result<ClaudeResponse, String> {
    let system_prompt = r##"You are a professional prompt engineer for AI image generation. Expand simple prompts into rich, structured JSON for Nano Banana Pro.

OUTPUT FORMAT - Valid JSON only, no markdown:
{
  "expanded_prompt": "2-4 sentence detailed description",
  "scene": "setting/environment",
  "subjects": [{"type": "identifier", "description": "detailed visual description", "position": "foreground|midground|background"}],
  "style": "visual style like photorealistic, cinematic, anime",
  "lighting": "specific lighting setup",
  "mood": "emotional atmosphere",
  "color_palette": {"primary": "#hex", "secondary": "#hex", "accent": "#hex", "description": "color mood"},
  "composition": {"framing": "camera framing", "angle": "camera angle", "focus": "what to focus on"},
  "text_elements": [{"content": "exact text", "style": "typography", "placement": "location"}] or null,
  "technical": {"aspect_ratio": "1:1|16:9|9:16|4:3|3:4|21:9", "resolution": "1K|2K|4K", "output_format": "png|jpeg|webp"},
  "negative_guidance": "what to avoid"
}

RULES:
1. Enrich but preserve user intent
2. Be specific with descriptions
3. Add textures, materials, atmospheric effects
4. Use real hex color codes
5. Extract text exactly as specified
6. Output ONLY valid JSON"##;

    let full_prompt = format!("{}\n\nUser prompt to expand: {}", system_prompt, prompt);

    call_claude(full_prompt).await
}

// Claude CLI'ın kurulu olup olmadığını kontrol et
#[tauri::command]
async fn check_claude_installed() -> Result<bool, String> {
    // Bilinen yolları kontrol et
    let possible_paths = [
        format!("{}/.local/bin/claude", std::env::var("HOME").unwrap_or_default()),
        "/usr/local/bin/claude".to_string(),
        "/opt/homebrew/bin/claude".to_string(),
        format!("{}/.npm-global/bin/claude", std::env::var("HOME").unwrap_or_default()),
    ];

    for path in &possible_paths {
        if std::path::Path::new(path).exists() {
            return Ok(true);
        }
    }

    Ok(false)
}

// Model bilgisi
#[derive(Debug, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
}

// Modelleri getir
#[tauri::command]
async fn get_models(provider: String, api_key: String) -> Result<Vec<ModelInfo>, String> {
    let client = reqwest::Client::new();

    match provider.as_str() {
        "openai" => {
            let res = client
                .get("https://api.openai.com/v1/models")
                .header("Authorization", format!("Bearer {}", api_key))
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if !res.status().is_success() {
                return Err("Failed to fetch OpenAI models".to_string());
            }

            let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
            let mut models: Vec<ModelInfo> = Vec::new();

            if let Some(arr) = data.get("data").and_then(|d| d.as_array()) {
                for model in arr {
                    if let Some(id) = model.get("id").and_then(|i| i.as_str()) {
                        // Sadece chat modelleri (gpt ile başlayanlar)
                        if id.starts_with("gpt-") && !id.contains("instruct") && !id.contains("realtime") {
                            let name = match id {
                                "gpt-4o" => "GPT-4o",
                                "gpt-4o-mini" => "GPT-4o Mini",
                                "gpt-4o-2024-11-20" => "GPT-4o (Nov 2024)",
                                "gpt-4o-2024-08-06" => "GPT-4o (Aug 2024)",
                                "gpt-4o-2024-05-13" => "GPT-4o (May 2024)",
                                "gpt-4o-mini-2024-07-18" => "GPT-4o Mini (Jul 2024)",
                                "gpt-4-turbo" => "GPT-4 Turbo",
                                "gpt-4-turbo-preview" => "GPT-4 Turbo Preview",
                                "gpt-4-turbo-2024-04-09" => "GPT-4 Turbo (Apr 2024)",
                                "gpt-4" => "GPT-4",
                                "gpt-4-0613" => "GPT-4 (Jun 2023)",
                                "gpt-3.5-turbo" => "GPT-3.5 Turbo",
                                "gpt-3.5-turbo-0125" => "GPT-3.5 Turbo (Jan 2024)",
                                _ => id,
                            };
                            models.push(ModelInfo {
                                id: id.to_string(),
                                name: name.to_string(),
                            });
                        }
                    }
                }
            }

            // Sırala - en yeniler üstte
            models.sort_by(|a, b| {
                let priority = |id: &str| -> i32 {
                    if id == "gpt-4o" { 0 }
                    else if id == "gpt-4o-mini" { 1 }
                    else if id.starts_with("gpt-4o") { 2 }
                    else if id == "gpt-4-turbo" { 3 }
                    else if id.starts_with("gpt-4-turbo") { 4 }
                    else if id == "gpt-4" { 5 }
                    else if id.starts_with("gpt-4") { 6 }
                    else if id == "gpt-3.5-turbo" { 7 }
                    else { 8 }
                };
                priority(&a.id).cmp(&priority(&b.id))
            });

            Ok(models)
        }
        "anthropic" => {
            let res = client
                .get("https://api.anthropic.com/v1/models")
                .header("x-api-key", &api_key)
                .header("anthropic-version", "2023-06-01")
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if !res.status().is_success() {
                return Err("Failed to fetch Anthropic models".to_string());
            }

            let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
            let mut models: Vec<ModelInfo> = Vec::new();

            if let Some(arr) = data.get("data").and_then(|d| d.as_array()) {
                for model in arr {
                    if let Some(id) = model.get("id").and_then(|i| i.as_str()) {
                        let display_name = model
                            .get("display_name")
                            .and_then(|n| n.as_str())
                            .unwrap_or(id);

                        models.push(ModelInfo {
                            id: id.to_string(),
                            name: display_name.to_string(),
                        });
                    }
                }
            }

            // Sırala - en yeniler üstte
            models.sort_by(|a, b| {
                let priority = |id: &str| -> i32 {
                    if id.contains("sonnet-4") { 0 }
                    else if id.contains("3-5-sonnet") { 1 }
                    else if id.contains("3-5-haiku") { 2 }
                    else if id.contains("opus") { 3 }
                    else if id.contains("sonnet") { 4 }
                    else if id.contains("haiku") { 5 }
                    else { 6 }
                };
                priority(&a.id).cmp(&priority(&b.id))
            });

            Ok(models)
        }
        "google" => {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models?key={}",
                api_key
            );
            let res = client.get(&url).send().await.map_err(|e| e.to_string())?;

            if !res.status().is_success() {
                return Err("Failed to fetch Google models".to_string());
            }

            let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
            let mut models: Vec<ModelInfo> = Vec::new();

            if let Some(arr) = data.get("models").and_then(|d| d.as_array()) {
                for model in arr {
                    if let Some(name) = model.get("name").and_then(|n| n.as_str()) {
                        // models/gemini-1.5-pro -> gemini-1.5-pro
                        let id = name.replace("models/", "");

                        // Sadece generateContent destekleyenleri al
                        let supports_generate = model
                            .get("supportedGenerationMethods")
                            .and_then(|m| m.as_array())
                            .map(|arr| arr.iter().any(|v| v.as_str() == Some("generateContent")))
                            .unwrap_or(false);

                        if supports_generate && id.starts_with("gemini") {
                            let display_name = model
                                .get("displayName")
                                .and_then(|n| n.as_str())
                                .unwrap_or(&id);

                            models.push(ModelInfo {
                                id: id.clone(),
                                name: display_name.to_string(),
                            });
                        }
                    }
                }
            }

            // Sırala
            models.sort_by(|a, b| {
                let priority = |id: &str| -> i32 {
                    if id.contains("2.0-flash") { 0 }
                    else if id.contains("1.5-pro") && !id.contains("tuning") { 1 }
                    else if id.contains("1.5-flash") && !id.contains("tuning") { 2 }
                    else if id.contains("1.0-pro") { 3 }
                    else { 4 }
                };
                priority(&a.id).cmp(&priority(&b.id))
            });

            Ok(models)
        }
        _ => Err("Unknown provider".to_string()),
    }
}

// API Key test fonksiyonu
#[tauri::command]
async fn test_api_key(provider: String, api_key: String) -> Result<bool, String> {
    let client = reqwest::Client::new();

    let result = match provider.as_str() {
        "openai" => {
            let res = client
                .get("https://api.openai.com/v1/models")
                .header("Authorization", format!("Bearer {}", api_key))
                .send()
                .await;

            match res {
                Ok(response) => response.status().is_success(),
                Err(_) => false,
            }
        }
        "anthropic" => {
            let res = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", &api_key)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .body(r#"{"model":"claude-3-haiku-20240307","max_tokens":1,"messages":[{"role":"user","content":"Hi"}]}"#)
                .send()
                .await;

            match res {
                Ok(response) => {
                    let status = response.status();
                    // 200 OK veya 400 Bad Request (auth geçti demek) = geçerli
                    status.is_success() || status.as_u16() == 400
                }
                Err(_) => false,
            }
        }
        "google" => {
            let url = format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", api_key);
            let res = client.get(&url).send().await;

            match res {
                Ok(response) => response.status().is_success(),
                Err(_) => false,
            }
        }
        _ => false,
    };

    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            call_claude,
            ai_update_value,
            expand_image_prompt,
            check_claude_installed,
            test_api_key,
            get_models
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
