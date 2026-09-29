import { useColorScheme } from 'react-native';
import { useUserSettingsStore } from '../services/storage/store/useSettingsStore';
import { lightColors, darkColors } from './colors';

export function useTheme() {
    const themePref = useUserSettingsStore((s) => s.theme); // "light" | "dark" | "system"
    const systemScheme = useColorScheme();
    const resolved = themePref === 'system' ? (systemScheme ?? 'light') : themePref;
    return resolved === 'dark' ? darkColors : lightColors;
}