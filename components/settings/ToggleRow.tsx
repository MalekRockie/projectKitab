import React, { useMemo } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

interface Props {
    icon: string;
    iconColor?: string;
    iconBgColor?: string;
    label: string;
    meta?: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
}

const ToggleRow: React.FC<Props> = ({
    icon,
    iconColor,
    iconBgColor,
    label,
    meta,
    value,
    onValueChange,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Explicit props always win; otherwise fall back to theme-aware defaults.
    const resolvedIconColor = iconColor ?? colors.textSecondary;
    const resolvedIconBgColor = iconBgColor ?? colors.iconBg;

    return (
        <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: resolvedIconBgColor }]}>
                <Icon name={icon} size={18} color={resolvedIconColor} />
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </View>

            <Switch
                value={value}
                onValueChange={onValueChange}
                // trackColor.true and thumbColor are deliberately NOT theme
                // tokens: the thumb stays white and the "on" track stays
                // near-black in both light and dark mode, same as native iOS
                // switches. Only the "off" track needs to adapt to theme -
                // a light gray off-track would look out of place on a dark
                // screen, but the thumb only ever needs contrast against its
                // own track, not against the screen around it.
                trackColor={{ false: colors.switchTrackOff, true: '#6604f9' }}
                thumbColor="#fff"
                ios_backgroundColor={colors.switchTrackOff}
            />
        </View>
    );
};

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
    meta: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
});

export default ToggleRow;