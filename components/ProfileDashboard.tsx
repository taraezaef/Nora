import React, { useMemo, useState } from 'react'
import { ScrollView, Switch, Text, TextInput, View, Modal, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { useValue } from '@legendapp/state/react'
import { settings$, type Profile, type ProxyType, type SpoofedOS } from '@/states/settings'
import { getAvailableUserAgents } from '@/lib/useragent-repository'
import { exportProfileCookies, importProfileCookies } from '@/lib/cookie-portability'
import { exportApplicationBackupJson, parseApplicationBackup, applyApplicationBackup } from '@/lib/backup-service'
import * as DocumentPicker from 'expo-document-picker'
import { shareAsync, isAvailableAsync } from 'expo-sharing'
import { File, Paths } from 'expo-file-system'

const textMap = {
  en: {
    title: 'Anti-Detect Profile',
    userAgent: 'Custom User-Agent',
    userAgentTemplate: 'Select Template',
    os: 'Spoofed OS',
    proxy: 'Proxy',
    proxyEnabled: 'Enable proxy',
    proxyHost: 'Host',
    proxyPort: 'Port',
    proxyType: 'Type',
    username: 'Username',
    password: 'Password',
    syncTimezone: 'Sync timezone automatically',
    windows: 'Windows',
    android: 'Android',
    ios: 'iOS',
    http: 'HTTP',
    socks4: 'SOCKS4',
    socks5: 'SOCKS5',
    selectUA: 'Choose a template or enter custom',
    cancel: 'Cancel',
    custom: 'Custom',
    cookieManagement: 'Cookie Management',
    exportCookies: 'Export Cookies',
    importCookies: 'Import Cookies',
    cookiesExportedSuccess: 'Cookies exported successfully',
    cookiesImportedSuccess: 'Cookies imported successfully',
    cookiesExportFailed: 'Failed to export cookies',
    cookiesImportFailed: 'Failed to import cookies',
    backup: 'Backup & Restore',
    exportBackup: 'Export Backup',
    importBackup: 'Import Backup',
    backupExportedSuccess: 'Backup exported successfully',
    backupImportedSuccess: 'Backup imported successfully',
    backupExportFailed: 'Failed to export backup',
    backupImportFailed: 'Failed to import backup',
  },
  ar: {
    title: 'ملف تعريف الحماية من الكشف',
    userAgent: 'وكيل مستخدم مخصص',
    userAgentTemplate: 'اختر قالبًا',
    os: 'نظام التشغيل المزيف',
    proxy: 'الوكيل',
    proxyEnabled: 'تفعيل الوكيل',
    proxyHost: 'المضيف',
    proxyPort: 'المنفذ',
    proxyType: 'النوع',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    syncTimezone: 'مزامنة المنطقة الزمنية تلقائيًا',
    windows: 'ويندوز',
    android: 'أندرويد',
    ios: 'آيفون',
    http: 'HTTP',
    socks4: 'SOCKS4',
    socks5: 'SOCKS5',
    selectUA: 'اختر قالبًا أو أدخل مخصصًا',
    cancel: 'إلغاء',
    custom: 'مخصص',
    cookieManagement: 'إدارة ملفات تعريف الارتباط',
    exportCookies: 'تصدير ملفات تعريف الارتباط',
    importCookies: 'استيراد ملفات تعريف الارتباط',
    cookiesExportedSuccess: 'تم تصدير ملفات تعريف الارتباط بنجاح',
    cookiesImportedSuccess: 'تم استيراد ملفات تعريف الارتباط بنجاح',
    cookiesExportFailed: 'فشل في تصدير ملفات تعريف الارتباط',
    cookiesImportFailed: 'فشل في استيراد ملفات تعريف الارتباط',
    backup: 'النسخ الاحتياطي والاستعادة',
    exportBackup: 'تصدير النسخة الاحتياطية',
    importBackup: 'استيراد النسخة الاحتياطية',
    backupExportedSuccess: 'تم تصدير النسخة الاحتياطية بنجاح',
    backupImportedSuccess: 'تم استيراد النسخة الاحتياطية بنجاح',
    backupExportFailed: 'فشل في تصدير النسخة الاحتياطية',
    backupImportFailed: 'فشل في استيراد النسخة الاحتياطية',
  },
} as const

const OS_OPTIONS: SpoofedOS[] = ['Windows', 'Android', 'iOS']
const PROXY_TYPES: ProxyType[] = ['http', 'socks4', 'socks5']

const fieldClassName =
  'border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100'

export const ProfileDashboard = ({ profileId }: { profileId?: string }) => {
  const profiles = useValue(settings$.profiles)
  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? profiles[0] ?? null,
    [profileId, profiles],
  )

  const language = 'en'
  const t = textMap[language as keyof typeof textMap]

  const [draft, setDraft] = useState<Profile | null>(profile)
  const [showUASelector, setShowUASelector] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  React.useEffect(() => {
    setDraft(profile)
  }, [profile])

  if (!profile || !draft) {
    return null
  }

  const updateDraft = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  const saveProfile = () => {
    settings$.updateProfile(profile.id, draft.name, draft.color, draft)
  }

  const isRTL = language === 'ar'
  const availableUAs = getAvailableUserAgents(draft.spoofedOS)

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16 }}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <Text style={{ fontSize: 24, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>{t.title}</Text>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.userAgent}</Text>
          <Switch value={Boolean(draft.customUserAgent)} onValueChange={(value) => updateDraft('customUserAgent', value ? draft.customUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' : '')} />
        </View>

        {Boolean(draft.customUserAgent) && (
          <>
            <Pressable
              onPress={() => setShowUASelector(true)}
              style={{
                borderWidth: 1,
                borderColor: '#d4d4d8',
                borderRadius: 12,
                padding: 12,
                backgroundColor: '#f4f4f5',
              }}
            >
              <Text style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>{t.userAgentTemplate}</Text>
              <Text style={{ color: '#111827', fontWeight: '500' }}>
                {availableUAs.length} {t.selectUA}
              </Text>
            </Pressable>

            <Modal
              visible={showUASelector}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowUASelector(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#fff', maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e4e4e7' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700' }}>{t.userAgentTemplate}</Text>
                    <Pressable onPress={() => setShowUASelector(false)}>
                      <Text style={{ fontSize: 16, color: '#666' }}>✕</Text>
                    </Pressable>
                  </View>

                  <FlatList
                    data={availableUAs}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          updateDraft('customUserAgent', item.userAgent)
                          setShowUASelector(false)
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f4f4f5',
                        }}
                      >
                        <Text style={{ fontWeight: '600', color: '#111827', marginBottom: 2 }}>{item.label}</Text>
                        <Text style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{item.browser} {item.browserVersion}</Text>
                      </Pressable>
                    )}
                    scrollEnabled
                  />
                </View>
              </View>
            </Modal>

            <TextInput
              className={fieldClassName}
              value={draft.customUserAgent}
              onChangeText={(value) => updateDraft('customUserAgent', value)}
              placeholder="Mozilla/5.0 ..."
              textAlign={isRTL ? 'right' : 'left'}
              placeholderTextColor="#9ca3af"
              multiline
            />
          </>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.os}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {OS_OPTIONS.map((option) => (
            <Text
              key={option}
              onPress={() => updateDraft('spoofedOS', option)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: draft.spoofedOS === option ? '#6366f1' : '#d4d4d8',
                backgroundColor: draft.spoofedOS === option ? '#e0e7ff' : '#fff',
                color: '#111827',
              }}
            >
              {t[option.toLowerCase() as keyof typeof t]}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.proxy}</Text>
          <Switch value={draft.isProxyEnabled} onValueChange={(value) => updateDraft('isProxyEnabled', value)} />
        </View>

        {draft.isProxyEnabled ? (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.proxyHost}</Text>
              <TextInput
                className={fieldClassName}
                value={draft.proxyHost}
                onChangeText={(value) => updateDraft('proxyHost', value)}
                placeholder="127.0.0.1"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.proxyPort}</Text>
              <TextInput
                className={fieldClassName}
                value={String(draft.proxyPort)}
                keyboardType="numeric"
                onChangeText={(value) => updateDraft('proxyPort', Number(value) || 8080)}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.proxyType}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {PROXY_TYPES.map((option) => (
                  <Text
                    key={option}
                    onPress={() => updateDraft('proxyType', option)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: draft.proxyType === option ? '#6366f1' : '#d4d4d8',
                      backgroundColor: draft.proxyType === option ? '#e0e7ff' : '#fff',
                      color: '#111827',
                    }}
                  >
                    {t[option as keyof typeof t]}
                  </Text>
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.username}</Text>
              <TextInput
                className={fieldClassName}
                value={draft.proxyUsername}
                onChangeText={(value) => updateDraft('proxyUsername', value)}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.password}</Text>
              <TextInput
                className={fieldClassName}
                value={draft.proxyPassword}
                onChangeText={(value) => updateDraft('proxyPassword', value)}
                secureTextEntry
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.syncTimezone}</Text>
        <Switch value={draft.syncTimezone} onValueChange={(value) => updateDraft('syncTimezone', value)} />
      </View>

      <Text
        onPress={saveProfile}
        style={{
          marginTop: 8,
          paddingVertical: 12,
          textAlign: 'center',
          backgroundColor: '#111827',
          color: '#fff',
          borderRadius: 12,
          fontWeight: '700',
        }}
      >
        Save
      </Text>

      <View style={{ marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e4e4e7', paddingTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>{t.cookieManagement}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            disabled={exporting}
            onPress={async () => {
              setExporting(true)
              try {
                const cookieData = await exportProfileCookies(profile!.id, 'json')
                if (cookieData && (await isAvailableAsync())) {
                  const fileName = `cookies-${profile!.name}-${Date.now()}.json`
                  const file = new File(Paths.cache, fileName)
                  file.write(cookieData)
                  await shareAsync(file.uri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export Cookies',
                  })
                }
              } catch (e) {
                console.error('[ProfileDashboard] Cookie export failed:', e)
              } finally {
                setExporting(false)
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: '#e0e7ff',
              opacity: exporting ? 0.6 : 1,
            }}
          >
            {exporting ? (
              <ActivityIndicator color="#6366f1" />
            ) : (
              <Text style={{ textAlign: 'center', color: '#6366f1', fontWeight: '600', fontSize: 13 }}>
                {t.exportCookies}
              </Text>
            )}
          </Pressable>
          <Pressable
            disabled={importing}
            onPress={async () => {
              const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: false,
                type: ['application/json', 'text/*'],
              })
              const asset = result.assets?.[0]
              if (!asset) return

              setImporting(true)
              try {
                const response = await fetch(asset.uri)
                const text = await response.text()
                await importProfileCookies(profile!.id, text, 'json')
              } catch (e) {
                console.error('[ProfileDashboard] Cookie import failed:', e)
              } finally {
                setImporting(false)
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: '#dbeafe',
              opacity: importing ? 0.6 : 1,
            }}
          >
            {importing ? (
              <ActivityIndicator color="#3b82f6" />
            ) : (
              <Text style={{ textAlign: 'center', color: '#3b82f6', fontWeight: '600', fontSize: 13 }}>
                {t.importCookies}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 12, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#e4e4e7', paddingTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>{t.backup}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            disabled={exporting}
            onPress={async () => {
              setExporting(true)
              try {
                const backupData = await exportApplicationBackupJson()
                if (backupData && (await isAvailableAsync())) {
                  const fileName = `Nora_backup_${Date.now()}.json`
                  const file = new File(Paths.cache, fileName)
                  file.write(backupData)
                  await shareAsync(file.uri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export Backup',
                  })
                }
              } catch (e) {
                console.error('[ProfileDashboard] Backup export failed:', e)
              } finally {
                setExporting(false)
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: '#f0fdf4',
              opacity: exporting ? 0.6 : 1,
            }}
          >
            {exporting ? (
              <ActivityIndicator color="#16a34a" />
            ) : (
              <Text style={{ textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: 13 }}>
                {t.exportBackup}
              </Text>
            )}
          </Pressable>
          <Pressable
            disabled={importing}
            onPress={async () => {
              const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: false,
                type: ['application/json', 'text/*'],
              })
              const asset = result.assets?.[0]
              if (!asset) return

              setImporting(true)
              try {
                const response = await fetch(asset.uri)
                const text = await response.text()
                const backup = parseApplicationBackup(text)
                await applyApplicationBackup(backup)
              } catch (e) {
                console.error('[ProfileDashboard] Backup import failed:', e)
              } finally {
                setImporting(false)
              }
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: '#fef3c7',
              opacity: importing ? 0.6 : 1,
            }}
          >
            {importing ? (
              <ActivityIndicator color="#d97706" />
            ) : (
              <Text style={{ textAlign: 'center', color: '#d97706', fontWeight: '600', fontSize: 13 }}>
                {t.importBackup}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}
