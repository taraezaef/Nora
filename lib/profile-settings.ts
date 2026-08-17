import { DEFAULT_ANTI_DETECT, type Profile, settings$ } from '@/states/settings'

export const resolveActiveProfile = (profileId?: string | null): Profile | undefined => {
  const profiles = settings$.profiles.get() ?? []
  if (profileId) {
    return profiles.find((profile) => profile.id === profileId) ?? profiles[0]
  }
  return profiles[0]
}

export const resolveProfileUserAgent = (profileId?: string | null): string => {
  const profile = resolveActiveProfile(profileId)
  if (!profile) {
    return DEFAULT_ANTI_DETECT.customUserAgent
  }
  return profile.customUserAgent.trim() || DEFAULT_ANTI_DETECT.customUserAgent
}

export const getUserAgentForProfile = (profileId?: string | null): string => resolveProfileUserAgent(profileId)

export const resolveProfileSpoofedOS = (profileId?: string | null) => {
  const profile = resolveActiveProfile(profileId)
  return profile?.spoofedOS ?? DEFAULT_ANTI_DETECT.spoofedOS
}

export const resolveProfileProxy = (profileId?: string | null) => {
  const profile = resolveActiveProfile(profileId)
  const resolved = profile ?? DEFAULT_ANTI_DETECT

  return {
    enabled: !!(profile?.isProxyEnabled ?? resolved.isProxyEnabled),
    host: (profile?.proxyHost ?? resolved.proxyHost).trim(),
    port: Number(profile?.proxyPort ?? resolved.proxyPort) || 8080,
    type: profile?.proxyType ?? resolved.proxyType,
    username: (profile?.proxyUsername ?? resolved.proxyUsername).trim(),
    password: (profile?.proxyPassword ?? resolved.proxyPassword).trim(),
  }
}

export const getEffectiveProxy = (profileId?: string | null) => resolveProfileProxy(profileId)

export const resolveProfileTimezoneSync = (profileId?: string | null): boolean => {
  const profile = resolveActiveProfile(profileId)
  return !!(profile?.syncTimezone ?? DEFAULT_ANTI_DETECT.syncTimezone)
}

export const shouldSyncTimezone = (profileId?: string | null): boolean => resolveProfileTimezoneSync(profileId)

export const getProfileTimezoneOffsetMinutes = (profileId?: string | null): number => {
  const proxy = getEffectiveProxy(profileId)
  const host = proxy.host
  if (!host) {
    return 0
  }

  let hash = 0
  for (let i = 0; i < host.length; i += 1) {
    hash = (hash * 31 + host.charCodeAt(i)) >>> 0
  }

  const rawOffset = (hash % 2880) - 1440
  return Math.max(-840, Math.min(840, rawOffset))
}

export const buildTimezoneSpoofScript = (profileId?: string | null): string => {
  if (!shouldSyncTimezone(profileId)) {
    return ''
  }

  const offsetMinutes = getProfileTimezoneOffsetMinutes(profileId)
  const timezoneLabel = `${offsetMinutes >= 0 ? 'UTC+' : 'UTC'}${Math.abs(offsetMinutes / 60)}`

  return `
    (() => {
      try {
        const targetOffsetMinutes = ${offsetMinutes};
        const realGetTimezoneOffset = Date.prototype.getTimezoneOffset;
        const realResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;

        Date.prototype.getTimezoneOffset = function() {
          return targetOffsetMinutes;
        };

        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
          const options = realResolvedOptions.call(this);
          return {
            ...options,
            timeZone: ${JSON.stringify(timezoneLabel)},
            timeZoneName: 'shortOffset',
          };
        };
      } catch (error) {
        console.warn('[Nora] timezone spoof injection failed', error);
      }
    })();
  `.trim()
}

export const resolveProfileAntiDetectState = (profileId?: string | null) => ({
  userAgent: resolveProfileUserAgent(profileId),
  spoofedOS: resolveProfileSpoofedOS(profileId),
  proxy: resolveProfileProxy(profileId),
  syncTimezone: resolveProfileTimezoneSync(profileId),
})
