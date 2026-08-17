import { describe, expect, it } from 'bun:test'
import { autoProfileColors, getDeterministicProfileColor } from './profile-color'
import { getSiteFromProfileId } from './site-profile'
import { getEffectiveProxy, getUserAgentForProfile, shouldSyncTimezone } from './profile-settings'

describe('profile colors', () => {
  it('returns stable deterministic colors for auto site profiles', () => {
    const first = getDeterministicProfileColor('facebook.com')
    const second = getDeterministicProfileColor('facebook.com')

    expect(first).toBe(second)
    expect(autoProfileColors).toContain(first)
  })

  it('uses the site value instead of the raw profile id for deterministic colors', () => {
    const site = getSiteFromProfileId('site:facebook.com')
    expect(site).toBe('facebook.com')
    expect(getDeterministicProfileColor(site!)).toBe(getDeterministicProfileColor('facebook.com'))
  })

  it('exposes profile-aware anti-detect helpers for the webview integration', () => {
    const userAgent = getUserAgentForProfile('default')
    const proxy = getEffectiveProxy('default')
    const syncTimezone = shouldSyncTimezone('default')

    expect(typeof userAgent).toBe('string')
    expect(userAgent.length).toBeGreaterThan(0)
    expect(proxy).toMatchObject({ enabled: false, host: '', port: 8080, type: 'http' })
    expect(typeof syncTimezone).toBe('boolean')
  })
})
