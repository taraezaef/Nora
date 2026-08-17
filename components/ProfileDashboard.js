import React, { useMemo, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useValue } from '@legendapp/state/react';
import { settings$ } from '@/states/settings';
const textMap = {
    en: {
        title: 'Anti-Detect Profile',
        userAgent: 'Custom User-Agent',
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
    },
    ar: {
        title: 'ملف تعريف الحماية من الكشف',
        userAgent: 'وكيل مستخدم مخصص',
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
    },
};
const OS_OPTIONS = ['Windows', 'Android', 'iOS'];
const PROXY_TYPES = ['http', 'socks4', 'socks5'];
const fieldClassName = 'border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100';
export const ProfileDashboard = ({ profileId }) => {
    const profiles = useValue(settings$.profiles);
    const profile = useMemo(() => profiles.find((item) => item.id === profileId) ?? profiles[0] ?? null, [profileId, profiles]);
    const language = 'en';
    const t = textMap[language];
    const [draft, setDraft] = useState(profile);
    React.useEffect(() => {
        setDraft(profile);
    }, [profile]);
    if (!profile || !draft) {
        return null;
    }
    const updateDraft = (key, value) => {
        setDraft((current) => (current ? { ...current, [key]: value } : current));
    };
    const saveProfile = () => {
        settings$.updateProfile(profile.id, draft.name, draft.color, draft);
    };
    const isRTL = language === 'ar';
    return (<ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>{t.title}</Text>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.userAgent}</Text>
          <Switch value={Boolean(draft.customUserAgent)} onValueChange={(value) => updateDraft('customUserAgent', value ? draft.customUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' : '')}/>
        </View>

        <TextInput className={fieldClassName} value={draft.customUserAgent} onChangeText={(value) => updateDraft('customUserAgent', value)} placeholder="Mozilla/5.0 ..." textAlign={isRTL ? 'right' : 'left'} placeholderTextColor="#9ca3af"/>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.os}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {OS_OPTIONS.map((option) => (<Text key={option} onPress={() => updateDraft('spoofedOS', option)} style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: draft.spoofedOS === option ? '#6366f1' : '#d4d4d8',
                backgroundColor: draft.spoofedOS === option ? '#e0e7ff' : '#fff',
                color: '#111827',
            }}>
              {t[option.toLowerCase()]}
            </Text>))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.proxy}</Text>
          <Switch value={draft.isProxyEnabled} onValueChange={(value) => updateDraft('isProxyEnabled', value)}/>
        </View>

        {draft.isProxyEnabled ? (<View style={{ gap: 12 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.proxyHost}</Text>
              <TextInput className={fieldClassName} value={draft.proxyHost} onChangeText={(value) => updateDraft('proxyHost', value)} placeholder="127.0.0.1" textAlign={isRTL ? 'right' : 'left'}/>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.proxyPort}</Text>
              <TextInput className={fieldClassName} value={String(draft.proxyPort)} keyboardType="numeric" onChangeText={(value) => updateDraft('proxyPort', Number(value) || 8080)} textAlign={isRTL ? 'right' : 'left'}/>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.proxyType}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {PROXY_TYPES.map((option) => (<Text key={option} onPress={() => updateDraft('proxyType', option)} style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: draft.proxyType === option ? '#6366f1' : '#d4d4d8',
                    backgroundColor: draft.proxyType === option ? '#e0e7ff' : '#fff',
                    color: '#111827',
                }}>
                    {t[option]}
                  </Text>))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.username}</Text>
              <TextInput className={fieldClassName} value={draft.proxyUsername} onChangeText={(value) => updateDraft('proxyUsername', value)} textAlign={isRTL ? 'right' : 'left'}/>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>{t.password}</Text>
              <TextInput className={fieldClassName} value={draft.proxyPassword} onChangeText={(value) => updateDraft('proxyPassword', value)} secureTextEntry textAlign={isRTL ? 'right' : 'left'}/>
            </View>
          </View>) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>{t.syncTimezone}</Text>
        <Switch value={draft.syncTimezone} onValueChange={(value) => updateDraft('syncTimezone', value)}/>
      </View>

      <Text onPress={saveProfile} style={{
            marginTop: 8,
            paddingVertical: 12,
            textAlign: 'center',
            backgroundColor: '#111827',
            color: '#fff',
            borderRadius: 12,
            fontWeight: '700',
        }}>
        Save
      </Text>
    </ScrollView>);
};
