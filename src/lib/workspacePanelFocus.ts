export function focusWorkspacePanelTab(
  root: Pick<HTMLElement, "querySelectorAll"> | null,
  panelId: string,
): boolean {
  const tab = Array.from(
    root?.querySelectorAll<HTMLElement>("[data-tab-panel-id]") ?? [],
  ).find((element) => element.dataset.tabPanelId === panelId)
  if (!tab?.isConnected) return false
  if (tab.tabIndex < 0) tab.setAttribute("tabindex", "-1")
  tab.focus({ preventScroll: true })
  return true
}
