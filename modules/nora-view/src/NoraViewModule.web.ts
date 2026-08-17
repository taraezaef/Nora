import { registerWebModule, NativeModule } from 'expo'
import { mainClient } from '@/desktop/src/renderer/ipc/main'

class NoraViewModule extends NativeModule {
  async translateText() {
    throw new Error('Translation is available on mobile only')
  }

  async getTranslationSupportedLanguages() {
    return []
  }
  async clearProfileData(profile: string) {
    if (!window.electron?.ipcRenderer) {
      return
    }

    await mainClient.clearProfileData(profile)
  }

  async clearHostData(profile: string, host: string) {
    if (!window.electron?.ipcRenderer) {
      return
    }

    await mainClient.clearHostData(profile, host)
  }

  async importCookies(profile: string, payload: string | Record<string, unknown> | Record<string, unknown>[]) {
    if (!window.electron?.ipcRenderer) {
      return 0
    }

    return 0
  }
}

export default registerWebModule(NoraViewModule, 'NoraViewModule')
