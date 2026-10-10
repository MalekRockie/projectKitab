import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/common/ScreenHeader';
import { useUserSettingsStore } from '../services/storage/store/useSettingsStore';
import type { ThemePreference } from '../services/storage/store/useSettingsStore';
import { patchUserSettings } from '../services/api/user/settings';
import { useTheme } from '../theme/useTheme';
import { ThemeColors } from '../theme/colors';

const THEME_OPTIONS = [
    { value: 'system', label: 'System', description: 'Follow your device appearance', icon: 'phone-portrait-outline' },
    { value: 'light', label: 'Light', description: 'Always use the light appearance', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', description: 'Always use the dark appearance', icon: 'moon-outline' },
] as const;

const ThemeSettingsScreen: React.FC = () => {
    const themePreference = useUserSettingsStore((state) => state.theme);
    const updateSettings = useUserSettingsStore((state) => state.updateSettings);
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const selectTheme = async (theme: ThemePreference) => {
        if (theme === themePreference) {
            return;
        }

        updateSettings({ theme });
        try {
            await patchUserSettings({ theme });
        } catch {
            Alert.alert('Theme saved on this device', 'Could not sync your theme preference to your account.');
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Theme" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>APPEARANCE</Text>
                <View style={styles.options}>
                    {THEME_OPTIONS.map((option, index) => {
                        const isSelected = themePreference === option.value;
                        return (
                            <React.Fragment key={option.value}>
                                {index > 0 ? <View style={styles.divider} /> : null}
                                <Pressable
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: isSelected }}
                                    onPress={() => selectTheme(option.value)}
                                    style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                                >
                                    <View style={styles.iconBox}>
                                        <Icon name={option.icon} size={19} color={colors.textSecondary} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.label}>{option.label}</Text>
                                        <Text style={styles.description}>{option.description}</Text>
                                    </View>
                                    <Icon
                                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                        size={22}
                                        color={isSelected ? colors.text : colors.chevron}
                                    />
                                </Pressable>
                            </React.Fragment>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingBottom: 32,
    },
    sectionTitle: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
    },
    options: {
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    option: {
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    pressed: {
        opacity: 0.65,
    },
    iconBox: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionText: {
        flex: 1,
        paddingRight: 12,
    },
    label: {
        color: colors.text,
        fontSize: 16,
    },
    description: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: 60,
    },
});

export default ThemeSettingsScreen;