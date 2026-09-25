/** Catalog identity survives a personal rename and Dockview layout serialization. */
export const BENTO_CATALOG_GROUP_KEY = 'communityGlowsCatalogGroupId'

export type BentoGroupDestination = {
  groupId: string
  tabGroupId: string
  label: string
  catalogGroupId?: string
}

export function bentoGroupDestinationValue(group: BentoGroupDestination): string {
  return JSON.stringify([group.groupId, group.tabGroupId])
}

/** Only call for a new panel. Existing panels keep their personal organization. */
export function resolveBentoGroupDestination(
  selection: string,
  catalogGroupId: string | undefined,
  groups: readonly BentoGroupDestination[],
): BentoGroupDestination | undefined {
  if (selection === 'ungrouped' || selection === 'new-category') return undefined
  if (selection === 'category') {
    return catalogGroupId
      ? groups.find((group) => group.catalogGroupId === catalogGroupId)
      : undefined
  }
  return groups.find((group) => bentoGroupDestinationValue(group) === selection)
}
