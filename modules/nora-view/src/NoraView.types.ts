import { StyleProp } from 'react-native'

export type OnLoadEventPayload = {
  canGoBack?: boolean
  url?: string
  title?: string
  icon?: string
}

export type OnMessageEventPayload = {
  payload: string
}

export type NoraViewProxyConfig = {
  enabled?: boolean
  host?: string
  port?: number
  type?: 'http' | 'socks' | 'socks4' | 'socks5'
}

export type NoraViewProps = {
  className?: string
  style?: StyleProp<any>
  ref: React.Ref<any>
  useragent: string
  partition?: string
  profile?: string
  proxy?: NoraViewProxyConfig
  inspectable?: boolean
  allowpopups?: string
  src?: string
  scriptOnStart?: string
  /** Injected before page scripts run (WebRTC guard). Native platforms only. */
  scriptOnDocumentStart?: string
  textZoom?: number
  onLoad?: (event: { nativeEvent: OnLoadEventPayload }) => void
  onMessage?: (event: { nativeEvent: OnMessageEventPayload }) => void
}
