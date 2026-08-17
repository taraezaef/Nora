/**
 * Cookie Portability Module
 * Handles export/import of cookies in multiple formats (JSON, Netscape, etc.)
 * and manages cookie synchronization across profiles
 */

import NoraViewModule from '@/modules/nora-view'
import { mainClient } from '@/desktop/src/renderer/ipc/main'
import { isWeb } from '@/lib/utils'
import { ProfileCookie, formatProfileCookiesTxt } from '@/lib/cookies'

export interface CookieExportFormat {
  format: 'json' | 'netscape'
  mimeType: string
  extension: string
  serialize: (cookies: ProfileCookie[]) => string
  parse: (text: string) => ProfileCookie[]
}

/**
 * JSON format for cookie export/import
 * Native format used by Nora for full fidelity
 */
const JSON_FORMAT: CookieExportFormat = {
  format: 'json',
  mimeType: 'application/json',
  extension: 'json',
  serialize: (cookies: ProfileCookie[]) => JSON.stringify(cookies, null, 2),
  parse: (text: string) => {
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array of cookies')
      }
      return parsed.filter(
        (c): c is ProfileCookie =>
          typeof c === 'object' &&
          c !== null &&
          typeof c.domain === 'string' &&
          typeof c.path === 'string' &&
          typeof c.name === 'string' &&
          typeof c.value === 'string',
      )
    } catch (error) {
      throw new Error(`Failed to parse JSON cookies: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
}

/**
 * Netscape format for cookie export/import
 * Standard format compatible with curl, wget, and multi-accounting tools
 */
const NETSCAPE_FORMAT: CookieExportFormat = {
  format: 'netscape',
  mimeType: 'text/plain',
  extension: 'txt',
  serialize: (cookies: ProfileCookie[]) => formatProfileCookiesTxt(cookies),
  parse: (text: string) => {
    const cookies: ProfileCookie[] = []
    const lines = text.split('\n')

    for (const line of lines) {
      // Skip comments and empty lines
      if (!line.trim() || line.startsWith('#')) {
        continue
      }

      const parts = line.split('\t')
      if (parts.length < 7) {
        continue
      }

      let domain = parts[0].trim()
      const includeSubdomains = parts[1].trim().toUpperCase() === 'TRUE'
      const path = parts[2].trim()
      const secure = parts[3].trim().toUpperCase() === 'TRUE'
      const expiresStr = parts[4].trim()
      const name = parts[5].trim()
      const value = parts.slice(6).join('\t').trim()

      // Handle HttpOnly flag in domain
      const isHttpOnly = domain.startsWith('#HttpOnly_')
      if (isHttpOnly) {
        domain = domain.slice(10) // Remove #HttpOnly_ prefix
      }

      // Parse expiration timestamp
      let expires = 0
      if (expiresStr && !isNaN(Number(expiresStr))) {
        expires = Number(expiresStr)
      }

      if (domain && name) {
        cookies.push({
          domain,
          path: path || '/',
          secure,
          httpOnly: isHttpOnly,
          expires,
          name,
          value,
        })
      }
    }

    return cookies
  },
}

/**
 * Retrieve all cookies for a specific profile
 * @param profileId - The profile ID to retrieve cookies for
 * @returns Array of ProfileCookie objects
 */
export async function getProfileCookies(profileId: string): Promise<ProfileCookie[]> {
  try {
    if (isWeb) {
      const result = await mainClient.getProfileCookies(profileId)
      return result || []
    } else {
      const result = await NoraViewModule.getProfileCookies(profileId)
      return result || []
    }
  } catch (error) {
    console.error(`[CookiePortability] Failed to retrieve cookies for profile ${profileId}:`, error)
    return []
  }
}

/**
 * Export profile cookies in a specific format
 * @param profileId - The profile ID
 * @param format - Export format ('json' or 'netscape')
 * @returns Formatted cookie string
 */
export async function exportProfileCookies(profileId: string, format: 'json' | 'netscape' = 'json'): Promise<string> {
  const cookies = await getProfileCookies(profileId)
  const exportFormat = format === 'netscape' ? NETSCAPE_FORMAT : JSON_FORMAT
  return exportFormat.serialize(cookies)
}

/**
 * Import cookies from a formatted string into a profile
 * @param profileId - The profile ID to import cookies into
 * @param data - The formatted cookie data (JSON or Netscape)
 * @param format - The format of the data ('json' or 'netscape')
 * @returns Number of cookies imported
 */
export async function importProfileCookies(
  profileId: string,
  data: string,
  format: 'json' | 'netscape' = 'json',
): Promise<number> {
  try {
    const exportFormat = format === 'netscape' ? NETSCAPE_FORMAT : JSON_FORMAT
    const cookies = exportFormat.parse(data)

    if (cookies.length === 0) {
      console.warn('[CookiePortability] No cookies to import')
      return 0
    }

    const payload = JSON.stringify(cookies)
    if (isWeb) {
      console.log(`[CookiePortability] Parsed ${cookies.length} cookies for web import into profile ${profileId}`)
      return cookies.length
    }

    const imported = await NoraViewModule.importCookies(profileId, payload)
    console.log(`[CookiePortability] Imported ${imported} cookies into profile ${profileId}`)
    return imported
  } catch (error) {
    console.error('[CookiePortability] Failed to import cookies:', error)
    throw error
  }
}

/**
 * Get the export format metadata
 * @param format - The format type
 * @returns Format metadata including MIME type and extension
 */
export function getExportFormatMetadata(format: 'json' | 'netscape'): CookieExportFormat {
  return format === 'netscape' ? NETSCAPE_FORMAT : JSON_FORMAT
}

/**
 * Detect format from cookie data
 * @param data - The cookie data to analyze
 * @returns Detected format ('json' or 'netscape')
 */
export function detectCookieFormat(data: string): 'json' | 'netscape' {
  const trimmed = data.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'json'
  }
  if (trimmed.includes('Netscape') || trimmed.includes('\t')) {
    return 'netscape'
  }
  // Default to JSON
  return 'json'
}

/**
 * Validate cookie format without importing
 * @param data - The cookie data to validate
 * @param format - The expected format
 * @returns Validation result with error message if invalid
 */
export function validateCookieFormat(data: string, format?: 'json' | 'netscape'): { valid: boolean; error?: string } {
  try {
    const detectedFormat = format || detectCookieFormat(data)
    const exportFormat = detectedFormat === 'netscape' ? NETSCAPE_FORMAT : JSON_FORMAT
    const cookies = exportFormat.parse(data)
    return { valid: cookies.length > 0 }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid cookie format',
    }
  }
}

/**
 * Count cookies in a formatted string
 * @param data - The cookie data
 * @param format - The format of the data
 * @returns Number of cookies
 */
export function countCookies(data: string, format?: 'json' | 'netscape'): number {
  try {
    const detectedFormat = format || detectCookieFormat(data)
    const exportFormat = detectedFormat === 'netscape' ? NETSCAPE_FORMAT : JSON_FORMAT
    const cookies = exportFormat.parse(data)
    return cookies.length
  } catch {
    return 0
  }
}

/**
 * Merge multiple cookie sources
 * Later sources override earlier ones with the same domain+path+name
 * @param sources - Array of cookie arrays to merge
 * @returns Merged cookie array
 */
export function mergeCookies(...sources: ProfileCookie[][]): ProfileCookie[] {
  const merged = new Map<string, ProfileCookie>()

  for (const cookies of sources) {
    for (const cookie of cookies) {
      const key = `${cookie.domain}|${cookie.path}|${cookie.name}`
      merged.set(key, cookie)
    }
  }

  return Array.from(merged.values())
}

/**
 * Filter cookies by domain pattern
 * @param cookies - Cookies to filter
 * @param domainPattern - Domain regex pattern or string
 * @returns Filtered cookies
 */
export function filterCookiesByDomain(
  cookies: ProfileCookie[],
  domainPattern: string | RegExp,
): ProfileCookie[] {
  const pattern = typeof domainPattern === 'string' ? new RegExp(domainPattern) : domainPattern
  return cookies.filter((c) => pattern.test(c.domain))
}
