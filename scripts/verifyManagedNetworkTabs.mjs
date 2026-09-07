import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { chromium } from "playwright"
const profile = await mkdtemp(join(tmpdir(), "communityglows-managed-tabs-"))
const output = join(profile, "evidence")
await mkdir(output)
const dist = resolve("dist/chrome")
const options = {
  channel: "chromium",
  headless: true,
  args: ["--disable-extensions-except=" + dist, "--load-extension=" + dist],
}
let context = await chromium.launchPersistentContext(profile, options)
const checks = []
const checkpoint = (name) => {
  checks.push(name)
  console.info(name)
}
let base, panel
async function initialize() {
  const worker =
    context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"))
  base = "chrome-extension://" + worker.url().split("/")[2]
  panel = await context.newPage()
  await panel.setViewportSize({ width: 320, height: 900 })
  await panel.goto(base + "/src/ui/side-panel/index.html")
  await panel.locator("h1").waitFor()
  await panel.waitForFunction(
    () => document.querySelector("select")?.options.length > 0,
  )
}
const command = (cmd) =>
  panel.evaluate(async (command) => {
    const reply = await chrome.runtime.sendMessage({
      type: "communityglows:network-tabs",
      command,
    })
    if (!reply?.ok) throw new Error(reply?.code || "missing_reply")
    return reply.state
  }, cmd)
try {
  await initialize()
  const windowId = await panel.evaluate(
    async () => (await chrome.windows.getCurrent()).id,
  )
  const profileId = await panel.locator("select").first().inputValue()
  const target = (networkId, groupKey = networkId) => ({
    profileId,
    networkId,
    groupKey,
    groupTitle: "Lab " + groupKey,
    label: networkId,
    url: "https://example.com/" + networkId,
  })
  const a = target("twitter", "social"),
    b = target("reddit", "communities")
  let state = await command({ action: "open", target: a, windowId })
  const aId = state.entries[0].tabId
  await Promise.all(
    Array.from({ length: 8 }, () =>
      command({ action: "open", target: a, windowId }),
    ),
  )
  state = await command({ action: "open", target: b, windowId })
  assert.equal(state.entries.length, 2)
  assert.equal(state.groups.length, 2)
  assert.equal(
    state.groups.find((g) => g.id === state.entries[0].groupId).collapsed,
    true,
  )
  assert.equal(
    state.groups.find((g) => g.id === state.entries[1].groupId).collapsed,
    false,
  )
  checkpoint(
    "Rapid clicks: one tab per identity; two groups; active expanded and inactive collapsed",
  )
  const personal = await panel.evaluate(
    async (windowId) =>
      chrome.tabs.create({
        windowId,
        url: "https://example.com/personal",
        active: false,
      }),
    windowId,
  )
  await panel.evaluate(async (id) => {
    await chrome.tabs.update(id, { url: "https://example.com/deeper" })
    return (await chrome.tabs.get(id)).url
  }, aId)
  await command({ action: "open", target: a, windowId })
  const url = await panel.evaluate(
    async (id) =>
      (await chrome.tabs.get(id)).pendingUrl || (await chrome.tabs.get(id)).url,
    aId,
  )
  assert.equal(url, "https://example.com/deeper")
  checkpoint(
    "Opening an existing network preserves its navigated URL without reload request",
  )
  const secondWindow = await panel.evaluate(async () =>
    chrome.windows.create({
      url: "https://example.com/second-window",
      focused: false,
    }),
  )
  await panel.evaluate(
    async ({ id, windowId }) => chrome.tabs.move(id, { windowId, index: -1 }),
    { id: aId, windowId: secondWindow.id },
  )
  state = await command({ action: "open", target: a, windowId })
  assert.equal(
    state.entries.find((e) => e.tabId === aId).windowId,
    secondWindow.id,
  )
  assert.equal(
    (await panel.evaluate(async (id) => chrome.tabs.get(id), personal.id))
      .windowId,
    windowId,
  )
  checkpoint(
    "Manual cross-window movement remains tracked; click activates in place; personal tab untouched",
  )
  state = await command({ action: "gather", tabId: aId, windowId })
  assert.equal(state.entries.find((e) => e.tabId === aId).windowId, windowId)
  const groupId = state.entries.find((e) => e.tabId === aId).groupId
  await panel.evaluate(
    async ({ tabId, groupId }) =>
      chrome.tabs.group({ tabIds: [tabId], groupId }),
    { tabId: personal.id, groupId },
  )
  state = await command({ action: "snapshot" })
  assert.equal(state.groups.find((g) => g.id === groupId).mixed, true)
  await assert.rejects(
    command({ action: "rename", groupId, title: "Must not rename" }),
    /mixed_group/,
  )
  checkpoint("Mixed personal group detected; group-wide mutations rejected")
  await panel.evaluate(async (id) => chrome.tabs.remove(id), aId)
  state = await command({ action: "snapshot" })
  assert.equal(
    state.entries.find((e) => e.networkId === "twitter").closed,
    true,
  )
  assert.equal(
    (await command({ action: "snapshot" })).entries.find(
      (e) => e.networkId === "twitter",
    ).tabId,
    null,
  )
  state = await command({ action: "open", target: a, windowId })
  assert.notEqual(
    state.entries.find((e) => e.networkId === "twitter").tabId,
    aId,
  )
  checkpoint("Manual close stays closed; explicit click reopens once")
  const newGroup = state.entries.find((e) => e.networkId === "twitter").groupId
  await panel.evaluate(
    async (id) => chrome.tabGroups.update(id, { title: "Renamed in Chrome" }),
    newGroup,
  )
  await panel.getByText("Renamed in Chrome", { exact: true }).last().waitFor()
  checkpoint("Chrome group rename synchronized into rendered companion")
  const groupSection = panel
    .locator(".managed-group-heading")
    .filter({ hasText: "Renamed in Chrome" })
  await groupSection.locator("button").last().focus()
  await groupSection.locator("button").last().click()
  const edit = panel.locator('[contenteditable="plaintext-only"]')
  await edit.fill("Keyboard renamed")
  await edit.press("Enter")
  await panel.getByText("Keyboard renamed", { exact: true }).last().waitFor()
  assert.equal(
    (await panel.evaluate(async (id) => chrome.tabGroups.get(id), newGroup))
      .title,
    "Keyboard renamed",
  )
  await groupSection.count().catch(() => {})
  const renamed = panel
    .locator(".managed-group-heading")
    .filter({ hasText: "Keyboard renamed" })
  await renamed.locator("button").last().click()
  await renamed.getByRole("textbox").fill("Cancelled")
  await panel.locator('[contenteditable="plaintext-only"]').press("Escape")
  assert.equal(
    (await panel.evaluate(async (id) => chrome.tabGroups.get(id), newGroup))
      .title,
    "Keyboard renamed",
  )
  checkpoint("Inline name editing: Enter saves to Chrome; Escape cancels")
  assert.ok(
    await panel.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "320px overflow",
  )
  await panel.screenshot({
    path: join(output, "panel-light-320.png"),
    fullPage: true,
  })
  await panel.locator("select").nth(1).selectOption("en")
  await panel.getByText("CommunityGlows tabs", { exact: true }).waitFor()
  await panel.screenshot({
    path: join(output, "panel-en-320.png"),
    fullPage: true,
  })
  await panel.getByRole("button", { name: "Dark", exact: true }).click()
  await panel
    .locator('section[aria-label="CommunityGlows tabs"]')
    .screenshot({ path: join(output, "companion-dark-320.png") })
  assert.ok(
    await panel.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  checkpoint("FR/EN, light/dark rendered companion and 320px layout")
  for (const label of ['Same URL A', 'Same URL B']) {
    const form = panel.locator('form.ext-parity-grid--links')
    await form.locator('input').nth(0).fill(label)
    await form.locator('input').nth(1).fill('https://example.com/shared')
    await form.locator('button').click()
    const row = panel.locator('.ext-link-item').filter({hasText:label})
    await row.getByRole('button',{name:'Open',exact:true}).click()
  }
  state = await command({action:'snapshot'})
  const sameUrl = state.entries.filter(entry=>entry.url==='https://example.com/shared')
  assert.equal(sameUrl.length,2)
  assert.notEqual(sameUrl[0].networkId,sameUrl[1].networkId)
  assert.notEqual(sameUrl[0].tabId,sameUrl[1].tabId)
  checkpoint('Two custom links with the same URL keep separate stable identities through UI clicks')
  const beforeRestart = (await command({ action: "snapshot" })).entries.map(
    (e) => e.tabId,
  )
  // Stop the real MV3 worker through the browser target, then wake it via a message.
  const browserCdp = await context.browser().newBrowserCDPSession()
  const { targetInfos } = await browserCdp.send("Target.getTargets")
  const sw = targetInfos.find(
    (t) => t.type === "service_worker" && t.url.startsWith(base),
  )
  assert.ok(sw)
  await browserCdp.send("Target.closeTarget", { targetId: sw.targetId })
  state = await command({ action: "snapshot" })
  assert.deepEqual(
    state.entries.map((e) => e.tabId),
    beforeRestart,
  )
  checkpoint("MV3 worker terminated and woken: same tracked tab IDs")
  await context.close()
  context = await chromium.launchPersistentContext(profile, options)
  await initialize()
  state = await command({ action: "snapshot" })
  assert.ok(state.entries.some((e) => e.recovery))
  assert.ok(state.entries.every((e) => e.tabId === null))
  const restartedWindow = await panel.evaluate(
    async () => (await chrome.windows.getCurrent()).id,
  )
  await assert.rejects(
    command({ action: "open", target: a, windowId: restartedWindow }),
    /restore_required/,
  )
  state = await command({
    action: "open",
    target: a,
    windowId: restartedWindow,
    reopen: true,
  })
  assert.equal(state.entries.filter((e) => e.tabId !== null).length, 1)
  checkpoint(
    "Full browser restart: old IDs discarded, explicit recovery prevents silent duplicates",
  )
  await writeFile(
    join(output, "result.json"),
    JSON.stringify(
      { browser: context.browser().version(), checks, output },
      null,
      2,
    ),
  )
  console.info(JSON.stringify({ checks, output }, null, 2))
} finally {
  await context.close()
}
