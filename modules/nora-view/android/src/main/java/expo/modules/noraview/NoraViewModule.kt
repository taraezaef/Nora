package expo.modules.noraview

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.webkit.CookieManager
import android.webkit.WebStorage
import android.webkit.WebView
import android.widget.Toast
import androidx.webkit.ProfileStore
import androidx.webkit.ProxyConfig
import androidx.webkit.ProxyController
import androidx.webkit.WebViewFeature
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.FileWriter

private data class ImportedCookie(
  val domain: String,
  val path: String,
  val secure: Boolean,
  val httpOnly: Boolean,
  val expires: Long,
  val name: String,
  val value: String,
)

private fun parseImportedCookies(payload: String): List<ImportedCookie> {
  val trimmed = payload.trim()
  if (trimmed.isEmpty()) {
    return emptyList()
  }

  return try {
    when {
      trimmed.startsWith("[") -> {
        val array = org.json.JSONArray(trimmed)
        buildList {
          for (idx in 0 until array.length()) {
            val item = array.getJSONObject(idx)
            val cookie = ImportedCookie(
              domain = item.optString("domain", "").trim(),
              path = item.optString("path", "/").trim().ifEmpty { "/" },
              secure = item.optBoolean("secure", false),
              httpOnly = item.optBoolean("httpOnly", false),
              expires = item.optLong("expires", 0L),
              name = item.optString("name", "").trim(),
              value = item.optString("value", ""),
            )
            if (cookie.domain.isNotEmpty() && cookie.name.isNotEmpty()) {
              add(cookie)
            }
          }
        }
      }
      trimmed.startsWith("{") -> {
        val item = org.json.JSONObject(trimmed)
        val cookie = ImportedCookie(
          domain = item.optString("domain", "").trim(),
          path = item.optString("path", "/").trim().ifEmpty { "/" },
          secure = item.optBoolean("secure", false),
          httpOnly = item.optBoolean("httpOnly", false),
          expires = item.optLong("expires", 0L),
          name = item.optString("name", "").trim(),
          value = item.optString("value", ""),
        )
        if (cookie.domain.isNotEmpty() && cookie.name.isNotEmpty()) listOf(cookie) else emptyList()
      }
      else -> {
        trimmed.lineSequence()
          .filter { it.isNotBlank() && !it.startsWith("#") }
          .mapNotNull { line ->
            val parts = line.split("\t")
            if (parts.size < 7) return@mapNotNull null
            val domain = parts[0].trim()
            val name = parts[5].trim()
            val value = parts.drop(6).joinToString("\t").trim()
            if (domain.isEmpty() || name.isEmpty()) return@mapNotNull null
            ImportedCookie(
              domain = domain.removePrefix("#HttpOnly_").trim(),
              path = parts[2].trim().ifEmpty { "/" },
              secure = parts[3].trim().equals("TRUE", ignoreCase = true),
              httpOnly = domain.startsWith("#HttpOnly_"),
              expires = parts[4].trim().toLongOrNull() ?: 0L,
              name = name,
              value = value,
            )
          }
          .toList()
      }
    }
  } catch (e: Exception) {
    emptyList()
  }
}

class NoraViewModule : Module() {
  fun log(msg: String) {
    sendEvent("log", mapOf("msg" to msg))
  }

  private var lastProxyKey: String? = null

  private fun applyProxy(settings: NoraSettings) {
    if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
      val proxyKey = "${settings.proxyEnabled}|${settings.proxyType}|${settings.proxyHost}|${settings.proxyPort}"
      if (proxyKey == lastProxyKey) {
        return
      }
      lastProxyKey = proxyKey
      val executor = java.util.concurrent.Executor { command -> command.run() }
      if (settings.proxyEnabled && settings.proxyHost.isNotEmpty()) {
        val type = if (settings.proxyType == "socks") "socks" else "http"
        val portStr = if (settings.proxyPort.isNotEmpty()) ":${settings.proxyPort}" else ""
        val proxyRule = "$type://${settings.proxyHost}$portStr"
        val proxyConfig = ProxyConfig.Builder()
          .addProxyRule(proxyRule)
          .build()
        try {
          ProxyController.getInstance().setProxyOverride(proxyConfig, executor, Runnable {
            log("proxy override applied: $proxyRule")
          })
        } catch (e: Exception) {
          log("setProxyOverride failed: ${e.message}")
        }
      } else {
        try {
          ProxyController.getInstance().clearProxyOverride(executor, Runnable {
            log("proxy override cleared")
          })
        } catch (e: Exception) {
          log("clearProxyOverride failed: ${e.message}")
        }
      }
    }
  }

  init {
    nouController.logFn = this::log
  }

  private var clipText = ""

  private val clipboardManager: ClipboardManager?
    get() = appContext.reactContext?.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager

  private val listener = ClipboardManager.OnPrimaryClipChangedListener {
    clipboardManager?.primaryClip?.let { clip ->
      if (clip.itemCount == 0) {
        return@let
      }
      val item = clip.getItemAt(0)
      val text = item.text?.toString() ?: return@let
      if (clipText == text) {
        return@let
      }
      val uri = Uri.parse(text)
      if (uri.host in VIEW_HOSTS) {
        val cleanUrl = removeTrackingParams(text)
        if (cleanUrl != text) {
          clipText = cleanUrl
          val clipData = ClipData.newPlainText("", clipText)
          clipboardManager?.setPrimaryClip(clipData)
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("NoraView")

    OnActivityResult { activity, payload ->
      nouController.onActivityResult(payload.requestCode, payload.resultCode, payload.data)
    }

    Events("log")

    OnStartObserving {
      clipboardManager?.addPrimaryClipChangedListener(listener)
    }

    OnStopObserving {
      clipboardManager?.removePrimaryClipChangedListener(listener)
    }

    Function("setSettings") { settings: NoraSettings ->
      nouController.settings = settings
      applyProxy(settings)
    }

    Function("setBlocklist") { blocklist: NoraBlocklist ->
      nouController.setBlocklist(blocklist)
    }

    Function("setLocaleStrings") { v: JavaScriptObject ->
      v.getPropertyNames().forEach {
        nouController.i18nStrings[it] = v[it]!!.getString()
      }
    }

    AsyncFunction("clearProfileData") { profile: String ->
      try {
        if (profile == "default") {
          val cookieManager = CookieManager.getInstance()
          cookieManager.removeAllCookies(null)
          cookieManager.flush()
          WebStorage.getInstance().deleteAllData()
          return@AsyncFunction
        }

        if (!WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
          return@AsyncFunction
        }

        val profileStore = ProfileStore.getInstance()
        val targetProfile = profileStore.getProfile(profile) ?: return@AsyncFunction
        targetProfile.cookieManager.removeAllCookies(null)
        targetProfile.cookieManager.flush()
        targetProfile.webStorage.deleteAllData()
        targetProfile.geolocationPermissions.clearAll()
        profileStore.deleteProfile(profile)
      } catch (e: Exception) {
        log("clearProfileData failed: ${e.message}")
      }
    }

    AsyncFunction("clearHostData") { profile: String, host: String ->
      try {
        if (host.isEmpty()) {
          return@AsyncFunction
        }

        val cookieManager: CookieManager
        val webStorage: WebStorage
        if (profile != "default" && WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
          val targetProfile = ProfileStore.getInstance().getProfile(profile) ?: return@AsyncFunction
          cookieManager = targetProfile.cookieManager
          webStorage = targetProfile.webStorage
        } else {
          cookieManager = CookieManager.getInstance()
          webStorage = WebStorage.getInstance()
        }

        for (scheme in listOf("https", "http")) {
          val origin = "$scheme://$host"
          webStorage.deleteOrigin(origin)

          // CookieManager has no per-host delete, so expire each cookie.
          val cookies = cookieManager.getCookie(origin) ?: continue
          for (pair in cookies.split(";")) {
            val name = pair.substringBefore("=").trim()
            if (name.isEmpty()) continue
            for (domain in listOf(host, ".$host")) {
              cookieManager.setCookie(origin, "$name=; Max-Age=0; path=/; domain=$domain")
            }
          }
        }
        cookieManager.flush()
      } catch (e: Exception) {
        log("clearHostData failed: ${e.message}")
      }
    }

    AsyncFunction("importCookies") { profile: String, payload: String ->
      try {
        val manager = if (profile != "default" && WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
          ProfileStore.getInstance().getProfile(profile)?.cookieManager ?: CookieManager.getInstance()
        } else {
          CookieManager.getInstance()
        }

        val cookies = parseImportedCookies(payload)
        if (cookies.isEmpty()) {
          return@AsyncFunction 0
        }

        var imported = 0
        for (cookie in cookies) {
          if (cookie.name.isEmpty() || cookie.domain.isEmpty()) {
            continue
          }

          val effectiveDomain = cookie.domain.trim().removePrefix(".")
          val secureUrl = "https://$effectiveDomain"
          val cookieValue = buildString {
            append("${cookie.name}=${cookie.value}")
            append("; path=${cookie.path.ifEmpty { "/" }}")
            if (effectiveDomain.isNotEmpty()) {
              append("; domain=${if (cookie.domain.startsWith(".")) cookie.domain else ".$effectiveDomain"}")
            }
            if (cookie.secure) {
              append("; Secure")
            }
            if (cookie.httpOnly) {
              append("; HttpOnly")
            }
            val maxAgeSeconds = if (cookie.expires > 0L) {
              (cookie.expires - (System.currentTimeMillis() / 1000L)).coerceAtLeast(0L)
            } else {
              0L
            }
            if (maxAgeSeconds > 0L) {
              append("; Max-Age=$maxAgeSeconds")
            }
          }

          manager.setCookie(secureUrl, cookieValue)
          if (!cookie.secure) {
            manager.setCookie("http://$effectiveDomain", cookieValue)
          }
          imported += 1
        }

        manager.flush()
        imported
      } catch (e: Exception) {
        log("importCookies failed: ${e.message}")
        0
      }
    }

    AsyncFunction("getCookies") Coroutine { url: String, profile: String? ->
      withContext(Dispatchers.Main) {
        try {
          val manager = if (profile != null && profile != "default" &&
            WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
            ProfileStore.getInstance().getProfile(profile)?.cookieManager
              ?: CookieManager.getInstance()
          } else {
            CookieManager.getInstance()
          }
          manager.getCookie(url) ?: ""
        } catch (e: Exception) {
          log("getCookies failed: ${e.message}")
          ""
        }
      }
    }

    AsyncFunction("getProfileCookies") Coroutine { profile: String ->
      val context = appContext.reactContext
      if (context == null) {
        emptyList<Map<String, Any>>()
      } else {
        NoraCookies.getProfileCookies(context, profile, this@NoraViewModule::log)
      }
    }

    AsyncFunction("openExternalUrl") { url: String ->
      handleExternalAppUrl(appContext.reactContext ?: appContext.throwingActivity, url)
    }

    AsyncFunction("translateText") Coroutine { text: String, targetLanguage: String ->
      NoraTranslation.translateText(text, targetLanguage)
    }

    AsyncFunction("getTranslationSupportedLanguages") {
      NoraTranslation.getSupportedLanguages()
    }

    View(NoraView::class) {
      Prop("scriptOnStart") { view: NoraView, script: String ->
        view.setScriptOnStart(script)
      }

      Prop("scriptOnDocumentStart") { view: NoraView, script: String ->
        view.setScriptOnDocumentStart(script)
      }

      Prop("useragent") { view: NoraView, ua: String ->
        view.userAgent = ua
        view.webView.settings.setUserAgentString(ua)
      }

      Prop("profile") { view: NoraView, profile: String ->
        view.setProfile(profile)
      }

      Prop("proxy") { view: NoraView, proxy: JavaScriptObject ->
        val enabled = proxy.getProperty("enabled")?.getBoolean() ?: false
        val host = proxy.getProperty("host")?.getString()
        val port = proxy.getProperty("port")?.getDouble()?.toInt() ?: 0
        val type = proxy.getProperty("type")?.getString()
        view.applyProxyOverride(enabled, host, port, type)
      }

      Prop("textZoom") { view: NoraView, zoom: Int ->
        view.setTextZoom(zoom)
      }

      Prop("inspectable") { _: NoraView, inspectable: Boolean ->
        WebView.setWebContentsDebuggingEnabled(inspectable)
      }

      Events("onLoad", "onMessage")

      AsyncFunction("download") { view: NoraView, url: String, fileName: String? ->
        view.download(url, fileName, null)
      }

      AsyncFunction("executeJavaScript") Coroutine
        { view: NoraView, script: String ->
          return@Coroutine view.webView.eval(script)
        }

      AsyncFunction("goBack") { view: NoraView ->
        val webView = view.webView
        if (webView.canGoBack()) {
          webView.goBack()
        } else {
          view.currentActivity?.finish()
        }
      }

      AsyncFunction("canGoBack") { view: NoraView ->
        view.webView.canGoBack()
      }

      AsyncFunction("goForward") { view: NoraView ->
        val webView = view.webView
        if (webView.canGoForward()) {
          webView.goForward()
        }
      }

      AsyncFunction("loadUrl") { view: NoraView, url: String -> view.load(url) }

      // Argument order must match the JS call site: saveFile(content, fileName, mimeType).
      AsyncFunction("saveFile") { view: NoraView, content: String, fileName: String, mimeType: String? ->
        view.saveFile(content, fileName, mimeType)
      }
    }
  }
}
