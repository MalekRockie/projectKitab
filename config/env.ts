import { NativeModules, Platform } from 'react-native';

const API_PORT = 8080;
const WS_PORT = 8082;
const WS_PATH = '/ws';

// TODO: change these in before shipping a release build, example: 'https://api.example.com' and 'wss://api.example.com/ws'.
const PRODUCTION = { api: '', ws: '' };

// Metro's host is the dev machine, which also works from a physical device on the same network.
function getDevHost() {
    const fallback = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    const scriptUrl: string | undefined = NativeModules.SourceCode?.scriptURL;
    return scriptUrl?.match(/^https?:\/\/([^/:]+)/)?.[1] ?? fallback;
}

function resolveUrl(production: string, dev: () => string) {
    if (__DEV__) return dev();
    if (!production) throw new Error('Production URLs are not configured in config/env.ts');
    return production;
}

export const API_BASE_URL = resolveUrl(PRODUCTION.api, () => `http://${getDevHost()}:${API_PORT}`);
export const WS_URL = resolveUrl(PRODUCTION.ws, () => `ws://${getDevHost()}:${WS_PORT}${WS_PATH}`);
