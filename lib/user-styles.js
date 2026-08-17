import { nanoid } from 'nanoid';
export const USER_STYLES_SCHEMA_VERSION = 1;
export const builtinUserStyleIds = [
    'hide-facebook-feed',
    'hide-reddit-game',
    'hide-x-bottom-nav',
    'hide-x-home-tabs',
];
export const builtinUserScriptIds = ['enter-as-shift-enter'];
const css = (raw, ...values) => String.raw({ raw }, ...values);
export const builtinUserStyleDefinitions = [
    {
        id: 'hide-facebook-feed',
        labelKey: 'settings.userStyles.builtin.hideFacebookFeed.label',
        hostGlobs: ['m.facebook.com', 'www.facebook.com'],
        css: css `
      /* News feed */
      :root._nora_hide_facebook_feed_ [role='main'] [role='feed'],
      :root._nora_hide_facebook_feed_ [data-pagelet='MainFeed'],
      :root._nora_hide_facebook_feed_ [data-testid='newsFeedStream'],
      :root._nora_hide_facebook_feed_ #m_newsfeed_stream,
      :root._nora_hide_facebook_feed_ [data-dcm-id][data-tracking-duration-id],
      :root._nora_hide_facebook_feed_
        [data-type='vscroller']
        > [data-dcm-id][data-tracking-duration-id]
        ~ * {
        display: none !important;
      }

      /* Fallback for Facebook's current hash classes, scoped to main content. */
      :root._nora_hide_facebook_feed_ [role='main'] div.x1hc1fzr.x1unhpq9.x6o7n8i {
        display: none !important;
      }
    `,
    },
    {
        id: 'hide-reddit-game',
        labelKey: 'settings.userStyles.builtin.hideRedditGame.label',
        hostGlobs: ['www.reddit.com'],
        css: css `
      /* GAME */
      article:has([slot='ssr-post-content-header']) {
        display: none !important;
      }
    `,
    },
    {
        id: 'hide-x-bottom-nav',
        labelKey: 'settings.userStyles.builtin.hideXBottomNav.label',
        hostGlobs: ['x.com'],
        css: css `
      /* Bottom nav bar */
      [style*='opacity: 0.3'] {
        display: none !important;
      }
    `,
    },
    {
        id: 'hide-x-home-tabs',
        labelKey: 'settings.userStyles.builtin.hideXHomeTabs.label',
        hostGlobs: ['x.com'],
        css: css `
      /* Home timeline tabs wrapper */
      [role='tablist']:has(
        [role='tab'][aria-label*='For you'],
        [role='tab'][data-testid*='For you'],
        [role='tab'][aria-label*='Following'],
        [role='tab'][data-testid*='Following']
      ),
      [role='tablist']:has(
        [role='tab'][aria-label*='for you'],
        [role='tab'][data-testid*='for you'],
        [role='tab'][aria-label*='following'],
        [role='tab'][data-testid*='following']
      ) {
        display: none !important;
      }

      [role='tablist']:has(
          [role='tab'][aria-label*='For you'],
          [role='tab'][data-testid*='For you'],
          [role='tab'][aria-label*='Following'],
          [role='tab'][data-testid*='Following']
        )
        > *,
      [role='tablist']:has(
          [role='tab'][aria-label*='for you'],
          [role='tab'][data-testid*='for you'],
          [role='tab'][aria-label*='following'],
          [role='tab'][data-testid*='following']
        )
        > * {
        display: none !important;
      }
    `,
    },
];
export const builtinUserStyleDefinitionById = builtinUserStyleDefinitions.reduce((acc, definition) => {
    acc[definition.id] = definition;
    return acc;
}, {});
export const createDefaultBuiltinUserStyles = () => ({
    'hide-facebook-feed': { enabled: false },
    'hide-reddit-game': { enabled: false },
    'hide-x-bottom-nav': { enabled: true },
    'hide-x-home-tabs': { enabled: false },
});
export const builtinUserScriptDefinitions = [
    {
        id: 'enter-as-shift-enter',
        labelKey: 'settings.enterInsertsNewline',
        hostGlobs: ['*'],
        js: `
      const isEditable = (el) => {
        if (!el) return false
        const tag = el.tagName
        if (tag === 'TEXTAREA') return true
        if (tag === 'INPUT') {
          const type = (el.getAttribute('type') || 'text').toLowerCase()
          return ['text', 'search', 'url', 'email', 'tel', 'password', ''].includes(type)
        }
        return el.isContentEditable === true
      }

      const insertNewline = (el) => {
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const start = el.selectionStart
          const end = el.selectionEnd
          if (typeof start === 'number' && typeof end === 'number') {
            const value = el.value
            el.value = value.slice(0, start) + '\\n' + value.slice(end)
            el.selectionStart = el.selectionEnd = start + 1
          } else {
            el.value += '\\n'
          }
          el.dispatchEvent(new Event('input', { bubbles: true }))
          return
        }
        try {
          if (!document.execCommand('insertLineBreak')) {
            document.execCommand('insertText', false, '\\n')
          }
        } catch (e) {
          document.execCommand('insertText', false, '\\n')
        }
      }

      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key !== 'Enter') return
          if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
          const target = e.target
          if (!isEditable(target)) return

          e.preventDefault()
          e.stopImmediatePropagation()

          const synthetic = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          })
          const notCancelled = target.dispatchEvent(synthetic)
          if (notCancelled) {
            insertNewline(target)
          }
        },
        true,
      )
    `,
    },
];
export const builtinUserScriptDefinitionById = builtinUserScriptDefinitions.reduce((acc, definition) => {
    acc[definition.id] = definition;
    return acc;
}, {});
export const createDefaultBuiltinUserScripts = () => ({
    'enter-as-shift-enter': { enabled: false },
});
export const createDefaultUserStylesSnapshot = () => ({
    schemaVersion: USER_STYLES_SCHEMA_VERSION,
    builtins: createDefaultBuiltinUserStyles(),
    builtinScripts: createDefaultBuiltinUserScripts(),
    customStyles: [],
    customScripts: [],
});
export const normalizeHostGlob = (value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized.includes('://') || normalized.includes('/') || /\s/.test(normalized)) {
        return '';
    }
    if (!/^[a-z0-9.*-]+$/.test(normalized)) {
        return '';
    }
    return normalized;
};
export const sanitizeHostGlobs = (values) => {
    const seen = new Set();
    const result = [];
    for (const value of values || []) {
        const normalized = normalizeHostGlob(value);
        if (!normalized || seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        result.push(normalized);
    }
    return result;
};
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const matchesHostGlob = (host, glob) => {
    const normalizedHost = host.trim().toLowerCase();
    const normalizedGlob = normalizeHostGlob(glob);
    if (!normalizedHost || !normalizedGlob) {
        return false;
    }
    const pattern = `^${escapeRegExp(normalizedGlob).replace(/\\\*/g, '.*')}$`;
    return new RegExp(pattern, 'i').test(normalizedHost);
};
export const matchesAnyHostGlob = (host, hostGlobs) => {
    return hostGlobs.some((glob) => matchesHostGlob(host, glob));
};
export const getEnabledUserStyleCss = (host, snapshot) => {
    const normalizedHost = host.trim().toLowerCase();
    const userStyles = snapshot || createDefaultUserStylesSnapshot();
    const builtinCss = builtinUserStyleDefinitions
        .filter((definition) => userStyles.builtins[definition.id]?.enabled !== false)
        .filter((definition) => matchesAnyHostGlob(normalizedHost, definition.hostGlobs))
        .map((definition) => definition.css.trim())
        .filter(Boolean);
    const customCss = (userStyles.customStyles || [])
        .filter((style) => style.enabled)
        .filter((style) => style.css.trim())
        .filter((style) => matchesAnyHostGlob(normalizedHost, style.hostGlobs))
        .map((style) => style.css.trim())
        .filter(Boolean);
    return [...builtinCss, ...customCss].join('\n\n');
};
export const getEnabledUserScripts = (host, snapshot) => {
    const normalizedHost = host.trim().toLowerCase();
    const userStyles = snapshot || createDefaultUserStylesSnapshot();
    const builtinScripts = builtinUserScriptDefinitions
        .filter((definition) => userStyles.builtinScripts?.[definition.id]?.enabled)
        .filter((definition) => definition.js.trim())
        .filter((definition) => matchesAnyHostGlob(normalizedHost, definition.hostGlobs))
        .map((definition) => ({
        id: definition.id,
        name: definition.labelKey,
        hostGlobs: definition.hostGlobs,
        pinToHeader: false,
        js: definition.js.trim(),
    }));
    const customScripts = (userStyles.customScripts || [])
        .filter((script) => script.enabled)
        .filter((script) => script.js.trim())
        .filter((script) => matchesAnyHostGlob(normalizedHost, script.hostGlobs))
        .map((script) => ({
        ...script,
        js: script.js.trim(),
    }));
    return [...builtinScripts, ...customScripts];
};
export const buildUserScriptExecutionSource = (script) => {
    return `(() => { try {\n${script.js}\n} catch (error) { console.error(${JSON.stringify('[Nora user script run] ' + script.name)}, error); throw error } })();`;
};
const genId = (size = 6) => nanoid(size);
const normalizeCustomUserStyle = (style, index) => {
    if (!style) {
        return null;
    }
    const hostGlobs = sanitizeHostGlobs(style.hostGlobs);
    const css = typeof style.css === 'string' ? style.css.replace(/\s+$/, '') : '';
    if (!hostGlobs.length || !css.trim()) {
        return null;
    }
    const name = typeof style.name === 'string' && style.name.trim() ? style.name.trim() : `Style ${index + 1}`;
    return {
        id: typeof style.id === 'string' && style.id ? style.id : genId(),
        name,
        enabled: typeof style.enabled === 'boolean' ? style.enabled : true,
        hostGlobs,
        css,
    };
};
const normalizeCustomUserScript = (script, index) => {
    if (!script) {
        return null;
    }
    const hostGlobs = sanitizeHostGlobs(script.hostGlobs);
    const js = typeof script.js === 'string' ? script.js.replace(/\s+$/, '') : '';
    if (!hostGlobs.length || !js.trim()) {
        return null;
    }
    const name = typeof script.name === 'string' && script.name.trim() ? script.name.trim() : `Script ${index + 1}`;
    return {
        id: typeof script.id === 'string' && script.id ? script.id : genId(),
        name,
        enabled: typeof script.enabled === 'boolean' ? script.enabled : true,
        hostGlobs,
        pinToHeader: typeof script.pinToHeader === 'boolean' ? script.pinToHeader : false,
        js,
    };
};
const metadataBlockPattern = /\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/;
const parseMetadataLine = (line) => {
    const match = line.match(/^\s*\/\/\s*@(\S+)\s+(.+?)\s*$/);
    if (!match) {
        return null;
    }
    return {
        key: match[1],
        value: match[2],
    };
};
const hostGlobFromUrlPattern = (pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed || trimmed === '*') {
        return '';
    }
    const withProtocol = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    try {
        const url = new URL(withProtocol.replace(/\\\*/g, '*'));
        return normalizeHostGlob(url.hostname);
    }
    catch {
        const host = trimmed
            .replace(/^[a-z*]+:\/\//i, '')
            .split('/')[0]
            .split(':')[0];
        return normalizeHostGlob(host);
    }
};
export const parseUserscriptMetadata = (source) => {
    const block = source.match(metadataBlockPattern)?.[1];
    if (!block) {
        return {
            name: '',
            hostGlobs: [],
        };
    }
    const hostPatterns = [];
    let name = '';
    for (const line of block.split('\n')) {
        const parsed = parseMetadataLine(line);
        if (!parsed) {
            continue;
        }
        if (parsed.key === 'name' && !name) {
            name = parsed.value.trim();
        }
        if (parsed.key === 'match' || parsed.key === 'include') {
            hostPatterns.push(parsed.value);
        }
    }
    return {
        name,
        hostGlobs: sanitizeHostGlobs(hostPatterns.map(hostGlobFromUrlPattern)),
    };
};
export const stripUserscriptMetadata = (source) => {
    return source.replace(metadataBlockPattern, '').replace(/^\s+/, '').replace(/\s+$/, '');
};
export const normalizeUserStyles = (data) => {
    const defaults = createDefaultUserStylesSnapshot();
    const builtins = createDefaultBuiltinUserStyles();
    for (const id of builtinUserStyleIds) {
        builtins[id] = {
            enabled: typeof data?.builtins?.[id]?.enabled === 'boolean' ? data.builtins[id].enabled : defaults.builtins[id].enabled,
        };
    }
    const builtinScripts = createDefaultBuiltinUserScripts();
    for (const id of builtinUserScriptIds) {
        builtinScripts[id] = {
            enabled: typeof data?.builtinScripts?.[id]?.enabled === 'boolean'
                ? data.builtinScripts[id].enabled
                : defaults.builtinScripts[id].enabled,
        };
    }
    const customStyles = (data?.customStyles || [])
        .map((style, index) => normalizeCustomUserStyle(style, index))
        .filter((style) => style != null);
    const customScripts = (data?.customScripts || [])
        .map((script, index) => normalizeCustomUserScript(script, index))
        .filter((script) => script != null);
    return {
        schemaVersion: USER_STYLES_SCHEMA_VERSION,
        builtins,
        builtinScripts,
        customStyles,
        customScripts,
    };
};
export const createNormalizedCustomUserStyle = (style, index) => {
    return normalizeCustomUserStyle(style, index);
};
export const createNormalizedCustomUserScript = (script, index) => {
    return normalizeCustomUserScript(script, index);
};
