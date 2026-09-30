// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    if let Some(result) = app_lib::process_onboarding_installation_command() {
        // Installation metadata only: no normal application, WebView, account or auth startup.
        std::process::exit(if result.is_ok() { 0 } else { 1 });
    }
    app_lib::run();
}
