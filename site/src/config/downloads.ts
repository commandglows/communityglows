export type DownloadPlatformId = 'windows' | 'linux' | 'android' | 'ios'
export type DownloadAvailability = 'available' | 'release-page' | 'coming-soon'

export interface DownloadPlatform {
  id: DownloadPlatformId
  availability: DownloadAvailability
  href?: string
}

export const downloadPlatforms: readonly DownloadPlatform[] = [
  { id: 'windows', availability: 'available', href: 'https://github.com/commandglows/communityglows/releases/download/windows-latest/CommunityGlows-Windows-latest.exe' },
  { id: 'linux', availability: 'release-page', href: 'https://github.com/commandglows/communityglows/releases/latest' },
  { id: 'android', availability: 'coming-soon' },
  { id: 'ios', availability: 'coming-soon' },
]
