import { env } from "node:process"
import packageJson from "./package.json" with { type: "json" }

const { version } = packageJson
// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = "0"] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/)

export default {
  author: "CommunityGlows",
  name: env.mode === "staging" ? "[INTERNAL] CommunityGlows" : "CommunityGlows",
  description: "A unified social workspace for opening and managing your networks from the browser.",
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  manifest_version: 3,
  // key: '',
  action: {
    default_popup: "src/ui/action-popup/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_page: "src/ui/options-page/index.html",
  offline_enabled: true,
  host_permissions: [],
  permissions: ["storage", "tabs"],
  web_accessible_resources: [],
  icons: {
    16: "src/assets/logo.png",
    24: "src/assets/logo.png",
    32: "src/assets/logo.png",
    128: "src/assets/logo.png",
  },
}
