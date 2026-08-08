import { icons } from '@iconify-json/simple-icons/icons.json'

export type DownloadPlatformId = 'windows' | 'linux' | 'android' | 'apple'
export type DownloadAvailability = 'available' | 'release-page' | 'coming-soon'

export interface DownloadPlatform {
  id: DownloadPlatformId
  availability: DownloadAvailability
  href?: string
  iconBody: string
}

const platformIcons = icons as Record<DownloadPlatformId, { body: string }>

export const downloadPlatforms: readonly DownloadPlatform[] = [
  { id: 'windows', availability: 'available', href: 'https://github.com/commandglows/communityglows/releases/download/windows-latest/CommunityGlows-Windows-latest.exe', iconBody: platformIcons.windows.body },
  { id: 'linux', availability: 'release-page', href: 'https://github.com/commandglows/communityglows/releases/latest', iconBody: platformIcons.linux.body },
  { id: 'android', availability: 'coming-soon', iconBody: platformIcons.android.body },
  { id: 'apple', availability: 'coming-soon', iconBody: platformIcons.apple.body },
]
