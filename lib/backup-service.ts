/**
 * Backup Service Module
 * Provides comprehensive backup and restore functionality for the entire application
 * including profiles, settings, cookies, and configurations
 */

import { settings$, getSettingsSnapshot, type Settings } from '@/states/settings'
import { bookmarks$, type Bookmark } from '@/states/bookmarks'
import { userStyles$, getUserStylesSnapshot, type UserStylesSnapshot } from '@/states/user-styles'
import { blocklist$ } from '@/states/blocklist'
import {
  SETTINGS_BACKUP_KIND,
  SETTINGS_BACKUP_VERSION,
  type SettingsBackup,
  type ParsedSettingsBackup,
} from '@/lib/settings-transfer'
import { exportProfileCookies, importProfileCookies, detectCookieFormat } from '@/lib/cookie-portability'
import { normalizeUserStyles } from '@/lib/user-styles'
import { version } from '../package.json'
import { isWeb } from '@/lib/utils'

export interface ApplicationBackup extends SettingsBackup {
  // Extended backup format with per-profile cookies
  cookies?: Record<string, string> // profileId -> exported cookies JSON
}

export interface ParsedApplicationBackup extends ParsedSettingsBackup {
  cookies?: Record<string, string>
}

/**
 * Create a complete application backup including all profiles and their cookies
 * @returns ApplicationBackup object
 */
export async function exportApplicationBackup(): Promise<ApplicationBackup> {
  const backup: ApplicationBackup = {
    kind: SETTINGS_BACKUP_KIND,
    version: SETTINGS_BACKUP_VERSION,
    appVersion: version,
    exportedAt: new Date().toISOString(),
    settings: getSettingsSnapshot(),
    bookmarks: normalizeBookmarks(bookmarks$.bookmarks.get()),
    userStyles: getUserStylesSnapshot(),
    blocklist: { enabled: blocklist$.enabled.get() },
    cookies: {},
  }

  // Export cookies for each profile
  const profiles = settings$.profiles.get() || []
  for (const profile of profiles) {
    try {
      const cookieData = await exportProfileCookies(profile.id, 'json')
      if (cookieData) {
        backup.cookies![profile.id] = cookieData
      }
    } catch (error) {
      console.warn(`[BackupService] Failed to export cookies for profile ${profile.id}:`, error)
      // Continue with next profile
    }
  }

  return backup
}

/**
 * Export backup as JSON string
 * @returns JSON string representation of backup
 */
export async function exportApplicationBackupJson(): Promise<string> {
  const backup = await exportApplicationBackup()
  return JSON.stringify(backup, null, 2)
}

/**
 * Get backup filename with timestamp
 * @returns Suggested filename for backup file
 */
export function getBackupFilename(): string {
  return `Nora_backup_${Date.now()}.json`
}

/**
 * Parse an application backup file
 * @param text - JSON text of backup file
 * @returns Parsed backup object
 */
export function parseApplicationBackup(text: string): ParsedApplicationBackup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Not a valid JSON file')
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Not a Nora backup file')
  }

  const backup = data as Partial<ApplicationBackup>
  if (backup.kind !== SETTINGS_BACKUP_KIND) {
    throw new Error('Not a Nora backup file')
  }
  if (backup.version !== SETTINGS_BACKUP_VERSION) {
    throw new Error(
      typeof backup.version === 'number' && backup.version > SETTINGS_BACKUP_VERSION
        ? 'This backup file was created by a newer version of Nora'
        : 'Unsupported Nora backup file version',
    )
  }

  const isObject = (value: unknown) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

  const result: ParsedApplicationBackup = {}

  // Parse settings
  if (isObject(backup.settings)) {
    result.settings = getSettingsSnapshot(backup.settings)
  }

  // Parse bookmarks
  if (Array.isArray(backup.bookmarks)) {
    result.bookmarks = normalizeBookmarks(backup.bookmarks)
  }

  // Parse user styles
  if (isObject(backup.userStyles)) {
    result.userStyles = normalizeUserStyles(backup.userStyles)
  }

  // Parse blocklist
  if (isObject(backup.blocklist) && typeof backup.blocklist?.enabled === 'boolean') {
    result.blocklist = { enabled: backup.blocklist.enabled }
  }

  // Parse cookies
  if (isObject(backup.cookies)) {
    result.cookies = backup.cookies as Record<string, string>
  }

  if (!result.settings && !result.bookmarks && !result.userStyles && !result.blocklist && !result.cookies) {
    throw new Error('Nothing to import in this file')
  }

  return result
}

/**
 * Apply parsed backup to application state
 * @param backup - Parsed backup to apply
 * @returns Array of sections that were restored
 */
export async function applyApplicationBackup(backup: ParsedApplicationBackup): Promise<string[]> {
  const restored: string[] = []

  // Apply settings
  if (backup.settings) {
    settings$.set(backup.settings)
    restored.push('Profiles')
  }

  // Apply bookmarks
  if (backup.bookmarks) {
    bookmarks$.bookmarks.set(backup.bookmarks)
    restored.push('Bookmarks')
  }

  // Apply user styles
  if (backup.userStyles) {
    userStyles$.set(backup.userStyles)
    restored.push('Custom Styles & Scripts')
  }

  // Apply blocklist setting
  if (backup.blocklist) {
    blocklist$.enabled.set(backup.blocklist.enabled)
    restored.push('Blocklist')
  }

  // Apply cookies if available
  if (backup.cookies && !isWeb) {
    const cookieResults: string[] = []
    const profiles = settings$.profiles.get() || []

    for (const profile of profiles) {
      const cookieData = backup.cookies[profile.id]
      if (cookieData) {
        try {
          const format = detectCookieFormat(cookieData)
          const count = await importProfileCookies(profile.id, cookieData, format)
          if (count > 0) {
            cookieResults.push(`${profile.name} (${count} cookies)`)
          }
        } catch (error) {
          console.warn(`[BackupService] Failed to restore cookies for profile ${profile.id}:`, error)
        }
      }
    }

    if (cookieResults.length > 0) {
      restored.push(`Cookies: ${cookieResults.join(', ')}`)
    }
  }

  return restored
}

/**
 * Count sections in a backup file
 * @param backup - Parsed backup
 * @returns Count of available sections
 */
export function countBackupSections(backup: ParsedApplicationBackup): number {
  let count = 0
  if (backup.settings) count++
  if (backup.bookmarks) count++
  if (backup.userStyles) count++
  if (backup.blocklist) count++
  if (backup.cookies && Object.keys(backup.cookies).length > 0) count++
  return count
}

/**
 * Get detailed info about backup contents
 * @param backup - Parsed backup
 * @returns Object with detailed counts and info
 */
export function getBackupInfo(backup: ParsedApplicationBackup): {
  profiles: number
  bookmarks: number
  userStyles: number
  cookies: Record<string, number>
} {
  const info = {
    profiles: backup.settings?.profiles?.length ?? 0,
    bookmarks: backup.bookmarks?.length ?? 0,
    userStyles: Object.keys(backup.userStyles ?? {}).length,
    cookies: {} as Record<string, number>,
  }

  // Count cookies per profile
  if (backup.cookies) {
    for (const [profileId, cookieData] of Object.entries(backup.cookies)) {
      try {
        const format = detectCookieFormat(cookieData)
        const matches = format === 'json' ? cookieData.match(/{\s*"domain"/g) : cookieData.match(/\t/g)
        info.cookies[profileId] = format === 'json' ? (matches?.length ?? 0) : Math.max(0, (matches?.length ?? 0) / 6)
      } catch {
        info.cookies[profileId] = 0
      }
    }
  }

  return info
}

// Helper functions from settings-transfer
const normalizeBookmarks = (bookmarks?: (Partial<Bookmark> | null | undefined)[]): Bookmark[] =>
  (bookmarks || [])
    .filter((bookmark) => bookmark && typeof bookmark.url === 'string' && bookmark.url.trim())
    .map((bookmark) => ({
      url: bookmark!.url!,
      title: typeof bookmark!.title === 'string' ? bookmark!.title : undefined,
      icon: typeof bookmark!.icon === 'string' ? bookmark!.icon : undefined,
    }))
