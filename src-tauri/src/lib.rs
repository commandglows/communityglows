use std::collections::HashMap;
#[cfg(target_os = "android")]
use std::collections::HashSet;
#[cfg(not(target_os = "android"))]
use std::sync::Mutex;
#[cfg(not(target_os = "android"))]
use std::time::Instant;

use tauri::{AppHandle, Manager};

mod backup;

#[cfg(not(target_os = "android"))]
const MAX_WARM_DESKTOP_WEBVIEWS: usize = 3;

#[cfg(target_os = "windows")]
const BITWARDEN_EXTENSION_PATH_ENV: &str = "COMMUNITYGLOWS_BITWARDEN_EXTENSION_PATH";
#[cfg(target_os = "windows")]
const BITWARDEN_RELEASES_URL: &str = "https://github.com/bitwarden/clients/releases";
#[cfg(target_os = "windows")]
const BITWARDEN_INSTALLATION_CONFIG: &str = "bitwarden-installation.json";
#[cfg(target_os = "windows")]
const MAX_BITWARDEN_ARCHIVE_BYTES: u64 = 64 * 1024 * 1024;
#[cfg(target_os = "windows")]
const MAX_BITWARDEN_EXTRACTED_BYTES: u64 = 256 * 1024 * 1024;
#[cfg(target_os = "windows")]
const MAX_BITWARDEN_ARCHIVE_ENTRIES: usize = 8_000;

#[cfg(target_os = "windows")]
#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ManagedBitwardenInstallation {
    schema_version: u8,
    relative_directory: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct BitwardenExtensionStatus {
    supported: bool,
    installed: bool,
    source: String,
    version: Option<String>,
    restart_required: bool,
}

#[cfg(target_os = "windows")]
#[derive(Default)]
struct BitwardenExtensionRuntimeState(Mutex<bool>);

#[cfg(not(target_os = "windows"))]
#[derive(Default)]
struct BitwardenExtensionRuntimeState;

#[cfg(not(target_os = "android"))]
fn validate_bitwarden_extension_manifest(raw: &str) -> Result<(), String> {
    let manifest: serde_json::Value =
        serde_json::from_str(raw).map_err(|_| "Bitwarden manifest.json is not valid JSON")?;
    let object = manifest
        .as_object()
        .ok_or("Bitwarden manifest.json must contain an object")?;
    let manifest_version = object
        .get("manifest_version")
        .and_then(serde_json::Value::as_u64)
        .ok_or("Bitwarden manifest.json has no manifest_version")?;
    if !matches!(manifest_version, 2 | 3) {
        return Err("Bitwarden extension must use manifest version 2 or 3".to_string());
    }
    let name = object
        .get("name")
        .and_then(serde_json::Value::as_str)
        .ok_or("Bitwarden manifest.json has no extension name")?;
    if object
        .get("version")
        .and_then(serde_json::Value::as_str)
        .filter(|version| !version.trim().is_empty())
        .is_none()
    {
        return Err("Bitwarden manifest.json has no extension version".to_string());
    }
    let identified_by_name = name.to_ascii_lowercase().contains("bitwarden");
    let identified_by_homepage = object
        .get("homepage_url")
        .and_then(serde_json::Value::as_str)
        .and_then(|homepage| homepage.parse::<url::Url>().ok())
        .and_then(|homepage| homepage.host_str().map(str::to_owned))
        .is_some_and(|host| host == "bitwarden.com" || host.ends_with(".bitwarden.com"));
    if !identified_by_name && !identified_by_homepage {
        return Err("The selected extension manifest does not identify Bitwarden".to_string());
    }
    Ok(())
}

#[cfg(not(target_os = "android"))]
fn bitwarden_extension_version(raw: &str) -> Option<String> {
    serde_json::from_str::<serde_json::Value>(raw)
        .ok()?
        .get("version")?
        .as_str()
        .map(str::to_owned)
}

#[cfg(target_os = "windows")]
fn environment_bitwarden_extension_path() -> Result<Option<std::path::PathBuf>, String> {
    let Some(raw_path) = std::env::var_os(BITWARDEN_EXTENSION_PATH_ENV) else {
        return Ok(None);
    };
    if raw_path.is_empty() {
        return Err(format!("{BITWARDEN_EXTENSION_PATH_ENV} is empty"));
    }
    let path = std::path::PathBuf::from(raw_path)
        .canonicalize()
        .map_err(|_| "The configured Bitwarden extension directory does not exist")?;
    if !path.is_dir() {
        return Err("The configured Bitwarden extension path is not a directory".to_string());
    }
    let manifest = std::fs::read_to_string(path.join("manifest.json"))
        .map_err(|_| "The configured Bitwarden extension directory has no manifest.json")?;
    validate_bitwarden_extension_manifest(&manifest)?;
    Ok(Some(path))
}

#[cfg(target_os = "windows")]
fn bitwarden_extensions_root<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<std::path::PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("extensions"))
}

#[cfg(target_os = "windows")]
fn managed_bitwarden_extension_path<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Option<std::path::PathBuf>, String> {
    let root = bitwarden_extensions_root(app)?;
    let config_path = root.join(BITWARDEN_INSTALLATION_CONFIG);
    let raw = match std::fs::read_to_string(&config_path) {
        Ok(raw) => raw,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err("The local Bitwarden installation settings cannot be read".to_string()),
    };
    let config: ManagedBitwardenInstallation = serde_json::from_str(&raw)
        .map_err(|_| "The local Bitwarden installation settings are invalid")?;
    if config.schema_version != 1
        || config.relative_directory.is_empty()
        || std::path::Path::new(&config.relative_directory).is_absolute()
    {
        return Err("The local Bitwarden installation reference is invalid".to_string());
    }

    let canonical_root = root
        .canonicalize()
        .map_err(|_| "The local Bitwarden extension directory is missing")?;
    let path = root
        .join(config.relative_directory)
        .canonicalize()
        .map_err(|_| "The installed Bitwarden extension directory is missing")?;
    if !path.starts_with(&canonical_root) || !path.is_dir() {
        return Err("The local Bitwarden installation escaped its allowed directory".to_string());
    }
    let manifest = std::fs::read_to_string(path.join("manifest.json"))
        .map_err(|_| "The installed Bitwarden extension has no manifest.json")?;
    validate_bitwarden_extension_manifest(&manifest)?;
    Ok(Some(path))
}

#[cfg(target_os = "windows")]
fn configured_bitwarden_extension_path<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Option<std::path::PathBuf>, String> {
    match environment_bitwarden_extension_path()? {
        Some(path) => Ok(Some(path)),
        None => managed_bitwarden_extension_path(app),
    }
}

#[cfg(target_os = "windows")]
fn prune_inactive_managed_bitwarden_packages<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<(), String> {
    let root = bitwarden_extensions_root(app)?;
    if !root.exists() {
        return Ok(());
    }
    let active = managed_bitwarden_extension_path(app)?;
    let canonical_root = root
        .canonicalize()
        .map_err(|_| "The local extension directory cannot be resolved")?;
    for entry in std::fs::read_dir(&root)
        .map_err(|_| "The local extension directory cannot be inspected")?
    {
        let entry = entry.map_err(|_| "A local extension entry cannot be inspected")?;
        let file_name = entry.file_name();
        if !file_name.to_string_lossy().starts_with("bitwarden-") {
            continue;
        }
        let path = entry
            .path()
            .canonicalize()
            .map_err(|_| "A local Bitwarden package cannot be resolved")?;
        if !path.starts_with(&canonical_root) || active.as_ref().is_some_and(|item| item == &path) {
            continue;
        }
        if path.is_dir() {
            std::fs::remove_dir_all(path)
                .map_err(|_| "An inactive Bitwarden package cannot be removed")?;
        }
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn configure_bitwarden_extension<R: tauri::Runtime>(
    builder: WebviewBuilder<R>,
    app: &AppHandle<R>,
) -> Result<WebviewBuilder<R>, String> {
    match configured_bitwarden_extension_path(app)? {
        Some(path) => Ok(builder
            .browser_extensions_enabled(true)
            .extensions_path(path)),
        None => Ok(builder),
    }
}

#[cfg(all(not(target_os = "android"), not(target_os = "windows")))]
fn configure_bitwarden_extension<R: tauri::Runtime>(
    builder: WebviewBuilder<R>,
    _app: &AppHandle<R>,
) -> Result<WebviewBuilder<R>, String> {
    Ok(builder)
}

#[cfg(not(target_os = "android"))]
#[derive(Default)]
struct DesktopWebviewPoolState {
    entries: Mutex<HashMap<String, DesktopWebviewPoolEntry>>,
}

#[cfg(target_os = "android")]
#[derive(Default)]
struct DesktopWebviewPoolState;

#[cfg(not(target_os = "android"))]
struct DesktopWebviewPoolEntry {
    hidden: bool,
    last_used: Instant,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopWebviewPoolStats {
    total: usize,
    visible: usize,
    hidden: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pooling_enabled: Option<bool>,
}

#[cfg(not(target_os = "android"))]
fn mark_desktop_webview(app: &AppHandle, label: &str, hidden: bool) -> Result<(), String> {
    let state = app.state::<DesktopWebviewPoolState>();
    let mut entries = state
        .entries
        .lock()
        .map_err(|_| "webview pool lock poisoned")?;
    entries.insert(
        label.to_string(),
        DesktopWebviewPoolEntry {
            hidden,
            last_used: Instant::now(),
        },
    );
    Ok(())
}

#[cfg(not(target_os = "android"))]
fn evict_oldest_hidden_desktop_webviews(app: &AppHandle, keep_label: &str) -> Result<(), String> {
    let state = app.state::<DesktopWebviewPoolState>();
    let evicted = {
        let entries = state
            .entries
            .lock()
            .map_err(|_| "webview pool lock poisoned")?;
        let hidden_count = entries.values().filter(|entry| entry.hidden).count();
        if hidden_count < MAX_WARM_DESKTOP_WEBVIEWS {
            Vec::new()
        } else {
            let mut hidden: Vec<_> = entries
                .iter()
                .filter(|(label, entry)| entry.hidden && label.as_str() != keep_label)
                .map(|(label, entry)| (label.clone(), entry.last_used))
                .collect();
            hidden.sort_by_key(|(_, last_used)| *last_used);
            hidden
                .into_iter()
                .take(hidden_count - MAX_WARM_DESKTOP_WEBVIEWS + 1)
                .map(|(label, _)| label)
                .collect::<Vec<_>>()
        }
    };

    for label in evicted {
        if let Some(wv) = app.get_webview(&label) {
            wv.close().map_err(|e| e.to_string())?;
        }
        let mut entries = state
            .entries
            .lock()
            .map_err(|_| "webview pool lock poisoned")?;
        entries.remove(&label);
    }
    Ok(())
}

#[cfg(not(target_os = "android"))]
fn close_desktop_profile_webviews(app: &AppHandle, profile_id: &str) -> Result<(), String> {
    let state = app.state::<DesktopWebviewPoolState>();
    let labels: Vec<String> = {
        let entries = state
            .entries
            .lock()
            .map_err(|_| "webview pool lock poisoned")?;
        entries
            .keys()
            .filter(|label| label.starts_with(&format!("social-{profile_id}-")))
            .cloned()
            .collect()
    };

    for label in labels {
        if let Some(wv) = app.get_webview(&label) {
            wv.close().map_err(|e| e.to_string())?;
        }
        let mut entries = state
            .entries
            .lock()
            .map_err(|_| "webview pool lock poisoned")?;
        entries.remove(&label);
    }
    Ok(())
}

#[cfg(not(target_os = "android"))]
fn close_all_desktop_webviews(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<DesktopWebviewPoolState>();
    let labels: Vec<String> = {
        let entries = state
            .entries
            .lock()
            .map_err(|_| "webview pool lock poisoned")?;
        entries.keys().cloned().collect()
    };

    for label in labels {
        if let Some(wv) = app.get_webview(&label) {
            wv.close().map_err(|e| e.to_string())?;
        }
        let mut entries = state
            .entries
            .lock()
            .map_err(|_| "webview pool lock poisoned")?;
        entries.remove(&label);
    }
    Ok(())
}

// ── Desktop-only imports ─────────────────────────────────────────────────────
#[cfg(not(target_os = "android"))]
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, WebviewBuilder, WebviewUrl,
};

#[cfg(target_os = "android")]
use tauri_plugin_android_webview::AndroidWebviewExt;

#[cfg(target_os = "android")]
const OAUTH_CALLBACK_TTL_MS: i64 = 5 * 60 * 1000;

#[cfg(target_os = "android")]
fn android_allowed_oauth_callback_hosts() -> &'static [&'static str] {
    &[
        "auth-callback",
        "communityglows.com",
        "www.communityglows.com",
    ]
}

fn host_matches_allowlist(host: &str, allowed_host: &str) -> bool {
    host == allowed_host || host.ends_with(&format!(".{allowed_host}"))
}

fn allowed_hosts_for_network(network_id: &str) -> &'static [&'static str] {
    match network_id {
        "twitter" => &["x.com", "twitter.com"],
        "facebook" => &["facebook.com"],
        "instagram" => &["instagram.com"],
        "linkedin" => &["linkedin.com"],
        "tiktok" => &["tiktok.com"],
        "threads" => &["threads.net"],
        "discord" => &["discord.com"],
        "reddit" => &["reddit.com"],
        "snapchat" => &["web.snapchat.com"],
        "cinderreels" => &["cinderreels.com"],
        "quora" => &["quora.com"],
        "pinterest" => &["pinterest.com"],
        "telegram" => &["web.telegram.org", "telegram.org", "t.me"],
        "nextdoor" => &["nextdoor.com"],
        "patreon" => &["patreon.com"],
        "theresanaiforthat" => &["theresanaiforthat.com"],
        "industrysocial" | "industrysocial-waitlist" => &["industrysocial.net"],
        "bluesky" => &["bsky.app"],
        "mastodon" => &["mastodon.social"],
        "substack" => &["substack.com"],
        "ko-fi" => &["ko-fi.com"],
        "buymeacoffee" => &["buymeacoffee.com"],
        "producthunt" => &["producthunt.com"],
        "indiehackers" => &["indiehackers.com"],
        "hackernews" => &["news.ycombinator.com"],
        "folloverse" => &["folloverse.com"],
        "koru" => &["koru.now"],
        "kick" => &["kick.com"],
        "medium" => &["medium.com"],
        "luma" => &["luma.com"],
        "circle" => &["discover.circle.so", "circle.so"],
        "stackoverflow" => &["stackoverflow.com"],
        "github-community" => &["github.com"],
        "huzzler" => &["huzzler.so"],
        _ => &[],
    }
}

fn is_disallowed_webview_host(host: &str) -> bool {
    if host.eq_ignore_ascii_case("localhost") || host.eq_ignore_ascii_case("127.0.0.1") {
        return true;
    }

    if let Ok(ip) = host.parse::<std::net::IpAddr>() {
        return match ip {
            std::net::IpAddr::V4(ipv4) => {
                ipv4.is_private()
                    || ipv4.is_loopback()
                    || ipv4.is_link_local()
                    || ipv4.is_documentation()
                    || ipv4.is_unspecified()
            }
            std::net::IpAddr::V6(ipv6) => {
                ipv6.is_loopback()
                    || ipv6.is_unspecified()
                    || ipv6.is_unique_local()
                    || ipv6.is_unicast_link_local()
            }
        };
    }

    false
}

#[cfg(target_os = "android")]
fn validate_android_webview_url(url: &str, network_id: &str) -> Result<url::Url, String> {
    let parsed: url::Url = url
        .parse()
        .map_err(|e: url::ParseError| format!("invalid Android URL: {e}"))?;

    if parsed.scheme() != "https" {
        return Err("Android webview URL rejected: only https scheme is allowed".to_string());
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "Android webview URL rejected: host is missing".to_string())?
        .to_ascii_lowercase();

    if is_disallowed_webview_host(&host) {
        return Err(format!(
            "Android webview URL rejected: host `{host}` is not allowed"
        ));
    }

    let allowed_hosts = allowed_hosts_for_network(network_id);
    if allowed_hosts.is_empty() {
        return Err(format!(
            "Android webview URL rejected: network `{network_id}` is not allowlisted"
        ));
    }

    if !allowed_hosts
        .iter()
        .any(|allowed| host_matches_allowlist(&host, allowed))
    {
        return Err(format!(
            "Android webview URL rejected: host `{host}` is not allowed for `{network_id}`"
        ));
    }

    Ok(parsed)
}

#[cfg(target_os = "android")]
fn validate_android_storage_origins(
    storage_origins: Option<Vec<String>>,
    network_id: &str,
) -> Result<Vec<String>, String> {
    let Some(raw_origins) = storage_origins else {
        return Ok(Vec::new());
    };

    let allowed_hosts = allowed_hosts_for_network(network_id);
    if allowed_hosts.is_empty() {
        return Err(format!(
            "Android storage origins rejected: network `{network_id}` is not allowlisted"
        ));
    }

    let mut seen = std::collections::HashSet::new();
    let mut normalized_origins = Vec::new();

    for raw in raw_origins {
        let parsed: url::Url = raw
            .parse()
            .map_err(|e: url::ParseError| format!("invalid Android storage origin: {e}"))?;

        if parsed.scheme() != "https" {
            return Err(
                "Android storage origins rejected: only https scheme is allowed".to_string(),
            );
        }

        let host = parsed
            .host_str()
            .ok_or_else(|| "Android storage origins rejected: host is missing".to_string())?
            .to_ascii_lowercase();

        if is_disallowed_webview_host(&host) {
            return Err(format!(
                "Android storage origins rejected: host `{host}` is not allowed"
            ));
        }

        if !allowed_hosts
            .iter()
            .any(|allowed| host_matches_allowlist(&host, allowed))
        {
            return Err(format!(
                "Android storage origins rejected: host `{host}` is not allowed for `{network_id}`"
            ));
        }

        let normalized = match parsed.port() {
            Some(443) | None => format!("https://{host}"),
            Some(port) => format!("https://{host}:{port}"),
        };

        if seen.insert(normalized.clone()) {
            normalized_origins.push(normalized);
        }
    }

    Ok(normalized_origins)
}

#[cfg(target_os = "android")]
fn validate_android_storage_origins_by_network(
    storage_origins_by_network: Option<HashMap<String, Vec<String>>>,
    network_ids: &[String],
) -> Result<HashMap<String, Vec<String>>, String> {
    let Some(raw_origins_by_network) = storage_origins_by_network else {
        return Ok(HashMap::new());
    };

    let visible_network_ids = network_ids
        .iter()
        .map(String::as_str)
        .collect::<HashSet<_>>();
    let mut validated = HashMap::new();

    for (network_id, origins) in raw_origins_by_network {
        if !visible_network_ids.contains(network_id.as_str()) {
            return Err(format!(
                "Android storage origins rejected: network `{network_id}` is not visible"
            ));
        }

        let normalized = validate_android_storage_origins(Some(origins), &network_id)?;
        if !normalized.is_empty() {
            validated.insert(network_id, normalized);
        }
    }

    Ok(validated)
}

#[derive(Default)]
struct AndroidOAuthReplayState(std::sync::Mutex<std::collections::HashMap<String, i64>>);

#[cfg(target_os = "android")]
fn now_millis() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

#[cfg(target_os = "android")]
fn prune_consumed_oauth_states(
    consumed_states: &mut std::collections::HashMap<String, i64>,
    now: i64,
) {
    consumed_states.retain(|_, timestamp| now - *timestamp <= OAUTH_CALLBACK_TTL_MS);
}

#[cfg(target_os = "android")]
fn validate_android_oauth_callback_url(callback_url: &str) -> Result<url::Url, String> {
    let parsed: url::Url = callback_url
        .parse()
        .map_err(|e: url::ParseError| format!("invalid Android OAuth callback URL: {e}"))?;

    let scheme = parsed.scheme();
    if scheme != "https" && scheme != "communityglows" {
        return Err("Android OAuth callback rejected: scheme is not allowlisted".to_string());
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "Android OAuth callback rejected: host is missing".to_string())?
        .to_ascii_lowercase();

    if is_disallowed_webview_host(&host) {
        return Err(format!(
            "Android OAuth callback rejected: host `{host}` is not allowed"
        ));
    }

    if !android_allowed_oauth_callback_hosts()
        .iter()
        .any(|allowed| host_matches_allowlist(&host, allowed))
    {
        return Err(format!(
            "Android OAuth callback rejected: host `{host}` is not in callback allowlist"
        ));
    }

    Ok(parsed)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

#[cfg(not(target_os = "android"))]
fn validate_desktop_session_segment(value: &str, field: &str) -> Result<(), String> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
    {
        return Err(format!("Invalid desktop WebView {field}"));
    }
    Ok(())
}

#[cfg(not(target_os = "android"))]
fn validate_desktop_webview_identity(profile_id: &str, network_id: &str) -> Result<(), String> {
    validate_desktop_session_segment(profile_id, "profile ID")?;
    validate_desktop_session_segment(network_id, "network ID")?;
    if allowed_hosts_for_network(network_id).is_empty() && !is_custom_network_id(network_id) {
        return Err("Unknown desktop WebView network ID".to_string());
    }
    Ok(())
}

#[cfg(not(target_os = "android"))]
fn is_custom_network_id(network_id: &str) -> bool {
    let Some(identifier) = network_id.strip_prefix("custom-") else {
        return false;
    };
    let groups = identifier.split('-').collect::<Vec<_>>();
    if groups.len() != 5
        || groups
            .iter()
            .zip([8, 4, 4, 4, 12])
            .any(|(group, length)| {
                group.len() != length || !group.bytes().all(|byte| byte.is_ascii_hexdigit())
            })
    {
        return false;
    }
    matches!(groups[2].as_bytes()[0], b'1'..=b'5')
        && matches!(groups[3].as_bytes()[0].to_ascii_lowercase(), b'8' | b'9' | b'a' | b'b')
}

#[cfg(not(target_os = "android"))]
fn parse_desktop_webview_url(raw: &str, network_id: &str) -> Result<url::Url, String> {
    let parsed = raw
        .parse::<url::Url>()
        .map_err(|_| "Invalid desktop WebView URL".to_string())?;
    if parsed.scheme() != "https"
        || parsed.host_str().is_none()
        || !parsed.username().is_empty()
        || parsed.password().is_some()
    {
        return Err("Desktop WebView URLs must use HTTPS".to_string());
    }
    let host = parsed
        .host_str()
        .expect("validated URL host")
        .to_ascii_lowercase();
    if is_disallowed_webview_host(&host) {
        return Err("Desktop WebView host is not allowed".to_string());
    }

    let allowed_hosts = allowed_hosts_for_network(network_id);
    if allowed_hosts.is_empty() {
        if !is_custom_network_id(network_id) {
            return Err("Unknown desktop WebView network ID".to_string());
        }
    } else if !allowed_hosts
        .iter()
        .any(|allowed_host| host_matches_allowlist(&host, allowed_host))
    {
        return Err("Desktop WebView host is not allowed for this network".to_string());
    }
    Ok(parsed)
}

#[cfg(not(target_os = "android"))]
fn validate_desktop_webview_bounds(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if !x.is_finite()
        || !y.is_finite()
        || !width.is_finite()
        || !height.is_finite()
        || width <= 0.0
        || height <= 0.0
    {
        return Err("Invalid desktop WebView bounds".to_string());
    }
    Ok(())
}

/// Unique label per (profile, network) pair — ensures isolated webviews.
#[cfg(not(target_os = "android"))]
fn webview_label(profile_id: &str, network_id: &str) -> String {
    format!("social-{}-{}", profile_id, network_id)
}

/// A child webview can only receive focus when it has a rendered surface.
///
/// Keeping focus on a hidden or unrendered webview would send desktop
/// password-manager input to a document instead of the form the user can see.
#[cfg(not(target_os = "android"))]
fn has_visible_desktop_webview_bounds(width: f64, height: f64) -> bool {
    width > 0.0 && height > 0.0
}

#[cfg(not(target_os = "android"))]
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct PortableCookieTarget {
    profile_id: String,
    network_id: String,
    url: String,
}

// ─── Tray setup (desktop only) ───────────────────────────────────────────────

#[cfg(not(target_os = "android"))]
fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show CommunityGlows", true, None::<&str>)?;
    let separator = MenuItem::with_id(app, "sep", "──────────────", false, None::<&str>)?;
    let twitter = MenuItem::with_id(app, "tray:twitter", "Twitter / X", true, None::<&str>)?;
    let instagram = MenuItem::with_id(app, "tray:instagram", "Instagram", true, None::<&str>)?;
    let linkedin = MenuItem::with_id(app, "tray:linkedin", "LinkedIn", true, None::<&str>)?;
    let facebook = MenuItem::with_id(app, "tray:facebook", "Facebook", true, None::<&str>)?;
    let tiktok = MenuItem::with_id(app, "tray:tiktok", "TikTok", true, None::<&str>)?;
    let threads = MenuItem::with_id(app, "tray:threads", "Threads", true, None::<&str>)?;
    let discord = MenuItem::with_id(app, "tray:discord", "Discord", true, None::<&str>)?;
    let reddit = MenuItem::with_id(app, "tray:reddit", "Reddit", true, None::<&str>)?;
    let snapchat = MenuItem::with_id(app, "tray:snapchat", "Snapchat", true, None::<&str>)?;
    let quora = MenuItem::with_id(app, "tray:quora", "Quora", true, None::<&str>)?;
    let pinterest = MenuItem::with_id(app, "tray:pinterest", "Pinterest", true, None::<&str>)?;
    let whatsapp = MenuItem::with_id(app, "tray:whatsapp", "WhatsApp", true, None::<&str>)?;
    let telegram = MenuItem::with_id(app, "tray:telegram", "Telegram", true, None::<&str>)?;
    let nextdoor = MenuItem::with_id(app, "tray:nextdoor", "Nextdoor", true, None::<&str>)?;
    let patreon = MenuItem::with_id(app, "tray:patreon", "Patreon", true, None::<&str>)?;
    let theresanaiforthat = MenuItem::with_id(
        app,
        "tray:theresanaiforthat",
        "There's An AI For That",
        true,
        None::<&str>,
    )?;
    let industrysocial = MenuItem::with_id(
        app,
        "tray:industrysocial",
        "Industry Social",
        true,
        None::<&str>,
    )?;
    let bluesky = MenuItem::with_id(app, "tray:bluesky", "Bluesky", true, None::<&str>)?;
    let mastodon = MenuItem::with_id(app, "tray:mastodon", "Mastodon", true, None::<&str>)?;
    let substack = MenuItem::with_id(app, "tray:substack", "Substack", true, None::<&str>)?;
    let ko_fi = MenuItem::with_id(app, "tray:ko-fi", "Ko-fi", true, None::<&str>)?;
    let buymeacoffee = MenuItem::with_id(
        app,
        "tray:buymeacoffee",
        "Buy Me a Coffee",
        true,
        None::<&str>,
    )?;
    let producthunt =
        MenuItem::with_id(app, "tray:producthunt", "Product Hunt", true, None::<&str>)?;
    let indiehackers = MenuItem::with_id(
        app,
        "tray:indiehackers",
        "Indie Hackers",
        true,
        None::<&str>,
    )?;
    let hackernews = MenuItem::with_id(
        app,
        "tray:hackernews",
        "Hacker News / Show HN",
        true,
        None::<&str>,
    )?;
    let folloverse = MenuItem::with_id(app, "tray:folloverse", "Folloverse", true, None::<&str>)?;
    let industrysocial_waitlist = MenuItem::with_id(
        app,
        "tray:industrysocial-waitlist",
        "Industry Social Waitlist",
        true,
        None::<&str>,
    )?;
    let koru = MenuItem::with_id(app, "tray:koru", "Koru", true, None::<&str>)?;
    let medium = MenuItem::with_id(app, "tray:medium", "Medium", true, None::<&str>)?;
    let luma = MenuItem::with_id(app, "tray:luma", "Luma", true, None::<&str>)?;
    let sep2 = MenuItem::with_id(app, "sep2", "──────────────", false, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show,
            &separator,
            &twitter,
            &instagram,
            &linkedin,
            &facebook,
            &tiktok,
            &threads,
            &discord,
            &reddit,
            &snapchat,
            &quora,
            &pinterest,
            &whatsapp,
            &telegram,
            &nextdoor,
            &patreon,
            &theresanaiforthat,
            &industrysocial,
            &bluesky,
            &mastodon,
            &substack,
            &ko_fi,
            &buymeacoffee,
            &producthunt,
            &indiehackers,
            &hackernews,
            &folloverse,
            &industrysocial_waitlist,
            &koru,
            &medium,
            &luma,
            &sep2,
            &quit,
        ],
    )?;

    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png")).ok();

    let mut tray_builder = TrayIconBuilder::new();
    if let Some(icon) = icon {
        tray_builder = tray_builder.icon(icon);
    }

    tray_builder
        .tooltip("CommunityGlows")
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => show_window(app),
            "quit" => app.exit(0),
            id if id.starts_with("tray:") => {
                let network = id.trim_start_matches("tray:");
                show_window(app);
                let _ = app.emit("tray:open-network", network.to_string());
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                toggle_window(app);
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg(not(target_os = "android"))]
fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.unminimize();
    }
}

#[cfg(not(target_os = "android"))]
fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

// ─── IPC commands ────────────────────────────────────────────────────────────

#[cfg(target_os = "windows")]
fn extract_bitwarden_archive(
    archive_path: &std::path::Path,
    destination: &std::path::Path,
    expected_sha256: &str,
) -> Result<String, String> {
    if !archive_path
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("zip"))
    {
        return Err("Select the official Bitwarden Chromium ZIP archive".to_string());
    }
    let archive_size = std::fs::metadata(archive_path)
        .map_err(|_| "The selected Bitwarden archive cannot be read")?
        .len();
    if archive_size == 0 || archive_size > MAX_BITWARDEN_ARCHIVE_BYTES {
        return Err("The selected Bitwarden archive has an invalid size".to_string());
    }

    verify_bitwarden_archive_sha256(archive_path, expected_sha256)?;

    let file = std::fs::File::open(archive_path)
        .map_err(|_| "The selected Bitwarden archive cannot be opened")?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|_| "The selected file is not a valid ZIP archive")?;
    if archive.is_empty() || archive.len() > MAX_BITWARDEN_ARCHIVE_ENTRIES {
        return Err("The selected Bitwarden archive contains too many files".to_string());
    }

    std::fs::create_dir_all(destination)
        .map_err(|_| "The local Bitwarden installation directory cannot be created")?;
    let mut total_extracted = 0_u64;
    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|_| "The Bitwarden archive contains an unreadable entry")?;
        let enclosed = entry
            .enclosed_name()
            .ok_or_else(|| "The Bitwarden archive contains an unsafe path".to_string())?
            .to_owned();
        if entry
            .unix_mode()
            .is_some_and(|mode| mode & 0o170000 == 0o120000)
        {
            return Err("The Bitwarden archive contains a symbolic link".to_string());
        }
        total_extracted = total_extracted
            .checked_add(entry.size())
            .ok_or_else(|| "The Bitwarden archive is too large".to_string())?;
        if total_extracted > MAX_BITWARDEN_EXTRACTED_BYTES {
            return Err("The Bitwarden archive expands beyond the allowed size".to_string());
        }

        let target = destination.join(enclosed);
        if entry.is_dir() {
            std::fs::create_dir_all(&target)
                .map_err(|_| "A Bitwarden extension directory cannot be created")?;
            continue;
        }
        let parent = target
            .parent()
            .ok_or_else(|| "The Bitwarden archive contains an invalid path".to_string())?;
        std::fs::create_dir_all(parent)
            .map_err(|_| "A Bitwarden extension directory cannot be created")?;
        let mut output = std::fs::File::create(&target)
            .map_err(|_| "A Bitwarden extension file cannot be created")?;
        std::io::copy(&mut entry, &mut output)
            .map_err(|_| "A Bitwarden extension file cannot be extracted")?;
    }

    let manifest_path = destination.join("manifest.json");
    let manifest = std::fs::read_to_string(manifest_path)
        .map_err(|_| "The archive root has no Bitwarden manifest.json")?;
    validate_bitwarden_extension_manifest(&manifest)?;
    Ok(bitwarden_extension_version(&manifest).unwrap_or_else(|| "unknown".to_string()))
}

#[cfg(target_os = "windows")]
fn normalize_sha256(value: &str) -> Result<String, String> {
    let normalized = value
        .trim()
        .strip_prefix("sha256:")
        .unwrap_or(value.trim())
        .trim()
        .to_ascii_lowercase();
    if normalized.len() != 64 || !normalized.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(
            "Enter the SHA-256 digest shown on the official Bitwarden GitHub release".to_string(),
        );
    }
    Ok(normalized)
}

#[cfg(target_os = "windows")]
fn sha256_hex(digest: &[u8]) -> String {
    use std::fmt::Write;

    digest.iter().fold(
        String::with_capacity(digest.len() * 2),
        |mut encoded, byte| {
            write!(encoded, "{byte:02x}").expect("writing to a String cannot fail");
            encoded
        },
    )
}

#[cfg(target_os = "windows")]
fn verify_bitwarden_archive_sha256(
    archive_path: &std::path::Path,
    expected_sha256: &str,
) -> Result<(), String> {
    use sha2::{Digest, Sha256};
    use std::io::Read;

    let expected = normalize_sha256(expected_sha256)?;
    let mut file = std::fs::File::open(archive_path)
        .map_err(|_| "The selected Bitwarden archive cannot be opened")?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|_| "The selected Bitwarden archive cannot be verified")?;
        if read == 0 {
            break;
        }
        digest.update(&buffer[..read]);
    }
    let actual = sha256_hex(digest.finalize().as_slice());
    if actual != expected {
        return Err(
            "The archive SHA-256 does not match the digest published by Bitwarden".to_string(),
        );
    }
    Ok(())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn get_bitwarden_extension_status(
    app: AppHandle,
) -> Result<BitwardenExtensionStatus, String> {
    let restart_required = *app
        .state::<BitwardenExtensionRuntimeState>()
        .0
        .lock()
        .map_err(|_| "Bitwarden extension state lock poisoned")?;
    let (path, source) = match environment_bitwarden_extension_path()? {
        Some(path) => (Some(path), "environment"),
        None => (managed_bitwarden_extension_path(&app)?, "managed"),
    };
    let version = match &path {
        Some(path) => {
            let manifest = std::fs::read_to_string(path.join("manifest.json"))
                .map_err(|_| "The installed Bitwarden manifest cannot be read")?;
            bitwarden_extension_version(&manifest)
        }
        None => None,
    };
    Ok(BitwardenExtensionStatus {
        supported: true,
        installed: path.is_some(),
        source: if path.is_some() { source } else { "none" }.to_string(),
        version,
        restart_required,
    })
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn get_bitwarden_extension_status(
    _app: AppHandle,
) -> Result<BitwardenExtensionStatus, String> {
    Ok(BitwardenExtensionStatus {
        supported: false,
        installed: false,
        source: "none".to_string(),
        version: None,
        restart_required: false,
    })
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn import_bitwarden_extension(
    app: AppHandle,
    archive_path: String,
    expected_sha256: String,
) -> Result<BitwardenExtensionStatus, String> {
    if environment_bitwarden_extension_path()?.is_some() {
        return Err("Bitwarden is controlled by a developer environment setting".to_string());
    }

    let root = bitwarden_extensions_root(&app)?;
    std::fs::create_dir_all(&root)
        .map_err(|_| "The CommunityGlows extension directory cannot be created")?;
    let package_name = format!(
        "bitwarden-{}",
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
    );
    let destination = root.join(&package_name);
    let extraction = extract_bitwarden_archive(
        std::path::Path::new(&archive_path),
        &destination,
        &expected_sha256,
    );
    if let Err(error) = extraction {
        let _ = std::fs::remove_dir_all(&destination);
        return Err(error);
    }

    let config = ManagedBitwardenInstallation {
        schema_version: 1,
        relative_directory: package_name,
    };
    let serialized = serde_json::to_vec_pretty(&config)
        .map_err(|_| "The local Bitwarden installation settings cannot be encoded")?;
    if std::fs::write(root.join(BITWARDEN_INSTALLATION_CONFIG), serialized).is_err() {
        let _ = std::fs::remove_dir_all(&destination);
        return Err("The local Bitwarden installation settings cannot be saved".to_string());
    }
    *app
        .state::<BitwardenExtensionRuntimeState>()
        .0
        .lock()
        .map_err(|_| "Bitwarden extension state lock poisoned")? = true;
    get_bitwarden_extension_status(app)
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn import_bitwarden_extension(
    _app: AppHandle,
    _archive_path: String,
    _expected_sha256: String,
) -> Result<BitwardenExtensionStatus, String> {
    Err("Bitwarden extension import is available on Windows only".to_string())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn disable_bitwarden_extension(app: AppHandle) -> Result<BitwardenExtensionStatus, String> {
    if environment_bitwarden_extension_path()?.is_some() {
        return Err("Bitwarden is controlled by a developer environment setting".to_string());
    }
    let config_path = bitwarden_extensions_root(&app)?.join(BITWARDEN_INSTALLATION_CONFIG);
    match std::fs::remove_file(config_path) {
        Ok(()) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(_) => return Err("The local Bitwarden installation cannot be disabled".to_string()),
    }
    *app
        .state::<BitwardenExtensionRuntimeState>()
        .0
        .lock()
        .map_err(|_| "Bitwarden extension state lock poisoned")? = true;
    get_bitwarden_extension_status(app)
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn disable_bitwarden_extension(
    _app: AppHandle,
) -> Result<BitwardenExtensionStatus, String> {
    Err("Bitwarden extension settings are available on Windows only".to_string())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn open_bitwarden_download_page() -> Result<(), String> {
    std::process::Command::new("explorer.exe")
        .arg(BITWARDEN_RELEASES_URL)
        .spawn()
        .map(|_| ())
        .map_err(|_| "The official Bitwarden download page could not be opened".to_string())
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn open_bitwarden_download_page() -> Result<(), String> {
    Err("The Bitwarden download flow is available on Windows only".to_string())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn restart_communityglows(app: AppHandle) -> Result<(), String> {
    app.request_restart();
    Ok(())
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn restart_communityglows(_app: AppHandle) -> Result<(), String> {
    Err("Application restart from Settings is available on Windows only".to_string())
}

// ── Desktop: native child webviews via add_child ─────────────────────────────

#[tauri::command]
#[cfg(not(target_os = "android"))]
async fn export_desktop_cookies(
    app: AppHandle,
    targets: Vec<PortableCookieTarget>,
) -> Result<String, String> {
    let mut snapshot = serde_json::Map::new();
    for target in targets {
        validate_desktop_webview_identity(&target.profile_id, &target.network_id)?;
        let url = parse_desktop_webview_url(&target.url, &target.network_id)?;
        let label = webview_label(&target.profile_id, &target.network_id);
        let (webview, is_temporary) = if let Some(webview) = app.get_webview(&label) {
            (webview, false)
        } else {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?
                .join("sessions")
                .join(&target.profile_id)
                .join(&target.network_id);
            if !data_dir.exists() {
                continue;
            }
            let window = app
                .get_window("main")
                .ok_or_else(|| "main window not found".to_string())?;
            let temporary_label = format!(
                "backup-cookie-{}",
                chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
            );
            let webview_builder = configure_bitwarden_extension(
                WebviewBuilder::new(&temporary_label, WebviewUrl::External(url.clone()))
                    .data_directory(data_dir)
                    .background_color(tauri::window::Color(9, 9, 11, 0)),
                &app,
            )?;
            let webview = window
                .add_child(
                    webview_builder,
                    tauri::LogicalPosition::new(-10_000.0, -10_000.0),
                    tauri::LogicalSize::new(1.0, 1.0),
                )
                .map_err(|e| format!("open saved session for backup: {e}"))?;
            (webview, true)
        };
        let cookie_webview = webview.clone();
        let cookies_result = std::thread::spawn(move || cookie_webview.cookies_for_url(url))
            .join()
            .map_err(|_| "desktop cookie export thread panicked".to_string());
        if is_temporary {
            webview
                .close()
                .map_err(|e| format!("close temporary backup webview: {e}"))?;
        }
        let cookies = cookies_result?.map_err(|e| e.to_string())?;
        if cookies.is_empty() {
            continue;
        }
        let header = cookies
            .iter()
            .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
            .collect::<Vec<_>>()
            .join("; ");
        snapshot.insert(
            format!("{}-{}|{}", target.profile_id, target.network_id, target.url),
            serde_json::Value::String(header),
        );
    }
    Ok(serde_json::Value::Object(snapshot).to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
async fn open_webview(
    app: AppHandle,
    url: String,
    profile_id: String,
    network_id: String,
    dark_mode: bool,
    _storage_origins: Option<Vec<String>>,
    hidden: Option<bool>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    validate_desktop_webview_bounds(x, y, width, height)?;
    let label = webview_label(&profile_id, &network_id);
    let parsed = parse_desktop_webview_url(&url, &network_id)?;
    let start_hidden = hidden.unwrap_or(false);

    if let Some(wv) = app.get_webview(&label) {
        wv.navigate(parsed).map_err(|e| e.to_string())?;
        wv.set_bounds(tauri::Rect {
            position: tauri::Position::Logical(tauri::LogicalPosition::new(x, y)),
            size: tauri::Size::Logical(tauri::LogicalSize::new(width, height)),
        })
        .map_err(|e| e.to_string())?;
        if start_hidden {
            wv.hide().map_err(|e| e.to_string())?;
        } else {
            wv.show().map_err(|e| e.to_string())?;
        }
        if !start_hidden && has_visible_desktop_webview_bounds(width, height) {
            wv.set_focus()
                .map_err(|e| format!("focus visible desktop webview: {e}"))?;
        }
        mark_desktop_webview(&app, &label, start_hidden)?;
        return Ok(());
    }

    evict_oldest_hidden_desktop_webviews(&app, &label)?;

    // Session data isolated per (profile, network) — cookies/localStorage/IndexedDB
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&profile_id)
        .join(&network_id);

    let window = app
        .get_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    let webview_builder = configure_bitwarden_extension(
        WebviewBuilder::new(&label, WebviewUrl::External(parsed))
            .data_directory(data_dir)
            // Do not let a preload become the active input target. Visible
            // children are focused explicitly below.
            .focused(false)
            // Paint the native surface before the remote document renders.
            .background_color(if dark_mode {
                tauri::window::Color(9, 9, 11, 255)
            } else {
                tauri::window::Color(248, 249, 250, 255)
            }),
        &app,
    )?;
    let webview = window
        .add_child(
            webview_builder,
            tauri::LogicalPosition::new(x, y),
            tauri::LogicalSize::new(width, height),
        )
        .map_err(|e| e.to_string())?;

    restore_portable_android_cookies(&app, &webview, &profile_id, &network_id)?;

    if start_hidden {
        webview.hide().map_err(|e| e.to_string())?;
    } else if has_visible_desktop_webview_bounds(width, height) {
        webview
            .set_focus()
            .map_err(|e| format!("focus visible desktop webview: {e}"))?;
    }

    mark_desktop_webview(&app, &label, start_hidden)?;

    Ok(())
}

#[cfg(not(target_os = "android"))]
fn restore_portable_android_cookies(
    app: &AppHandle,
    webview: &tauri::Webview,
    profile_id: &str,
    network_id: &str,
) -> Result<(), String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("portable-android-cookies.json");
    let raw = match std::fs::read_to_string(path) {
        Ok(raw) => raw,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(format!("read portable cookies: {error}")),
    };
    let snapshots: serde_json::Value =
        serde_json::from_str(&raw).map_err(|error| format!("parse portable cookies: {error}"))?;
    let Some(values) = snapshots.as_object() else {
        return Ok(());
    };
    let session_prefix = format!("{profile_id}-{network_id}|");

    for (key, value) in values {
        let Some(url) = key.strip_prefix(&session_prefix) else {
            continue;
        };
        let Some(header) = value.as_str() else {
            continue;
        };
        let parsed_url = match url.parse::<url::Url>() {
            Ok(url) if url.scheme() == "https" => url,
            _ => continue,
        };
        let Some(host) = parsed_url.host_str() else {
            continue;
        };
        let domain = host
            .split('.')
            .rev()
            .take(2)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect::<Vec<_>>()
            .join(".");
        for part in header.split(';') {
            let pair = part.trim();
            if !pair.contains('=') {
                continue;
            }
            let name = pair.split('=').next().unwrap_or_default();
            let attributes = if name.starts_with("__Host-") {
                format!("{pair}; Path=/; Secure")
            } else {
                format!("{pair}; Domain=.{domain}; Path=/; Secure")
            };
            if let Ok(cookie) = tauri::webview::Cookie::parse(attributes) {
                let _ = webview.set_cookie(cookie.into_owned());
            }
        }
    }
    Ok(())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
async fn navigate_webview(
    app: AppHandle,
    url: String,
    profile_id: String,
    network_id: String,
) -> Result<(), String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    let label = webview_label(&profile_id, &network_id);
    if let Some(wv) = app.get_webview(&label) {
        let parsed = parse_desktop_webview_url(&url, &network_id)?;
        wv.navigate(parsed).map_err(|e| e.to_string())?;
        return Ok(());
    }
    Ok(())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn navigate_webview(
    app: AppHandle,
    url: String,
    _profile_id: String,
    network_id: String,
) -> Result<(), String> {
    let validated_url = validate_android_webview_url(&url, &network_id)?;
    app.android_webview()
        .navigate(validated_url.as_str(), &network_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn resize_webview(
    app: AppHandle,
    profile_id: String,
    network_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    validate_desktop_webview_bounds(x, y, width, height)?;
    let label = webview_label(&profile_id, &network_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.set_bounds(tauri::Rect {
            position: tauri::Position::Logical(tauri::LogicalPosition::new(x, y)),
            size: tauri::Size::Logical(tauri::LogicalSize::new(width, height)),
        })
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn close_webview(app: AppHandle, profile_id: String, network_id: String) -> Result<(), String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    let label = webview_label(&profile_id, &network_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.close().map_err(|e| e.to_string())?;
    }
    let state = app.state::<DesktopWebviewPoolState>();
    state
        .entries
        .lock()
        .map_err(|_| "webview pool lock poisoned")?
        .remove(&label);
    Ok(())
}

/// Hide a webview without destroying it (webview pooling).
#[tauri::command]
#[cfg(not(target_os = "android"))]
fn hide_webview(app: AppHandle, profile_id: String, network_id: String) -> Result<(), String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    let label = webview_label(&profile_id, &network_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.hide().map_err(|e| e.to_string())?;
        // Hiding a child does not move focus. Return it to the host so desktop
        // input cannot target a pooled form.
        if let Some(host_webview) = app.get_webview("main") {
            host_webview
                .set_focus()
                .map_err(|e| format!("focus host webview after hiding child: {e}"))?;
        }
        mark_desktop_webview(&app, &label, true)?;
    }
    Ok(())
}

/// Show a previously hidden pooled webview. Returns true if the webview
/// existed (and was repositioned), false if it needs to be created.
#[tauri::command]
#[cfg(not(target_os = "android"))]
fn show_webview(
    app: AppHandle,
    profile_id: String,
    network_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<bool, String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    validate_desktop_webview_bounds(x, y, width, height)?;
    let label = webview_label(&profile_id, &network_id);
    if let Some(wv) = app.get_webview(&label) {
        wv.set_bounds(tauri::Rect {
            position: tauri::Position::Logical(tauri::LogicalPosition::new(x, y)),
            size: tauri::Size::Logical(tauri::LogicalSize::new(width, height)),
        })
        .map_err(|e| e.to_string())?;
        wv.show().map_err(|e| e.to_string())?;
        if has_visible_desktop_webview_bounds(width, height) {
            wv.set_focus()
                .map_err(|e| format!("focus visible desktop webview: {e}"))?;
        }
        mark_desktop_webview(&app, &label, false)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn get_desktop_webview_pool_stats(app: AppHandle) -> Result<DesktopWebviewPoolStats, String> {
    let state = app.state::<DesktopWebviewPoolState>();
    let entries = state
        .entries
        .lock()
        .map_err(|_| "webview pool lock poisoned")?;
    let hidden = entries.values().filter(|entry| entry.hidden).count();
    Ok(DesktopWebviewPoolStats {
        total: entries.len(),
        visible: entries.len().saturating_sub(hidden),
        hidden,
        pooling_enabled: None,
    })
}

// ── Android: delegate to Kotlin plugin ───────────────────────────────────────

#[tauri::command]
#[cfg(target_os = "android")]
fn open_webview(
    app: AppHandle,
    url: String,
    profile_id: String,
    network_id: String,
    _dark_mode: bool,
    storage_origins: Option<Vec<String>>,
    _hidden: Option<bool>,
    _x: f64,
    _y: f64,
    _width: f64,
    _height: f64,
) -> Result<(), String> {
    let validated_url = validate_android_webview_url(&url, &network_id)?;
    let validated_storage_origins = validate_android_storage_origins(storage_origins, &network_id)?;

    // Use "profileId-networkId" as the session key for Android
    let session_key = format!("{}-{}", profile_id, network_id);
    app.android_webview()
        .open(
            validated_url.as_str(),
            &session_key,
            &network_id,
            validated_storage_origins,
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn validate_android_oauth_callback(
    app: AppHandle,
    callback_url: String,
    expected_state: String,
    expected_nonce: Option<String>,
    started_at_ms: i64,
) -> Result<(), String> {
    let parsed = validate_android_oauth_callback_url(&callback_url)?;
    let now = now_millis();

    if started_at_ms <= 0 || now - started_at_ms > OAUTH_CALLBACK_TTL_MS {
        return Err("Android OAuth callback rejected: request expired".to_string());
    }

    let callback_state = parsed
        .query_pairs()
        .find_map(|(key, value)| (key == "state").then(|| value.into_owned()))
        .ok_or_else(|| "Android OAuth callback rejected: state is missing".to_string())?;

    if callback_state != expected_state {
        return Err("Android OAuth callback rejected: state mismatch".to_string());
    }

    if let Some(expected_nonce) = expected_nonce {
        let callback_nonce = parsed
            .query_pairs()
            .find_map(|(key, value)| (key == "nonce").then(|| value.into_owned()))
            .ok_or_else(|| "Android OAuth callback rejected: nonce is missing".to_string())?;
        if callback_nonce != expected_nonce {
            return Err("Android OAuth callback rejected: nonce mismatch".to_string());
        }
    }

    let replay_state = app.state::<AndroidOAuthReplayState>();
    let mut consumed_states = replay_state
        .0
        .lock()
        .map_err(|_| "Android OAuth callback rejected: replay state unavailable".to_string())?;
    prune_consumed_oauth_states(&mut consumed_states, now);
    if consumed_states.contains_key(&callback_state) {
        return Err("Android OAuth callback rejected: state replay detected".to_string());
    }
    consumed_states.insert(callback_state, now);

    Ok(())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn validate_android_oauth_callback(
    _app: AppHandle,
    _callback_url: String,
    _expected_state: String,
    _expected_nonce: Option<String>,
    _started_at_ms: i64,
) -> Result<(), String> {
    Err("Android OAuth callback validation is only available on Android".to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn resize_webview(
    _app: AppHandle,
    _profile_id: String,
    _network_id: String,
    _x: f64,
    _y: f64,
    _width: f64,
    _height: f64,
) -> Result<(), String> {
    // On Android the social webview is always full-screen; resize is a no-op
    Ok(())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn close_webview(app: AppHandle, profile_id: String, network_id: String) -> Result<(), String> {
    let session_key = format!("{}-{}", profile_id, network_id);
    app.android_webview()
        .close(&session_key)
        .map_err(|e| e.to_string())
}

// Android: keep/show live Kotlin WebView hosts when the native plugin can pool them.
#[tauri::command]
#[cfg(target_os = "android")]
fn hide_webview(app: AppHandle, profile_id: String, network_id: String) -> Result<(), String> {
    let session_key = format!("{}-{}", profile_id, network_id);
    app.android_webview()
        .hide(&session_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn show_webview(
    app: AppHandle,
    profile_id: String,
    network_id: String,
    _x: f64,
    _y: f64,
    _width: f64,
    _height: f64,
) -> Result<bool, String> {
    let session_key = format!("{}-{}", profile_id, network_id);
    app.android_webview()
        .show(&session_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn get_desktop_webview_pool_stats(app: AppHandle) -> Result<DesktopWebviewPoolStats, String> {
    let stats = app
        .android_webview()
        .pool_stats()
        .map_err(|e| e.to_string())?;
    Ok(DesktopWebviewPoolStats {
        total: stats.total,
        visible: stats.visible,
        hidden: stats.hidden,
        pooling_enabled: Some(stats.pooling_enabled),
    })
}

#[tauri::command]
#[cfg(target_os = "android")]
fn set_grayscale(app: AppHandle, enabled: bool) -> Result<(), String> {
    app.android_webview()
        .set_grayscale(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_grayscale(_app: AppHandle, _enabled: bool) -> Result<(), String> {
    Ok(()) // no-op on desktop — Vue applies the CSS filter directly
}

#[tauri::command]
#[cfg(target_os = "android")]
fn set_dark_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    app.android_webview()
        .set_dark_mode(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_dark_mode(_app: AppHandle, _enabled: bool) -> Result<(), String> {
    Ok(()) // no-op on desktop — Vue applies the CSS class directly
}

#[tauri::command]
#[cfg(target_os = "android")]
fn set_text_zoom(app: AppHandle, level: i32) -> Result<(), String> {
    app.android_webview()
        .set_text_zoom(level)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_text_zoom(_app: AppHandle, _level: i32) -> Result<(), String> {
    Ok(()) // no-op on desktop
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_webview_preferences(
    app: AppHandle,
    profile_id: Option<String>,
    network_id: Option<String>,
    grayscale: bool,
    dark_mode: bool,
    text_zoom: i32,
) -> Result<(), String> {
    let (Some(profile_id), Some(network_id)) = (profile_id, network_id) else {
        return Ok(());
    };
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    let label = webview_label(&profile_id, &network_id);
    let Some(wv) = app.get_webview(&label) else {
        return Ok(());
    };
    let zoom = text_zoom.clamp(50, 200);
    let filter = if grayscale { "grayscale(1)" } else { "none" };
    let color_scheme = if dark_mode { "dark" } else { "light" };
    let script = format!(
        "(() => {{ const root = document.documentElement; root.style.filter = '{filter}'; root.style.colorScheme = '{color_scheme}'; document.body && (document.body.style.zoom = '{zoom}%'); }})()"
    );
    wv.eval(script).map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(target_os = "android")]
fn set_webview_preferences(
    _app: AppHandle,
    _profile_id: Option<String>,
    _network_id: Option<String>,
    _grayscale: bool,
    _dark_mode: bool,
    _text_zoom: i32,
) -> Result<(), String> {
    Ok(())
}

/// Sync the bottom bar network icons with the profile's visible networks.
#[tauri::command]
#[cfg(target_os = "android")]
fn set_bar_networks(
    app: AppHandle,
    network_ids: Vec<String>,
    storage_origins_by_network: Option<HashMap<String, Vec<String>>>,
) -> Result<(), String> {
    let validated_storage_origins_by_network =
        validate_android_storage_origins_by_network(storage_origins_by_network, &network_ids)?;

    app.android_webview()
        .set_bar_networks(network_ids, validated_storage_origins_by_network)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_bar_networks(
    _app: AppHandle,
    _network_ids: Vec<String>,
    _storage_origins_by_network: Option<HashMap<String, Vec<String>>>,
) -> Result<(), String> {
    Ok(()) // no-op on desktop — no overlay bar
}

/// Send profile list to the Android popup menu for inline profile switching.
#[tauri::command]
#[cfg(target_os = "android")]
fn set_profiles(
    app: AppHandle,
    profiles_json: String,
    active_profile_id: String,
) -> Result<(), String> {
    app.android_webview()
        .set_profiles(profiles_json, active_profile_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_profiles(
    _app: AppHandle,
    _profiles_json: String,
    _active_profile_id: String,
) -> Result<(), String> {
    Ok(())
}

/// Sync the UI locale to the Android plugin for native string translations.
#[tauri::command]
#[cfg(target_os = "android")]
fn set_locale(app: AppHandle, locale: String) -> Result<(), String> {
    app.android_webview()
        .set_locale(locale)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "android"))]
fn set_locale(_app: AppHandle, _locale: String) -> Result<(), String> {
    Ok(())
}

// ── Session deletion ─────────────────────────────────────────────────────────

/// Wipe all session data for a profile (all networks).
/// Desktop: delete the filesystem data directory.
#[tauri::command]
#[cfg(not(target_os = "android"))]
fn delete_profile_session(app: AppHandle, profile_id: String) -> Result<(), String> {
    validate_desktop_session_segment(&profile_id, "profile ID")?;
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&profile_id);

    close_desktop_profile_webviews(&app, &profile_id)?;
    if data_dir.exists() {
        std::fs::remove_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Android: delegate to Kotlin plugin to clear SharedPreferences cookies.
#[tauri::command]
#[cfg(target_os = "android")]
fn delete_profile_session(app: AppHandle, profile_id: String) -> Result<(), String> {
    app.android_webview()
        .delete_profile_session(&profile_id)
        .map_err(|e| e.to_string())
}

/// Wipe session data for a single (profile, network) pair.
/// Desktop: delete the filesystem data directory.
#[tauri::command]
#[cfg(not(target_os = "android"))]
fn delete_network_session(
    app: AppHandle,
    profile_id: String,
    network_id: String,
) -> Result<(), String> {
    validate_desktop_webview_identity(&profile_id, &network_id)?;
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("sessions")
        .join(&profile_id)
        .join(&network_id);

    close_webview(app.clone(), profile_id.clone(), network_id.clone())?;
    if data_dir.exists() {
        std::fs::remove_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Android: delegate to Kotlin plugin to clear SharedPreferences cookies.
#[tauri::command]
#[cfg(target_os = "android")]
fn delete_network_session(
    app: AppHandle,
    profile_id: String,
    network_id: String,
) -> Result<(), String> {
    app.android_webview()
        .delete_network_session(&profile_id, &network_id)
        .map_err(|e| e.to_string())
}

// ─── Backup / Restore ────────────────────────────────────────────────────────

/// Create an encrypted backup, save to disk, return the file path.
/// On Android the Tauri FS plugin is unreliable, so Rust handles all I/O directly.
#[tauri::command]
fn create_backup(app: AppHandle, store_data: String, password: String) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let sessions_dir = app_data.join("sessions");

    let zip_bytes = backup::create_backup_archive(&sessions_dir, &store_data)?;
    let blob = backup::encrypt_archive(&zip_bytes, &password)?;

    // Save encrypted blob to disk (backups/ dir inside app data)
    let backups_dir = app_data.join("backups");
    std::fs::create_dir_all(&backups_dir)
        .map_err(|e| format!("Failed to create backups dir: {e}"))?;

    let filename = format!(
        "communityglows-backup-{}.sfbak",
        chrono::Utc::now().timestamp_millis()
    );
    let file_path = backups_dir.join(&filename);
    std::fs::write(&file_path, &blob).map_err(|e| format!("Failed to write backup file: {e}"))?;

    // Also return base64 for desktop (file dialog flow)
    Ok(STANDARD.encode(&blob))
}

/// Restore from the most recent backup on disk, or from provided base64 data.
/// If encrypted_b64 is empty, auto-finds the latest .sfbak in the backups dir.
#[tauri::command]
fn restore_backup(
    app: AppHandle,
    encrypted_b64: String,
    password: String,
) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let sessions_dir = app_data.join("sessions");

    let blob = if encrypted_b64.is_empty() {
        // Auto-find latest backup on disk
        let backups_dir = app_data.join("backups");
        let mut backups: Vec<_> = std::fs::read_dir(&backups_dir)
            .map_err(|_| "Aucune sauvegarde trouvée. Exportez d'abord vos données.".to_string())?
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().is_some_and(|ext| ext == "sfbak"))
            .collect();
        backups.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        let latest = backups.first().ok_or_else(|| {
            "Aucune sauvegarde trouvée. Exportez d'abord vos données.".to_string()
        })?;
        std::fs::read(latest.path()).map_err(|e| format!("Failed to read backup file: {e}"))?
    } else {
        STANDARD
            .decode(&encrypted_b64)
            .map_err(|e| format!("Invalid backup data: {e}"))?
    };

    let zip_bytes = backup::decrypt_archive(&blob, &password)?;
    #[cfg(not(target_os = "android"))]
    close_all_desktop_webviews(&app)?;
    let store_data = backup::extract_backup_archive(&zip_bytes, &sessions_dir)?;
    #[cfg(not(target_os = "android"))]
    {
        let portable_cookies_path = app_data.join("portable-android-cookies.json");
        let cookie_snapshot = serde_json::from_str::<serde_json::Value>(&store_data)
            .ok()
            .and_then(|data| {
                data.get("android")?
                    .get("cookieSnapshot")?
                    .as_str()
                    .map(str::to_owned)
            });
        if let Some(snapshot) = cookie_snapshot.filter(|snapshot| !snapshot.trim().is_empty()) {
            std::fs::write(&portable_cookies_path, snapshot)
                .map_err(|e| format!("store portable Android cookies: {e}"))?;
        } else if portable_cookies_path.exists() {
            std::fs::remove_file(&portable_cookies_path)
                .map_err(|e| format!("clear portable Android cookies: {e}"))?;
        }
    }

    Ok(store_data)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Windows delivers protocol links through a new process. The single-instance
    // bridge forwards that event to the already running app instead.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .manage(AndroidOAuthReplayState::default())
        .manage(DesktopWebviewPoolState::default())
        .manage(BitwardenExtensionRuntimeState::default())
        .plugin(tauri_plugin_android_webview::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(not(target_os = "android"))]
            if let Err(err) = build_tray(app.handle()) {
                eprintln!("tray initialization failed: {err}");
            }
            #[cfg(target_os = "windows")]
            if let Err(err) = prune_inactive_managed_bitwarden_packages(app.handle()) {
                eprintln!("Bitwarden package cleanup failed: {err}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_webview,
            resize_webview,
            close_webview,
            validate_android_oauth_callback,
            hide_webview,
            show_webview,
            get_desktop_webview_pool_stats,
            navigate_webview,
            set_grayscale,
            set_dark_mode,
            set_text_zoom,
            set_webview_preferences,
            set_bar_networks,
            set_profiles,
            set_locale,
            delete_profile_session,
            delete_network_session,
            create_backup,
            restore_backup,
            get_bitwarden_extension_status,
            import_bitwarden_extension,
            disable_bitwarden_extension,
            open_bitwarden_download_page,
            restart_communityglows,
            #[cfg(not(target_os = "android"))]
            export_desktop_cookies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(all(test, not(target_os = "android")))]
mod tests {
    use super::{
        bitwarden_extension_version, has_visible_desktop_webview_bounds,
        parse_desktop_webview_url, validate_bitwarden_extension_manifest,
        validate_desktop_session_segment, validate_desktop_webview_bounds,
        validate_desktop_webview_identity,
    };
    #[cfg(target_os = "windows")]
    use super::sha256_hex;

    #[test]
    fn accepts_only_safe_desktop_webview_targets() {
        assert!(validate_desktop_webview_identity(
            "123e4567-e89b-42d3-a456-426614174000",
            "custom-123e4567-e89b-42d3-a456-426614174000",
        )
        .is_ok());
        assert!(parse_desktop_webview_url(
            "https://example.com/dashboard",
            "custom-123e4567-e89b-42d3-a456-426614174000",
        )
        .is_ok());
        assert!(validate_desktop_webview_bounds(12.5, 40.0, 800.0, 600.0).is_ok());
    }

    #[test]
    fn rejects_desktop_path_traversal_in_session_identifiers() {
        assert!(validate_desktop_session_segment("../profile", "profile ID").is_err());
        assert!(validate_desktop_session_segment("custom/foo", "network ID").is_err());
        assert!(validate_desktop_session_segment("", "network ID").is_err());
    }

    #[test]
    fn rejects_non_https_urls_and_invalid_native_bounds() {
        assert!(parse_desktop_webview_url("http://instagram.com", "instagram").is_err());
        assert!(parse_desktop_webview_url("file:///tmp/session", "instagram").is_err());
        assert!(parse_desktop_webview_url("https://user:secret@instagram.com", "instagram").is_err());
        assert!(parse_desktop_webview_url("https://instagram.example", "instagram").is_err());
        assert!(validate_desktop_webview_bounds(0.0, 0.0, 0.0, 600.0).is_err());
        assert!(validate_desktop_webview_bounds(f64::NAN, 0.0, 800.0, 600.0).is_err());
    }

    #[test]
    fn only_positive_sized_child_webviews_are_focus_eligible() {
        assert!(has_visible_desktop_webview_bounds(1.0, 1.0));
        assert!(has_visible_desktop_webview_bounds(1280.0, 800.0));
        assert!(!has_visible_desktop_webview_bounds(0.0, 800.0));
        assert!(!has_visible_desktop_webview_bounds(1280.0, 0.0));
        assert!(!has_visible_desktop_webview_bounds(-1.0, 800.0));
    }

    #[test]
    fn accepts_an_identified_bitwarden_chromium_manifest() {
        let manifest = r#"{
          "manifest_version": 3,
          "name": "__MSG_appName__",
          "version": "2026.8.0",
          "homepage_url": "https://bitwarden.com"
        }"#;
        assert!(validate_bitwarden_extension_manifest(manifest).is_ok());
        assert_eq!(
            bitwarden_extension_version(manifest),
            Some("2026.8.0".to_string())
        );
    }

    #[test]
    fn reads_the_bitwarden_extension_version_without_exposing_other_manifest_data() {
        let manifest = r#"{
          "manifest_version": 3,
          "name": "Bitwarden Password Manager",
          "version": "2026.8.0"
        }"#;
        assert_eq!(
            bitwarden_extension_version(manifest),
            Some("2026.8.0".to_string())
        );
    }

    #[test]
    fn rejects_an_unidentified_or_malformed_extension_manifest() {
        assert!(validate_bitwarden_extension_manifest("not-json").is_err());
        assert!(validate_bitwarden_extension_manifest(
            r#"{"manifest_version":3,"name":"Unrelated extension","version":"1.0.0","description":"Compatible with Bitwarden"}"#,
        )
        .is_err());
    }

    #[cfg(target_os = "windows")]
    fn temporary_archive_paths(label: &str) -> (std::path::PathBuf, std::path::PathBuf) {
        let nonce = chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default();
        let root = std::env::temp_dir().join(format!("communityglows-{label}-{nonce}"));
        (root.with_extension("zip"), root)
    }

    #[cfg(target_os = "windows")]
    fn write_test_archive(path: &std::path::Path, entry_name: &str, contents: &[u8]) {
        use std::io::Write;

        let file = std::fs::File::create(path).expect("create test archive");
        let mut archive = zip::ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);
        archive
            .start_file(entry_name, options)
            .expect("start test archive entry");
        archive
            .write_all(contents)
            .expect("write test archive entry");
        archive.finish().expect("finish test archive");
    }

    #[cfg(target_os = "windows")]
    fn file_sha256(path: &std::path::Path) -> String {
        use sha2::{Digest, Sha256};
        use std::io::Read;

        let mut file = std::fs::File::open(path).expect("open test archive");
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).expect("read test archive");
        sha256_hex(Sha256::digest(bytes).as_slice())
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn extracts_a_bounded_official_style_bitwarden_archive() {
        let (archive_path, destination) = temporary_archive_paths("bitwarden-valid");
        write_test_archive(
            &archive_path,
            "manifest.json",
            br#"{"manifest_version":3,"name":"Bitwarden Password Manager","version":"2026.8.0"}"#,
        );

        let expected_sha256 = file_sha256(&archive_path);
        let version = super::extract_bitwarden_archive(
            &archive_path,
            &destination,
            &format!("sha256:{expected_sha256}"),
        )
            .expect("extract valid Bitwarden archive");
        assert_eq!(version, "2026.8.0");
        assert!(destination.join("manifest.json").is_file());

        std::fs::remove_file(archive_path).expect("remove test archive");
        std::fs::remove_dir_all(destination).expect("remove extracted test archive");
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn rejects_a_bitwarden_archive_with_a_mismatched_or_invalid_digest() {
        let (archive_path, destination) = temporary_archive_paths("bitwarden-digest");
        write_test_archive(
            &archive_path,
            "manifest.json",
            br#"{"manifest_version":3,"name":"Bitwarden Password Manager","version":"2026.8.0"}"#,
        );

        let mismatch = super::extract_bitwarden_archive(
            &archive_path,
            &destination,
            &"0".repeat(64),
        )
        .expect_err("reject mismatched digest");
        assert!(mismatch.contains("does not match"));
        assert!(!destination.exists());

        let invalid = super::extract_bitwarden_archive(&archive_path, &destination, "not-a-digest")
            .expect_err("reject invalid digest");
        assert!(invalid.contains("SHA-256 digest"));
        assert!(!destination.exists());

        std::fs::remove_file(archive_path).expect("remove test archive");
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn rejects_archive_path_traversal_before_writing_outside_the_destination() {
        let (archive_path, destination) = temporary_archive_paths("bitwarden-traversal");
        write_test_archive(
            &archive_path,
            "../manifest.json",
            br#"{"manifest_version":3,"name":"Bitwarden Password Manager"}"#,
        );

        let expected_sha256 = file_sha256(&archive_path);
        let error = super::extract_bitwarden_archive(
            &archive_path,
            &destination,
            &expected_sha256,
        )
            .expect_err("reject traversal archive");
        assert!(error.contains("unsafe path"));

        std::fs::remove_file(archive_path).expect("remove test archive");
        if destination.exists() {
            std::fs::remove_dir_all(destination).expect("remove extraction directory");
        }
    }
}
