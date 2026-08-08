use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::Argon2;
use rand::RngCore;
use std::io::{Cursor, Read as IoRead, Write as IoWrite};
use std::path::{Component, Path};
use zip::write::SimpleFileOptions;

/// Magic bytes identifying a .sfbak file
const MAGIC: &[u8; 4] = b"SFBK";
/// Format version
const VERSION: u8 = 0x01;

/// Derive a 32-byte AES key from a password + salt using Argon2id.
fn derive_key(password: &str, salt: &[u8; 16]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Key derivation failed: {e}"))?;
    Ok(key)
}

/// Recursively add a directory tree to a zip archive.
fn add_dir_to_zip(
    zip: &mut zip::ZipWriter<Cursor<Vec<u8>>>,
    base: &Path,
    dir: &Path,
    prefix: &str,
) -> Result<(), String> {
    if !dir.exists() {
        return Ok(());
    }
    let entries = std::fs::read_dir(dir).map_err(|e| format!("read_dir {}: {e}", dir.display()))?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let archive_path = if prefix.is_empty() {
            name.clone()
        } else {
            format!("{prefix}/{name}")
        };

        if path.is_dir() {
            add_dir_to_zip(zip, base, &path, &archive_path)?;
        } else {
            let options = SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated);
            zip.start_file(&archive_path, options)
                .map_err(|e| format!("zip start_file: {e}"))?;
            let data =
                std::fs::read(&path).map_err(|e| format!("read {}: {e}", path.display()))?;
            zip.write_all(&data)
                .map_err(|e| format!("zip write: {e}"))?;
        }
    }
    Ok(())
}

/// Create a zip archive containing store data + session files.
pub fn create_backup_archive(sessions_dir: &Path, store_data: &str) -> Result<Vec<u8>, String> {
    let buf = Cursor::new(Vec::new());
    let mut zip = zip::ZipWriter::new(buf);
    let options =
        SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // manifest
    let manifest = serde_json::json!({
        "version": 1,
        "timestamp": chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
        "platform": std::env::consts::OS,
    });
    zip.start_file("manifest.json", options)
        .map_err(|e| format!("zip: {e}"))?;
    zip.write_all(manifest.to_string().as_bytes())
        .map_err(|e| format!("zip write: {e}"))?;

    // store data
    zip.start_file("stores/data.json", options)
        .map_err(|e| format!("zip: {e}"))?;
    zip.write_all(store_data.as_bytes())
        .map_err(|e| format!("zip write: {e}"))?;

    // session directories
    add_dir_to_zip(&mut zip, sessions_dir, sessions_dir, "sessions")?;

    let cursor = zip.finish().map_err(|e| format!("zip finish: {e}"))?;
    Ok(cursor.into_inner())
}

/// Encrypt plaintext with AES-256-GCM, returning the .sfbak binary blob.
pub fn encrypt_archive(plaintext: &[u8], password: &str) -> Result<Vec<u8>, String> {
    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut salt);
    rand::thread_rng().fill_bytes(&mut nonce_bytes);

    let key = derive_key(password, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| format!("cipher init: {e}"))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| "Encryption failed".to_string())?;

    let ct_len = (ciphertext.len() as u32).to_le_bytes();

    // Build final blob: MAGIC(4) + VERSION(1) + SALT(16) + NONCE(12) + LEN(4) + CIPHERTEXT(N)
    let mut blob = Vec::with_capacity(4 + 1 + 16 + 12 + 4 + ciphertext.len());
    blob.extend_from_slice(MAGIC);
    blob.push(VERSION);
    blob.extend_from_slice(&salt);
    blob.extend_from_slice(&nonce_bytes);
    blob.extend_from_slice(&ct_len);
    blob.extend_from_slice(&ciphertext);

    Ok(blob)
}

/// Decrypt a .sfbak blob, returning the plaintext zip bytes.
pub fn decrypt_archive(blob: &[u8], password: &str) -> Result<Vec<u8>, String> {
    // Minimum: MAGIC(4) + VERSION(1) + SALT(16) + NONCE(12) + LEN(4) = 37
    if blob.len() < 37 {
        return Err("File too small — not a valid backup".into());
    }
    if &blob[0..4] != MAGIC {
        return Err("Invalid backup file (bad magic bytes)".into());
    }
    if blob[4] != VERSION {
        return Err(format!(
            "Unsupported backup version {} (expected {})",
            blob[4], VERSION
        ));
    }

    let salt: [u8; 16] = blob[5..21].try_into().unwrap();
    let nonce_bytes: [u8; 12] = blob[21..33].try_into().unwrap();
    let ct_len = u32::from_le_bytes(blob[33..37].try_into().unwrap()) as usize;

    if blob.len() < 37 + ct_len {
        return Err("Backup file is truncated".into());
    }

    let ciphertext = &blob[37..37 + ct_len];

    let key = derive_key(password, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| format!("cipher init: {e}"))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Mot de passe incorrect ou fichier corrompu".to_string())
}

/// Extract store data JSON from a zip archive and restore session files.
pub fn extract_backup_archive(zip_bytes: &[u8], sessions_dir: &Path) -> Result<String, String> {
    extract_backup_archive_for_platform(zip_bytes, sessions_dir, std::env::consts::OS)
}

fn extract_backup_archive_for_platform(
    zip_bytes: &[u8],
    sessions_dir: &Path,
    target_platform: &str,
) -> Result<String, String> {
    let cursor = Cursor::new(zip_bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| format!("zip open: {e}"))?;

    let mut store_data = String::new();
    let source_platform = match archive.by_name("manifest.json") {
        Ok(mut file) => {
            let mut manifest_json = String::new();
            file.read_to_string(&mut manifest_json)
                .map_err(|e| format!("read manifest.json: {e}"))?;
            let manifest: serde_json::Value = serde_json::from_str(&manifest_json)
                .map_err(|e| format!("invalid manifest.json: {e}"))?;
            manifest
                .get("platform")
                .and_then(|value| value.as_str())
                .map(str::to_owned)
        }
        Err(_) => None,
    };

    // First pass: extract store data
    {
        let mut file = archive
            .by_name("stores/data.json")
            .map_err(|_| "Backup is missing stores/data.json".to_string())?;
        file.read_to_string(&mut store_data)
            .map_err(|e| format!("read stores/data.json: {e}"))?;
    }

    serde_json::from_str::<serde_json::Value>(&store_data)
        .map_err(|e| format!("invalid stores/data.json: {e}"))?;

    // WebView cookie/session stores are native-engine data. The portable store
    // payload remains importable everywhere, but session files must only be
    // activated on the platform that created them. Manifest-less v1 archives
    // retain their historical same-platform restore behavior.
    if source_platform
        .as_deref()
        .is_some_and(|source| source != target_platform)
    {
        return Ok(store_data);
    }

    // Extract into a sibling directory first so a bad archive cannot destroy
    // the currently usable sessions.
    let staging_dir = sessions_dir.with_extension("restore-tmp");
    if staging_dir.exists() {
        std::fs::remove_dir_all(&staging_dir)
            .map_err(|e| format!("clear restore staging directory: {e}"))?;
    }
    std::fs::create_dir_all(&staging_dir)
        .map_err(|e| format!("create restore staging directory: {e}"))?;

    // Second pass: extract session files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| format!("zip entry: {e}"))?;
        let name = file.name().to_string();

        if !name.starts_with("sessions/") || file.is_dir() {
            continue;
        }

        // Strip "sessions/" prefix → write relative to sessions_dir
        let rel = &name["sessions/".len()..];
        let rel_path = Path::new(rel);
        if rel_path.components().any(|component| {
            matches!(component, Component::Prefix(_) | Component::RootDir | Component::ParentDir)
        }) {
            let _ = std::fs::remove_dir_all(&staging_dir);
            return Err("Backup contains an unsafe session path".to_string());
        }
        let target = staging_dir.join(rel_path);

        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("mkdir {}: {e}", parent.display()))?;
        }

        let mut data = Vec::new();
        file.read_to_end(&mut data)
            .map_err(|e| format!("read zip entry: {e}"))?;
        if let Err(error) = std::fs::write(&target, &data) {
            let _ = std::fs::remove_dir_all(&staging_dir);
            return Err(format!("write {}: {error}", target.display()));
        }
    }

    let previous_dir = sessions_dir.with_extension("restore-old");
    if previous_dir.exists() {
        std::fs::remove_dir_all(&previous_dir)
            .map_err(|e| format!("clear previous restore directory: {e}"))?;
    }
    if sessions_dir.exists() {
        std::fs::rename(sessions_dir, &previous_dir)
            .map_err(|e| format!("stage existing sessions: {e}"))?;
    }
    if let Err(error) = std::fs::rename(&staging_dir, sessions_dir) {
        if previous_dir.exists() {
            let _ = std::fs::rename(&previous_dir, sessions_dir);
        }
        return Err(format!("activate restored sessions: {error}"));
    }
    if previous_dir.exists() {
        std::fs::remove_dir_all(&previous_dir)
            .map_err(|e| format!("remove previous sessions: {e}"))?;
    }

    Ok(store_data)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_directory(name: &str) -> std::path::PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock before epoch")
            .as_nanos();
        std::env::temp_dir().join(format!("communityglows-backup-{name}-{nonce}"))
    }

    fn archive_with_entries(entries: &[(&str, &[u8])]) -> Vec<u8> {
        let mut writer = zip::ZipWriter::new(Cursor::new(Vec::new()));
        let options = SimpleFileOptions::default();
        for (name, data) in entries {
            writer.start_file(*name, options).expect("start zip entry");
            writer.write_all(data).expect("write zip entry");
        }
        writer.finish().expect("finish zip").into_inner()
    }

    #[test]
    fn invalid_store_data_preserves_existing_sessions() {
        let sessions_dir = test_directory("invalid-json");
        std::fs::create_dir_all(&sessions_dir).expect("create sessions directory");
        let existing = sessions_dir.join("profile/network/state.txt");
        std::fs::create_dir_all(existing.parent().expect("state parent")).expect("create state parent");
        std::fs::write(&existing, b"existing").expect("write existing state");

        let archive = archive_with_entries(&[("stores/data.json", b"not-json")]);
        let error = extract_backup_archive(&archive, &sessions_dir).expect_err("archive must fail");

        assert!(error.contains("invalid stores/data.json"));
        assert_eq!(std::fs::read(&existing).expect("read existing state"), b"existing");
        assert!(!sessions_dir.with_extension("restore-tmp").exists());
        let _ = std::fs::remove_dir_all(sessions_dir);
    }

    #[test]
    fn unsafe_session_path_is_rejected_without_replacing_sessions() {
        let sessions_dir = test_directory("unsafe-path");
        std::fs::create_dir_all(&sessions_dir).expect("create sessions directory");
        let existing = sessions_dir.join("keep.txt");
        std::fs::write(&existing, b"keep").expect("write existing state");

        let archive = archive_with_entries(&[
            ("stores/data.json", br#"{"profiles":{}}"#),
            ("sessions/../escaped.txt", b"escape"),
        ]);
        let error = extract_backup_archive(&archive, &sessions_dir).expect_err("archive must fail");

        assert!(error.contains("unsafe session path"));
        assert_eq!(std::fs::read(&existing).expect("read existing state"), b"keep");
        assert!(!sessions_dir.with_extension("restore-tmp").exists());
        assert!(!sessions_dir.parent().expect("sessions parent").join("escaped.txt").exists());
        let _ = std::fs::remove_dir_all(sessions_dir);
    }

    #[test]
    fn cross_platform_restore_keeps_local_sessions_and_restores_store_data() {
        let sessions_dir = test_directory("cross-platform");
        std::fs::create_dir_all(&sessions_dir).expect("create sessions directory");
        let existing = sessions_dir.join("keep.txt");
        std::fs::write(&existing, b"windows-session").expect("write existing state");

        let archive = archive_with_entries(&[
            ("manifest.json", br#"{"version":1,"platform":"android"}"#),
            (
                "stores/data.json",
                br#"{"dataVersion":2,"profiles":{"profiles":[]}}"#,
            ),
            ("sessions/profile/network/state.txt", b"android-session"),
        ]);
        let restored = extract_backup_archive_for_platform(&archive, &sessions_dir, "windows")
            .expect("portable data should restore");

        assert!(restored.contains("\"dataVersion\":2"));
        assert_eq!(
            std::fs::read(&existing).expect("read existing state"),
            b"windows-session"
        );
        assert!(!sessions_dir.join("profile/network/state.txt").exists());
        let _ = std::fs::remove_dir_all(sessions_dir);
    }
}
