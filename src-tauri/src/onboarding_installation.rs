use std::path::Path;

pub const INSTALLATION_MARKER: &str = "communityglows-onboarding-installation-v1";

fn valid_generation(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
}

/// Installer-owned UI metadata beside the executable, never in sessions/AppData or backups.
pub fn write_generation(executable: &Path, generation: &str) -> Result<(), String> {
    if !valid_generation(generation) {
        return Err("Invalid onboarding installation generation".into());
    }
    let directory = executable
        .parent()
        .ok_or("Missing installation directory")?;
    std::fs::write(directory.join(INSTALLATION_MARKER), generation)
        .map_err(|_| "Cannot write onboarding installation witness".into())
}

pub fn read_generation(executable: &Path) -> Result<String, String> {
    let directory = executable
        .parent()
        .ok_or("Missing installation directory")?;
    let generation = std::fs::read_to_string(directory.join(INSTALLATION_MARKER))
        .map_err(|_| "Cannot read onboarding installation witness")?;
    if !valid_generation(&generation) {
        return Err("Invalid onboarding installation witness".into());
    }
    Ok(generation)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_package_reinstall_replaces_only_the_installer_witness() {
        let directory = std::env::temp_dir().join(format!(
            "communityglows-onboarding-test-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&directory).unwrap();
        let executable = directory.join("app.exe");
        let existing_data = directory.join("existing-user-data");
        std::fs::write(&existing_data, "retain").unwrap();
        assert!(read_generation(&executable).is_err());
        write_generation(&executable, &"a".repeat(64)).unwrap();
        assert_eq!(read_generation(&executable).unwrap(), "a".repeat(64));
        write_generation(&executable, &"b".repeat(64)).unwrap();
        assert_eq!(read_generation(&executable).unwrap(), "b".repeat(64));
        assert_eq!(std::fs::read_to_string(&existing_data).unwrap(), "retain");
        assert!(write_generation(&executable, "malformed").is_err());
        std::fs::remove_file(directory.join(INSTALLATION_MARKER)).unwrap();
        std::fs::remove_file(existing_data).unwrap();
        std::fs::remove_dir(directory).unwrap();
    }
}
