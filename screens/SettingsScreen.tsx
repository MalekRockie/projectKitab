import React, { useMemo } from 'react';
import {
    ScrollView,
    View,
    StyleSheet,
    Alert,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProfileHeader from '../components/settings/ProfileHeader';
import SectionHeader from '../components/settings/SectionHeader';
import SettingRow from '../components/settings/SettingRow';
import { useUserSettingsStore } from '../services/storage/store/useSettingsStore';
import { useTheme } from '../theme/useTheme';
import { ThemeColors, darkColors } from '../theme/colors';
import ScreenHeader from '../components/common/ScreenHeader';


const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const language = useUserSettingsStore((state) => state.language);
    const themePreference = useUserSettingsStore((state) => state.theme);

    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const isDark = colors === darkColors;
    
    const confirmDelete = () => {
        Alert.alert(
        'Delete account',
        'This action is permanent. Your account will be scheduled for deletion and removed after 30 days.',
        [
            { text: 'Cancel', style: 'cancel' },
            {
            text: 'Delete',
            style: 'destructive',
            onPress: () => console.log('Account deletion requested'),
            },
        ]
        );
    };

return (
    <View style={styles.container}>
        <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
        />
        <ScreenHeader title={"Settings"} />


        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
        {/* Profile Card */}
        <ProfileHeader
            handle="@your_handle"
            onPress={() => navigation.navigate('EditProfile' as never)}
        />

        {/* ─── Account ─── */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
            <SettingRow
                icon="settings-outline"
                label="Account settings"
                onPress={() => navigation.navigate('AccountSettings' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
                icon="shield-checkmark-outline"
                label="Privacy & security"
                onPress={() => navigation.navigate('PrivacySecurity' as never)}
                />
            <View style={styles.divider} />
            <SettingRow
                icon="notifications-outline"
                label="Notifications"
                meta="3 circles muted"
                onPress={() => navigation.navigate('Notifications' as never)}
            />
        </View>

        {/* ─── App Preferences ─── */}
        <SectionHeader title="App preferences" />
        <View style={styles.card}>
            <SettingRow
                icon="moon-outline"
                label="Theme"
                meta={themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}
                onPress={() => navigation.navigate('Theme' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
                icon="globe-outline"
                label="Languages"
                meta={language}
                onPress={() => navigation.navigate('Languages' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
                icon="chatbubble-outline"
                label="Direct messages"
                meta="Allow from anyone"
                onPress={() => navigation.navigate('DMSettings' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
                icon="options-outline"
                label="Content preferences"
                onPress={() => navigation.navigate('ContentPrefs' as never)}
            />
        </View>

        {/* ─── Circles ─── */}
        <SectionHeader title="Circles" />
        <View style={styles.card}>
            <SettingRow
                icon="people-outline"
                label="Manage circles"
                meta="12 joined"
                onPress={() => navigation.navigate('ManageCircles' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
                icon="ban-outline"
                label="Blocked & muted"
                onPress={() => navigation.navigate('BlockedMuted' as never)}
            />
        </View>

        {/* ─── Support ─── */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
            <SettingRow
                icon="warning-outline"
                label="Help center"
                onPress={() => navigation.navigate('HelpCenter' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
                icon="information-circle-outline"
                label="About"
                meta="v1.0.0"
                onPress={() => navigation.navigate('About' as never)}
            />
        </View>

        {/* ─── Danger Zone ─── */}
        <SectionHeader title="Danger zone" />
        <View style={styles.card}>
            <SettingRow
                icon="trash-outline"
                iconColor="#FF3B30"
                iconBgColor="rgba(255, 59, 48, 0.08)"
                label="Delete account"
                isDanger
                onPress={confirmDelete}
            />
        </View>

        {/* Bottom padding for safe area */}
        <View style={{ height: 32 }} />
        </ScrollView>
    </View>
    );
};



const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        marginTop: 0,
        backgroundColor: colors.surface,
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: 50,
        zIndex: 1,
    },
    headerText: {
        margin: 'auto',
        marginLeft: 10,
        fontSize: 18,
        fontWeight: '500'
    },
    backButton: {
        marginLeft: 10,
        marginTop: 10,
        borderRadius: 50
    },
    backButtonIcon:{

    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    card: {
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 10,
        overflow: 'hidden',
    },
    scrollContent: {
        // paddingTop: 8,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: 60,
    },
});

export default SettingsScreen;