import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve, sep } from "node:path"
import { chromium } from "playwright"

const dist = resolve("dist/chrome")
const output =
  process.env.EXTENSION_EVIDENCE_DIR ||
  (await mkdtemp(join(tmpdir(), "communityglows-proof-")))
await mkdir(output, { recursive: true })
const profile = await mkdtemp(join(tmpdir(), "communityglows-chrome-test-"))
const errors = []
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: true,
  args: ["--disable-extensions-except=" + dist, "--load-extension=" + dist],
})
context.setDefaultTimeout(10000)
context.on("page", (page) =>
  page.on("pageerror", (error) => errors.push(error.message)),
)
const checks = []
const checkpoint = (message) => {
  checks.push(message)
  console.info("[extension]", message)
}

checkpoint("Chromium launched")
try {
  const worker =
    context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"))
  const base = "chrome-extension://" + worker.url().split("/")[2]
  checkpoint("Service worker ready")

  const manifest = JSON.parse(await readFile(join(dist, "manifest.json"), "utf8"))
  assert.equal(manifest.manifest_version, 3)
  assert.equal(
    manifest.action?.default_popup,
    "src/ui/action-popup/index.html",
  )
  assert.equal(manifest.action?.default_title, "Open CommunityGlows")
  assert.equal(
    manifest.side_panel?.default_path,
    "src/ui/side-panel/index.html",
  )
  checkpoint("Toolbar action opens the extension popup")

  const dashboardUrl =
    base + "/src/ui/setup/pages/CommunityGlows/extension-dashboard.html"
  let dashboard = context
    .pages()
    .find((page) => page.url().startsWith(dashboardUrl))
  if (!dashboard) {
    dashboard = await context.newPage()
    await dashboard.goto(dashboardUrl, { waitUntil: "domcontentloaded" })
  }
  await dashboard.locator(".app-container").waitFor()
  assert.equal(await dashboard.locator(".ext-parity-root").count(), 0)
  assert.ok(
    (await dashboard.locator(".desktop-layout, .onboarding-backdrop, main").count()) >
      0,
    "full CommunityGlows shell rendered",
  )
  await dashboard.screenshot({
    path: join(output, "dashboard-full-experience.png"),
    fullPage: true,
  })
  checkpoint("Full CommunityGlows dashboard entry renders")

  const popup = await context.newPage()
  await popup.setViewportSize({ width: 384, height: 760 })
  await popup.goto(base + "/src/ui/action-popup/index.html", {
    waitUntil: "domcontentloaded",
  })
  await popup.locator(".ext-parity-root").waitFor()
  const firstNetworkButton = popup.locator(".ext-network-grid button").first()
  await firstNetworkButton.waitFor()
  const firstNetworkLabel = (await firstNetworkButton.innerText()).trim()
  const originalProfiles = await popup.evaluate(() =>
    localStorage.getItem("profiles"),
  )
  const activeProfileId = await popup.evaluate(() =>
    JSON.parse(localStorage.getItem("profiles") || "{}").activeProfileId,
  )
  assert.ok(activeProfileId)

  await dashboard.evaluate(() => {
    const record = JSON.parse(localStorage.getItem("profiles") || "{}")
    record.profiles = record.profiles.map((profile) =>
      profile.id === record.activeProfileId
        ? { ...profile, hiddenNetworks: [...(profile.hiddenNetworks || []), "twitter"] }
        : profile,
    )
    localStorage.setItem("profiles", JSON.stringify(record))
  })
  await popup.getByRole("button", { name: firstNetworkLabel, exact: true }).waitFor({ state: "detached" })
  checkpoint("Network visibility changes in the dashboard update the popup")

  await dashboard.evaluate((original) => {
    if (original) localStorage.setItem("profiles", original)
  }, originalProfiles)
  await popup.getByRole("button", { name: firstNetworkLabel, exact: true }).waitFor()

  const themeBefore = await popup.evaluate(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  )
  const expectedTheme = themeBefore === "dark" ? "light" : "dark"
  const themeToggle = popup.locator(".ext-popup-icon-button").first()
  await themeToggle.click()
  await dashboard.waitForFunction(
    (theme) => document.documentElement.classList.contains("dark") === (theme === "dark"),
    expectedTheme,
  )
  checkpoint("Theme changes in the popup update the dashboard")

  const sidePanel = await context.newPage()
  await sidePanel.setViewportSize({ width: 360, height: 900 })
  await sidePanel.goto(base + "/src/ui/side-panel/index.html", {
    waitUntil: "domcontentloaded",
  })
  await sidePanel.locator("h1").waitFor()
  assert.ok(
    await sidePanel.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "side panel fits narrow Chrome panel width",
  )
  await sidePanel.screenshot({
    path: join(output, "side-panel-360.png"),
    fullPage: true,
  })
  checkpoint("Chrome side panel page renders beside the dashboard")

  const dashboardPromise = context.waitForEvent("page")
  await sidePanel
    .getByRole("button", { name: /Configure|Configurer/i })
    .click()
  const openedDashboard = await dashboardPromise
  await openedDashboard.waitForURL(/extension-dashboard\.html/)
  await openedDashboard.close()
  checkpoint("Side panel opens the full dashboard entry")

  assert.deepEqual(errors, [])
  const assets = await readdir(join(dist, "assets"))
  const result = {
    checks,
    browser: context.browser()?.version(),
    manifestVersion: manifest.manifest_version,
    javascriptChunks: assets.filter((name) => name.endsWith(".js")).length,
    errors,
    output,
  }
  await writeFile(
    join(output, "runtime-evidence.json"),
    JSON.stringify(result, null, 2),
  )
  console.info(JSON.stringify(result, null, 2))
} finally {
  await context.close()
  assert.ok(resolve(profile).startsWith(resolve(tmpdir()) + sep))
  await rm(profile, { recursive: true, force: true })
}
