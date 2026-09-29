import manifest from "../../manifest.config"
import chromeManifest from "../../manifest.chrome.config"
import firefoxManifest from "../../manifest.firefox.config"

describe("extension manifest baseline", () => {
  it("does not ship global content script or devtools page by default", () => {
    expect(Reflect.get(manifest, "content_scripts")).toBeUndefined()
    expect(Reflect.get(manifest, "devtools_page")).toBeUndefined()
  })

  it("uses minimum baseline permissions", () => {
    expect(manifest.permissions).toEqual(expect.arrayContaining(["storage", "tabs"]))
    expect(manifest.permissions).not.toEqual(expect.arrayContaining(["background", "sidePanel"]))
  })

  it("declares browser minimum versions and CommunityGlows identity", async () => {
    const chrome = await (typeof chromeManifest === "function"
      ? chromeManifest({ mode: "production" } as never)
      : chromeManifest)
    const firefox = await (typeof firefoxManifest === "function"
      ? firefoxManifest({ mode: "production" } as never)
      : firefoxManifest)

    expect(manifest.name).toBe("CommunityGlows")
    expect(manifest.description).toContain("social workspace")
    expect(Reflect.get(chrome, "minimum_chrome_version")).toBe("116")
    const browserSettings = Reflect.get(firefox, "browser_specific_settings") as
      | { gecko?: { strict_min_version?: string } }
      | undefined
    expect(browserSettings?.gecko?.strict_min_version).toBe("142.0")
  })
})
