import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

type ChannelRowProps = { name: string; active: boolean; unread: boolean; onPress: () => void };

export default function ChannelRow({ name, active, unread, onPress }: ChannelRowProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <Pressable onPress={onPress} style={[styles.row, active && styles.rowActive]}>
            <Text style={styles.hash}>#</Text>
            <Text numberOfLines={1} style={[styles.name, active && styles.nameActive]}>{name}</Text>
            {unread ? <View style={styles.unreadMark} /> : null}
        </Pressable>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    row: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderRadius: 8 },
    rowActive: { backgroundColor: colors.iconBg },
    hash: { color: colors.textSecondary, fontSize: 20, fontWeight: '400' },
    name: { flex: 1, color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
    nameActive: { color: colors.text, fontWeight: '700' },
    unreadMark: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
});
