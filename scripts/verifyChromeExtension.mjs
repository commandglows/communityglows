import assert from "node:assert/strict"
import {
  mkdtemp,
  readFile,
  readdir,
  mkdir,
  writeFile,
  rm,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve, join, sep } from "node:path"
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
context.setDefaultTimeout(8000)
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
  const popup = await context.newPage()
  await popup.goto(base + "/src/ui/action-popup/index.html", {
    waitUntil: "domcontentloaded",
  })
  checkpoint("Popup loaded")
  await popup
    .locator("select")
    .nth(0)
    .locator("option")
    .first()
    .waitFor({ state: "attached" })
  await popup.locator("select").nth(1).selectOption("en")
  await popup.waitForFunction(() => document.documentElement.lang === "en")
  assert.ok(
    context.pages().some((page) => page.url().includes("/setup/install")),
    "installation opens setup",
  )
  checkpoint("Real installation opens setup without Illegal invocation")
  assert.equal(await popup.locator('.ext-native-guide a').getAttribute('href'), 'https://communityglows.com/download')
  const options = await context.newPage()
  await options.goto(base + "/src/ui/options-page/index.html", {
    waitUntil: "domcontentloaded",
  })
  await options
    .locator("select")
    .nth(0)
    .locator("option")
    .first()
    .waitFor({ state: "attached" })
  const linkForm = (page) => page.locator("form.ext-parity-grid--links")
  async function fillLink(page, label) {
    await linkForm(page).locator("input").nth(0).fill(label)
    await linkForm(page)
      .locator("input")
      .nth(1)
      .fill("https://example.com/" + label)
  }
  await fillLink(popup, "Writer-A")
  await fillLink(options, "Writer-B")
  await Promise.all([
    linkForm(popup).locator("button").click(),
    linkForm(options).locator("button").click(),
  ])
  for (const page of [popup, options]) {
    await page.getByText("Writer-A", { exact: true }).waitFor()
    await page.getByText("Writer-B", { exact: true }).waitFor()
  }
  checks.push("Concurrent links preserved and synchronized across documents")
  await fillLink(popup, "Quota-draft")
  await popup.evaluate(() => {
    window.restoreStorage = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "customLinks" || key === "contextual-tasks-v1")
        throw new DOMException("quota", "QuotaExceededError")
      return window.restoreStorage.call(this, key, value)
    }
  })
  await linkForm(popup).locator("button").click()
  await popup.getByRole("alert").first().waitFor()
  assert.equal(
    await linkForm(popup).locator("input").first().inputValue(),
    "Quota-draft",
  )
  assert.equal(await popup.locator(".ext-link-item").count(), 2)
  await popup.evaluate(() => {
    Storage.prototype.setItem = window.restoreStorage
  })
  checks.push(
    "Failed link writes retain input and do not publish phantom links",
  )
  await popup.evaluate(() => {
    window.browser.tabs.query = async () => [
      { url: "https://example.com/original?token=secret" },
    ]
  })
  await popup
    .getByRole("button", { name: "Use active tab", exact: true })
    .click()
  const taskForm = popup.locator("form.task-form")
  await taskForm.locator("input[type=text]").first().fill("Edited task")
  await taskForm.locator("input[type=url]").fill("https://example.com/edited")
  await taskForm.locator("button[type=submit]").click()
  await popup.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("contextual-tasks-v1") || "[]").length ===
      1,
  )
  assert.equal(
    await popup.evaluate(
      () => JSON.parse(localStorage.getItem("contextual-tasks-v1"))[0].url,
    ),
    "https://example.com/edited",
  )
  const tasks = await context.newPage()
  await tasks.goto(base + "/src/ui/setup/index.html#/setup/tasks", {
    waitUntil: "domcontentloaded",
  })
  await tasks
    .getByRole("heading", { name: "Edited task", exact: true })
    .waitFor()
  await tasks.getByRole("button", { name: "Edit", exact: true }).click()
  await tasks
    .locator("form.task-form input[type=text]")
    .first()
    .fill("Updated task")
  await tasks.locator("form.task-form input[type=url]").fill("")
  await tasks.locator("button[type=submit]").click()
  await tasks
    .getByRole("heading", { name: "Updated task", exact: true })
    .waitFor()
  assert.equal(
    await tasks.evaluate(
      () => JSON.parse(localStorage.getItem("contextual-tasks-v1"))[0].url,
    ),
    undefined,
  )
  await tasks.getByRole("button", { name: "Delete", exact: true }).click()
  await tasks.waitForFunction(
    () => JSON.parse(localStorage.getItem("contextual-tasks-v1")).length === 0,
  )
  checks.push(
    "Captured URL remains editable; task management updates, clears URL and deletes",
  )
  await popup.evaluate(() => {
    window.browser.tabs.query = async () => [{ url: "chrome://extensions/" }]
  })
  await popup
    .getByRole("button", { name: "Use active tab", exact: true })
    .click()
  await taskForm.waitFor()
  assert.equal(await taskForm.locator("input[type=url]").inputValue(), "")
  await taskForm.locator("input[type=text]").first().fill("Manual draft")
  await taskForm.locator("input[type=text]").first().press("Control+A")
  assert.equal(
    await taskForm
      .locator("input[type=text]")
      .first()
      .evaluate((el) => el.selectionEnd - el.selectionStart),
    12,
  )
  await popup.evaluate(() => {
    Storage.prototype.setItem = function (key, value) {
      if (key === "contextual-tasks-v1")
        throw new DOMException("quota", "QuotaExceededError")
      return window.restoreStorage.call(this, key, value)
    }
  })
  await taskForm.locator("input[type=url]").fill("")
  await taskForm.locator("button[type=submit]").click()
  await popup.waitForFunction(() => document.querySelector(".ext-task-capture-error")?.textContent?.includes("Unable to save"))
  assert.equal(
    await taskForm.locator("input[type=text]").first().inputValue(),
    "Manual draft",
  )
  assert.equal(
    await popup.evaluate(
      () => JSON.parse(localStorage.getItem("contextual-tasks-v1")).length,
    ),
    0,
  )
  await popup.evaluate(() => {
    Storage.prototype.setItem = window.restoreStorage
  })
  checks.push(
    "Restricted tab has manual fallback; Ctrl+A works; failed task save retains draft",
  )
  await options.locator("select").nth(1).selectOption("fr")
  await popup.waitForFunction(() => document.documentElement.lang === "fr")
  await tasks.waitForFunction(() => document.documentElement.lang === "fr")
  assert.ok(!(await popup.locator("body").innerText()).includes("Unable to save"))
  checks.push("Locale and document language synchronize between pages")
  const nativeGuide = popup.locator('.ext-native-guide')
  await nativeGuide.locator('summary').focus()
  await nativeGuide.locator('summary').press('Enter')
  assert.equal(await nativeGuide.locator('details').evaluate(el => el.open), true)
  assert.equal(await nativeGuide.locator('a').getAttribute('href'), 'https://communityglows.com/fr/download')
  assert.ok((await nativeGuide.innerText()).includes('ne les transfère pas automatiquement'))
  // Navigation target proof; the live download page is verified separately.
  await context.route('https://communityglows.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Official download destination test</title>' }))
  const pagesBeforeGuide = context.pages().length
  await nativeGuide.locator('a').click()
  await nativeGuide.getByRole('alert').waitFor()
  assert.equal(context.pages().length, pagesBeforeGuide)
  assert.equal(await taskForm.locator('input[type=text]').first().inputValue(), 'Manual draft')
  await popup.setViewportSize({ width: 320, height: 900 })
  assert.ok(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await taskForm.getByRole('button', { name: 'Annuler', exact: true }).click()
  await linkForm(popup).locator('input').nth(0).fill('')
  await linkForm(popup).locator('input').nth(1).fill('')
  const downloadsPromise = context.waitForEvent('page')
  await nativeGuide.locator('a').click()
  const downloads = await downloadsPromise
  await downloads.waitForURL('https://communityglows.com/fr/download')
  assert.ok(popup.url().includes('/action-popup/'))
  await downloads.close()
  assert.equal(await options.locator('.ext-native-guide').count(), 1)
  assert.equal(await tasks.locator('.ext-native-guide').count(), 1)
  checks.push('Native guidance: FR/EN destination, keyboard expansion, pending-input protection and new tab')
  const panel = await context.newPage()
  await panel.setViewportSize({ width: 320, height: 900 })
  await panel.goto(base + "/src/ui/side-panel/index.html", {
    waitUntil: "domcontentloaded",
  })
  await panel.locator("h1").waitFor()
  assert.ok(
    await panel.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "side panel fits 320px",
  )
  await popup.setViewportSize({ width: 320, height: 900 })
  assert.ok(
    await popup.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "task form fits 320px",
  )
  await nativeGuide.screenshot({ path: join(output, "native-guide-320.png") })
  await panel.screenshot({
    path: join(output, "side-panel-320.png"),
    fullPage: true,
  })
  await popup.screenshot({
    path: join(output, "popup-form-320.png"),
    fullPage: true,
  })
  checks.push("Panel and task form fit 320px without horizontal overflow")
  assert.deepEqual(errors, [])
  const assets = await readdir(join(dist, "assets"))
  assert.ok(
    assets.filter((name) => name.endsWith(".js")).length < 40,
    "desktop routes excluded",
  )
  const manifest = JSON.parse(
    await readFile(join(dist, "manifest.json"), "utf8"),
  )
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
