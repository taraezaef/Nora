/**
 * Comprehensive repository of authentic, up-to-date User-Agent strings
 * categorized by Operating System for anti-detect fingerprint spoofing.
 * Last updated: August 2026
 */

export type OSType = 'Windows' | 'Android' | 'iOS'

export interface UserAgentTemplate {
  id: string
  label: string
  userAgent: string
  browser: string
  browserVersion: string
  os: string
  osVersion: string
}

// Windows User-Agents (Chrome, Edge, Firefox)
const WINDOWS_USER_AGENTS: UserAgentTemplate[] = [
  {
    id: 'win-chrome-142-w11',
    label: 'Windows 11 - Chrome 142',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7144.89 Safari/537.36',
    browser: 'Chrome',
    browserVersion: '142.0.7144.89',
    os: 'Windows',
    osVersion: '11',
  },
  {
    id: 'win-chrome-141-w11',
    label: 'Windows 11 - Chrome 141',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7099.78 Safari/537.36',
    browser: 'Chrome',
    browserVersion: '141.0.7099.78',
    os: 'Windows',
    osVersion: '11',
  },
  {
    id: 'win-chrome-140-w10',
    label: 'Windows 10 - Chrome 140',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7044.52 Safari/537.36',
    browser: 'Chrome',
    browserVersion: '140.0.7044.52',
    os: 'Windows',
    osVersion: '10',
  },
  {
    id: 'win-edge-142-w11',
    label: 'Windows 11 - Edge 142',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7144.89 Safari/537.36 Edg/142.0.7144.89',
    browser: 'Edge',
    browserVersion: '142.0.7144.89',
    os: 'Windows',
    osVersion: '11',
  },
  {
    id: 'win-edge-141-w11',
    label: 'Windows 11 - Edge 141',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7099.78 Safari/537.36 Edg/141.0.7099.78',
    browser: 'Edge',
    browserVersion: '141.0.7099.78',
    os: 'Windows',
    osVersion: '11',
  },
  {
    id: 'win-edge-140-w10',
    label: 'Windows 10 - Edge 140',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7044.52 Safari/537.36 Edg/140.0.7044.52',
    browser: 'Edge',
    browserVersion: '140.0.7044.52',
    os: 'Windows',
    osVersion: '10',
  },
  {
    id: 'win-firefox-125-w11',
    label: 'Windows 11 - Firefox 125',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    browser: 'Firefox',
    browserVersion: '125.0',
    os: 'Windows',
    osVersion: '11',
  },
  {
    id: 'win-firefox-124-w10',
    label: 'Windows 10 - Firefox 124',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    browser: 'Firefox',
    browserVersion: '124.0',
    os: 'Windows',
    osVersion: '10',
  },
  {
    id: 'win-firefox-123-w11',
    label: 'Windows 11 - Firefox 123',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    browser: 'Firefox',
    browserVersion: '123.0',
    os: 'Windows',
    osVersion: '11',
  },
]

// iOS User-Agents (Mobile Safari on iPhone)
const IOS_USER_AGENTS: UserAgentTemplate[] = [
  {
    id: 'ios-safari-ios18-iphone15',
    label: 'iOS 18 - Safari on iPhone 15',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    browser: 'Mobile Safari',
    browserVersion: '18.0',
    os: 'iOS',
    osVersion: '18',
  },
  {
    id: 'ios-safari-ios17-iphone15',
    label: 'iOS 17 - Safari on iPhone 15',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1',
    browser: 'Mobile Safari',
    browserVersion: '17.7',
    os: 'iOS',
    osVersion: '17',
  },
  {
    id: 'ios-safari-ios17-iphone14',
    label: 'iOS 17 - Safari on iPhone 14',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
    browser: 'Mobile Safari',
    browserVersion: '17.6',
    os: 'iOS',
    osVersion: '17',
  },
  {
    id: 'ios-chrome-ios18-iphone15',
    label: 'iOS 18 - Chrome on iPhone 15',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.7144.89 Mobile/15E148 Safari/604.1',
    browser: 'Chrome Mobile',
    browserVersion: '142.0.7144.89',
    os: 'iOS',
    osVersion: '18',
  },
  {
    id: 'ios-chrome-ios17-iphone15',
    label: 'iOS 17 - Chrome on iPhone 15',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7099.78 Mobile/15E148 Safari/604.1',
    browser: 'Chrome Mobile',
    browserVersion: '141.0.7099.78',
    os: 'iOS',
    osVersion: '17',
  },
  {
    id: 'ios-chrome-ios16-iphone13',
    label: 'iOS 16 - Chrome on iPhone 13',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7044.52 Mobile/15E148 Safari/604.1',
    browser: 'Chrome Mobile',
    browserVersion: '140.0.7044.52',
    os: 'iOS',
    osVersion: '16',
  },
]

// Android User-Agents (Chrome Mobile, Samsung Browser)
const ANDROID_USER_AGENTS: UserAgentTemplate[] = [
  {
    id: 'android-chrome-142-android14',
    label: 'Android 14 - Chrome 142',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7144.89 Mobile Safari/537.36',
    browser: 'Chrome Mobile',
    browserVersion: '142.0.7144.89',
    os: 'Android',
    osVersion: '14',
  },
  {
    id: 'android-chrome-141-android14',
    label: 'Android 14 - Chrome 141',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7099.78 Mobile Safari/537.36',
    browser: 'Chrome Mobile',
    browserVersion: '141.0.7099.78',
    os: 'Android',
    osVersion: '14',
  },
  {
    id: 'android-chrome-140-android13',
    label: 'Android 13 - Chrome 140',
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7044.52 Mobile Safari/537.36',
    browser: 'Chrome Mobile',
    browserVersion: '140.0.7044.52',
    os: 'Android',
    osVersion: '13',
  },
  {
    id: 'android-samsung-browser-26-android14',
    label: 'Android 14 - Samsung Browser 26',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/142.0.7144.89 Mobile Safari/537.36',
    browser: 'Samsung Browser',
    browserVersion: '26.0',
    os: 'Android',
    osVersion: '14',
  },
  {
    id: 'android-samsung-browser-25-android14',
    label: 'Android 14 - Samsung Browser 25',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/141.0.7099.78 Mobile Safari/537.36',
    browser: 'Samsung Browser',
    browserVersion: '25.0',
    os: 'Android',
    osVersion: '14',
  },
  {
    id: 'android-samsung-browser-24-android13',
    label: 'Android 13 - Samsung Browser 24',
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/140.0.7044.52 Mobile Safari/537.36',
    browser: 'Samsung Browser',
    browserVersion: '24.0',
    os: 'Android',
    osVersion: '13',
  },
  {
    id: 'android-chrome-142-android12',
    label: 'Android 12 - Chrome 142',
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; ONEPLUS A6013) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7144.89 Mobile Safari/537.36',
    browser: 'Chrome Mobile',
    browserVersion: '142.0.7144.89',
    os: 'Android',
    osVersion: '12',
  },
]

/**
 * Get available user-agent templates for a specific OS type.
 * @param osType - The OS type: 'Windows', 'Android', or 'iOS'
 * @returns Array of user-agent templates for that OS
 */
export function getAvailableUserAgents(osType: OSType): UserAgentTemplate[] {
  switch (osType) {
    case 'Windows':
      return WINDOWS_USER_AGENTS
    case 'Android':
      return ANDROID_USER_AGENTS
    case 'iOS':
      return IOS_USER_AGENTS
    default:
      return []
  }
}

/**
 * Get a specific user-agent template by ID.
 * @param id - The template ID
 * @returns The user-agent template, or undefined if not found
 */
export function getUserAgentTemplate(id: string): UserAgentTemplate | undefined {
  const allTemplates = [...WINDOWS_USER_AGENTS, ...IOS_USER_AGENTS, ...ANDROID_USER_AGENTS]
  return allTemplates.find((template) => template.id === id)
}

/**
 * Get the user-agent string for a template ID.
 * @param id - The template ID
 * @returns The user-agent string, or empty string if not found
 */
export function getTemplateUserAgentString(id: string): string {
  const template = getUserAgentTemplate(id)
  return template?.userAgent ?? ''
}

/**
 * Get all available user-agent templates.
 * @returns All user-agent templates across all OS types
 */
export function getAllUserAgents(): UserAgentTemplate[] {
  return [...WINDOWS_USER_AGENTS, ...IOS_USER_AGENTS, ...ANDROID_USER_AGENTS]
}
