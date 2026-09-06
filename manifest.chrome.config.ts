import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config"

// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
  ...ManifestConfig,
  minimum_chrome_version: "116",
  side_panel: {
    default_path: "src/ui/side-panel/index.html",
  },
  permissions: [...ManifestConfig.permissions, "sidePanel", "tabGroups"],
  key: env["CHROME_ADDON_KEY"],
}))
