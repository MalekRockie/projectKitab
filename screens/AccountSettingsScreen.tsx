import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';

import SectionHeader from '../components/settings/SectionHeader';
import SettingRow from '../components/settings/SettingRow';
import ActionButton from '../components/Buttons/ActionButton';
import { Datefield } from '../components/DateField';
import { useCUserStore } from '../services/storage/store/cUserStore';
import { useUserSettingsStore } from '../services/storage/store/useSettingsStore';
import { getAccount } from '../services/api/user/currentUser';
import { useTheme } from '../theme/useTheme';
import { ThemeColors, darkColors } from '../theme/colors';
import ScreenHeader from '../components/common/ScreenHeader';

/* ─── local reusable input ─── */
interface FormFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    prefix?: string;
    multiline?: boolean;
    maxLength?: number;
    keyboardType?: 'default' | 'email-address';
    autoCapitalize?: 'none' | 'sentences';
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    value,
    onChangeText,
    prefix,
    multiline = false,
    maxLength,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
}) => {
    const colors = useTheme();
    const fieldStyles = useMemo(() => createFieldStyles(colors), [colors]);

    return (
        <View style={fieldStyles.wrapper}>
            <Text style={fieldStyles.label}>{label}</Text>
            <View style={fieldStyles.inputRow}>
                {prefix && <Text style={fieldStyles.prefix}>{prefix}</Text>}
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    placeholderTextColor={colors.textSecondary}
                    style={[fieldStyles.input, multiline && fieldStyles.inputMultiline]}
                />
            </View>
        </View>
    );
};

const createFieldStyles = (colors: ThemeColors) => StyleSheet.create({
    wrapper: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        paddingBottom: 8,
    },
    prefix: {
        fontSize: 16,
        color: colors.textSecondary,
        marginRight: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        padding: 0,
    },
    inputMultiline: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
});

/* ─── screen ─── */
const AccountSettingsScreen: React.FC = () => {

    const navigation = useNavigation();
    const updateProfile  = useCUserStore(state => state.updateProfile);
    const updateSettings = useUserSettingsStore(state => state.updateSettings);

    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const isDark = colors === darkColors;

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [birthday, setBirthday] = useState<Date | null>(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                setLoading(true);
                const accountDetails = await getAccount();
                
                if (accountDetails) {
                    setDisplayName(accountDetails.display_name || '');
                    setUsername(accountDetails.username || '');
                    setBio(accountDetails.bio || '');
                    if (accountDetails?.date_of_birth) {
                        setBirthday(new Date(accountDetails.date_of_birth));
                    }
                    setEmail(accountDetails.email || '');
                }
            } catch (error) {
                console.error('Error fetching account:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, []); 
    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />
            <ScreenHeader title={"Account Settings"}/>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Avatar ── */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            <Icon name="person" size={36} color={colors.textSecondary} />
                        </View>
                        <TouchableOpacity
                            style={styles.cameraBadge}
                            activeOpacity={0.8}
                            onPress={() => console.log('Change avatar')}
                        >
                            <Icon name="camera" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.6}>
                        <Text style={styles.changePhotoText}>Change profile photo</Text>
                    </TouchableOpacity>
                </View>

            {/* ── Profile ── */}
            <SectionHeader title="Profile" />
            <View style={styles.card}>
                <FormField
                    label="Display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                />
                <View style={styles.divider} />
                <FormField
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    prefix="@"
                    autoCapitalize="none"
                />
                <View style={styles.divider} />
                <FormField
                    label="Bio"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={160}
                />
            </View>

            {/* ── Contact ── */}
            <SectionHeader title="Contact" />
            <View style={styles.card}>
                <SettingRow
                    icon="mail-outline"
                    label="Email"
                    meta={`${email} • Verified`}
                    onPress={() => console.log("change email")}
                />
                <View style={styles.divider} />
                <SettingRow
                    icon="call-outline"
                    label="Phone number"
                    meta="Not set"
                    onPress={() => console.log("phone number")}
                    // onPress={() => navigation.navigate('ChangePhone' as never)}
                />
            </View>

            {/* ── Personal info ── */}
            <SectionHeader title="Personal info" />
            <View style={styles.card}>
                <View style={styles.dateWrapper}>
                    <Datefield
                        date={birthday}
                        label="Birthday"
                        error={null}
                        onChange={setBirthday}
                    />
                </View>
            </View>

            {/* ── Security ── */}
            <SectionHeader title="Security" />
            <View style={styles.card}>
                <SettingRow
                    icon="lock-closed-outline"
                    label="Change password"
                    onPress={() => console.log("password")}
                    // onPress={() => navigation.navigate('ChangePassword' as never)}
                />
                <View style={styles.divider} />
                <SettingRow
                    icon="shield-checkmark-outline"
                    label="Two-factor authentication"
                    meta="Off"
                    onPress={() => console.log("2fa")}
                    // onPress={() => navigation.navigate('TwoFactor' as never)}
                />
            </View>

            {/* ── Save CTA ── */}
            <View style={styles.buttonContainer}>
                <ActionButton
                    title="Save changes"
                    size="lg"
                    width={350}
                    onPress={() => console.log('Saved')}
                />
            </View>

            <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingTop: 16,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarWrap: {
        position: 'relative',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.switchTrackOff,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0037ff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    changePhotoText: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: '500',
        color: '#0037ff',
    },
    card: {
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 10,
        overflow: 'hidden',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: 16,
    },
    dateWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    buttonContainer: {
        marginHorizontal: 16,
        marginTop: 24,
    },
});

export default AccountSettingsScreen;