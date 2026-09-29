import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

interface Props {
    icon: string;
    iconColor?: string;
    iconBgColor?: string;
    label: string;
    meta?: string;
    badge?: number | string;
    onPress?: () => void;
    isDanger?: boolean;
}

const SettingRow: React.FC<Props> = ({
    icon,
    iconColor,
    iconBgColor,
    label,
    meta,
    badge,
    onPress,
    isDanger = false,
    }) => {
        const colors = useTheme();
        const styles = useMemo(() => createStyles(colors), [colors]);

        // Explicit props always win; otherwise fall back to theme-aware defaults.
        // These can't be default parameter values above since `colors` only
        // exists once we're inside the component body, after useTheme() runs.
        const resolvedIconColor = iconColor ?? colors.textSecondary;
        const resolvedIconBgColor = iconBgColor ?? colors.iconBg;

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={0.6}
        >
            <View style={[styles.iconBox, { backgroundColor: resolvedIconBgColor }]}>
                <Icon name={icon} size={18} color={resolvedIconColor} />
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.label, isDanger && styles.dangerLabel]}>
                    {label}
                </Text>
                {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </View>

            <View style={styles.rightContent}>
                {badge ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                ) : null}
                <Icon
                    name="chevron-forward"
                    size={18}
                    color={colors.chevron}
                    style={styles.chevron}
                />
            </View>
        </TouchableOpacity>
    )};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 22,
    },
    dangerLabel: {
        color: colors.danger,
    },
    meta: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: colors.dangerBadgeBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginRight: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.danger,
    },
    chevron: {
        marginLeft: 4,
    },
});

export default SettingRow;