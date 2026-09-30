export type DesktopSurface = "bento" | "network" | "route"
export type TasksNavigationTarget = "route"

export function resolveTasksNavigation(
  _bentoActive: boolean,
): TasksNavigationTarget {
  return "route"
}

export function resolveDesktopSurface(
  bentoActive: boolean,
  activeNetworkUrl: string | null,
): DesktopSurface {
  if (bentoActive) return "bento"
  return activeNetworkUrl ? "network" : "route"
}
