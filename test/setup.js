import { mock } from 'bun:test';
// Font assets reach the graph through icon packages; bun has no loader for them.
Bun.plugin({
    name: 'asset-stub',
    setup(build) {
        build.onLoad({ filter: /\.(ttf|otf|png|jpg|jpeg|gif|svg|webp)$/ }, () => ({
            contents: 'export default 1',
            loader: 'js',
        }));
    },
});
globalThis.__DEV__ = false;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// expo-modules-core reads its native runtime off this global at import time.
class ExpoEventEmitterStub {
    addListener() {
        return { remove: () => { } };
    }
    removeAllListeners() { }
    removeListener() { }
    emit() { }
}
;
globalThis.expo = {
    EventEmitter: ExpoEventEmitterStub,
    NativeModule: class extends ExpoEventEmitterStub {
    },
    SharedObject: class extends ExpoEventEmitterStub {
    },
    SharedRef: class extends ExpoEventEmitterStub {
    },
    // Any expo module resolves to an inert stub, so requireNativeModule() succeeds for
    // whichever ones the component graph happens to pull in.
    modules: new Proxy({}, {
        get: (target, name) => {
            if (!target[name]) {
                target[name] = new Proxy(new ExpoEventEmitterStub(), {
                    // A plain function, not an arrow: some modules are consumed as base classes.
                    get: (moduleTarget, key) => key in moduleTarget ? moduleTarget[key] : function stub() { },
                });
            }
            return target[name];
        },
        has: () => true,
    }),
    uuidv4: () => '00000000-0000-4000-8000-000000000000',
    uuidv5: () => '00000000-0000-5000-8000-000000000000',
    getViewConfig: () => null,
    reloadAppAsync: async () => { },
};
// Native modules can't be loaded by bun (react-native's entrypoint uses Flow
// syntax), so state modules that persist via MMKV need these stubs.
mock.module('react-native-get-random-values', () => ({}));
// Components render through react-test-renderer, where a host component is just a string
// tag, so the primitives only need names the tree can be queried by.
const host = (name) => name;
mock.module('react-native', () => ({
    Platform: {
        OS: 'android',
        select: (obj) => obj?.android ?? obj?.native ?? obj?.default,
    },
    Alert: { alert: () => { } },
    View: host('View'),
    Text: host('Text'),
    Pressable: host('Pressable'),
    ScrollView: host('ScrollView'),
    ActivityIndicator: host('ActivityIndicator'),
    StyleSheet: {
        create: (styles) => styles,
        flatten: (style) => style,
        absoluteFill: {},
        absoluteFillObject: {},
        hairlineWidth: 1,
    },
    Appearance: {
        getColorScheme: () => 'dark',
        addChangeListener: () => ({ remove: () => { } }),
    },
    useColorScheme: () => 'dark',
    Dimensions: {
        get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
        addEventListener: () => ({ remove: () => { } }),
    },
    NativeModules: {},
    processColor: (color) => color,
    AppRegistry: { registerComponent: () => { }, runApplication: () => { } },
    LogBox: { ignoreLogs: () => { }, ignoreAllLogs: () => { } },
    Share: { share: async () => ({ action: 'sharedAction' }) },
    Clipboard: { setString: () => { }, getString: async () => '' },
    Vibration: { vibrate: () => { } },
    ToastAndroid: { show: () => { }, SHORT: 0, LONG: 1 },
    Image: host('Image'),
    TextInput: host('TextInput'),
    TouchableOpacity: host('TouchableOpacity'),
    TouchableHighlight: host('TouchableHighlight'),
    TouchableWithoutFeedback: host('TouchableWithoutFeedback'),
    Modal: host('Modal'),
    StatusBar: host('StatusBar'),
    SafeAreaView: host('SafeAreaView'),
    FlatList: host('FlatList'),
    RefreshControl: host('RefreshControl'),
    Switch: host('Switch'),
    KeyboardAvoidingView: host('KeyboardAvoidingView'),
    Animated: {
        View: host('Animated.View'),
        Text: host('Animated.Text'),
        createAnimatedComponent: (component) => component,
        Value: class {
            setValue() { }
            interpolate() {
                return this;
            }
            addListener() {
                return '';
            }
            removeAllListeners() { }
        },
        timing: () => ({ start: (cb) => cb?.(), stop: () => { } }),
        spring: () => ({ start: (cb) => cb?.(), stop: () => { } }),
        event: () => () => { },
    },
    Easing: { linear: (t) => t, inOut: (fn) => fn, ease: (t) => t },
    LayoutAnimation: { configureNext: () => { }, Presets: {} },
    PanResponder: { create: () => ({ panHandlers: {} }) },
    DeviceEventEmitter: { addListener: () => ({ remove: () => { } }), emit: () => { } },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
    unstable_batchedUpdates: (cb) => cb(),
    TurboModuleRegistry: { get: () => null, getEnforcing: () => ({}) },
    NativeEventEmitter: class {
        addListener() {
            return { remove: () => { } };
        }
        removeAllListeners() { }
    },
    requireNativeComponent: (name) => host(name),
    findNodeHandle: () => null,
    UIManager: { getViewManagerConfig: () => null },
    I18nManager: { isRTL: false, getConstants: () => ({ isRTL: false, doLeftAndRightSwapInRTL: true }) },
    InteractionManager: { runAfterInteractions: (cb) => (cb(), { cancel: () => { } }) },
    Linking: { openURL: async () => { }, canOpenURL: async () => true, addEventListener: () => ({ remove: () => { } }) },
    Keyboard: { dismiss: () => { }, addListener: () => ({ remove: () => { } }) },
    BackHandler: { addEventListener: () => ({ remove: () => { } }) },
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => { } }) },
    PixelRatio: { get: () => 3, getFontScale: () => 1, roundToNearestPixel: (n) => n },
}));
// One shared backing store across every MMKV instance, so a test can seed persisted
// state (see seedPersistedState) before importing the state module that hydrates from it.
const mmkvStore = new Map();
export const seedPersistedState = (key, value) => {
    mmkvStore.set(key, JSON.stringify(value));
};
export const clearPersistedState = () => {
    mmkvStore.clear();
};
class MMKVStub {
    map = mmkvStore;
    getString(key) {
        return this.map.get(key);
    }
    set(key, value) {
        this.map.set(key, value);
    }
    delete(key) {
        this.map.delete(key);
    }
    getAllKeys() {
        return [...this.map.keys()];
    }
    contains(key) {
        return this.map.has(key);
    }
}
mock.module('react-native-mmkv', () => ({ MMKV: MMKVStub }));
