use base64::Engine;
use regex::Regex;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const BROWSER_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
    (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/// Path to the auto-persisted collection file inside the app data directory.
fn data_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("yupoo-sorter.json"))
}

/// Load the auto-saved collection (empty string if it does not exist yet).
#[tauri::command]
fn load_data(app: tauri::AppHandle) -> Result<String, String> {
    let path = data_file(&app)?;
    if path.exists() {
        fs::read_to_string(&path).map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

/// Auto-save the collection to the app data directory.
#[tauri::command]
fn save_data(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    let path = data_file(&app)?;
    fs::write(&path, contents).map_err(|e| e.to_string())
}

/// Read an arbitrary file chosen by the user via the open dialog (import).
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Write to an arbitrary path chosen by the user via the save dialog (export).
#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

/// Scheme + host of a URL as an origin (e.g. `https://huskyreps.x.yupoo.com/`).
fn origin_of(url: &str) -> String {
    if let Some(scheme_end) = url.find("://") {
        let scheme = &url[..scheme_end];
        let rest = &url[scheme_end + 3..];
        let host_end = rest.find('/').unwrap_or(rest.len());
        format!("{}://{}/", scheme, &rest[..host_end])
    } else {
        "https://x.yupoo.com/".to_string()
    }
}

/// Minimal HTML entity decoding for text pulled out of tags.
fn decode_entities(s: &str) -> String {
    s.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
}

/// Album title = text of the `<title>` tag before the first " | " separator.
fn extract_title(html: &str) -> String {
    let re = Regex::new(r"(?is)<title[^>]*>(.*?)</title>").unwrap();
    if let Some(caps) = re.captures(html) {
        let raw = caps.get(1).map(|m| m.as_str()).unwrap_or("");
        let first = raw.split(" | ").next().unwrap_or(raw);
        decode_entities(first).trim().to_string()
    } else {
        String::new()
    }
}

#[derive(serde::Serialize)]
struct AlbumResult {
    title: String,
    images: Vec<String>,
}

/// Fetch a Yupoo album page: return its title plus product photos as embedded
/// base64 data URLs. Yupoo photos are hotlink-protected, so each image is fetched
/// server-side with a matching `Referer` header (which also sidesteps browser
/// CORS). The compact `medium` size variant is used as-is — no re-encode.
#[tauri::command]
async fn fetch_album(url: String, limit: usize) -> Result<AlbumResult, String> {
    let client = reqwest::Client::builder()
        .user_agent(BROWSER_UA)
        .build()
        .map_err(|e| e.to_string())?;

    let html = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let title = extract_title(&html);

    let re = Regex::new(
        r#"(?i)(?:https?:)?//photo\.yupoo\.com/[^\s"'\\]+?/(?:small|medium|big|original|square)\.(?:jpe?g|png|webp)"#,
    )
    .map_err(|e| e.to_string())?;
    let size_re =
        Regex::new(r#"(?i)/(?:small|medium|big|original|square)\.(jpe?g|png|webp)$"#).unwrap();

    let mut seen = HashSet::new();
    let mut targets: Vec<String> = Vec::new();
    for m in re.find_iter(&html) {
        let mut u = m.as_str().to_string();
        if u.starts_with("//") {
            u = format!("https:{}", u);
        }
        // Normalize any size variant to the compact `medium` thumbnail.
        let u = size_re.replace(&u, "/medium.$1").to_string();
        if seen.insert(u.clone()) {
            targets.push(u);
            if targets.len() >= limit {
                break;
            }
        }
    }

    let referer = origin_of(&url);
    let mut out: Vec<String> = Vec::new();
    for img in targets {
        if let Ok(resp) = client.get(&img).header("Referer", &referer).send().await {
            if resp.status().is_success() {
                let mime = resp
                    .headers()
                    .get(reqwest::header::CONTENT_TYPE)
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("image/jpeg")
                    .to_string();
                if let Ok(bytes) = resp.bytes().await {
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                    out.push(format!("data:{};base64,{}", mime, b64));
                }
            }
        }
    }

    if out.is_empty() {
        Err("Keine Bilder im Album gefunden".to_string())
    } else {
        Ok(AlbumResult {
            title,
            images: out,
        })
    }
}

/// Lightweight: fetch only the album page title (no images).
#[tauri::command]
async fn fetch_album_title(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent(BROWSER_UA)
        .build()
        .map_err(|e| e.to_string())?;
    let html = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(extract_title(&html))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            read_file,
            write_file,
            fetch_album,
            fetch_album_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
