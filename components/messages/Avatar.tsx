import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const AVATAR_TINTS = { contact: '#557B75', own: '#456E8B', other: '#8B6A55' };

type AvatarProps = { initials: string; tint: string; size?: number };

export default function Avatar({ initials, tint, size = 40 }: AvatarProps) {
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
            <Text style={[styles.initials, { fontSize: size < 38 ? 11 : 13 }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    avatar: { alignItems: 'center', justifyContent: 'center' },
    initials: { color: '#FFFFFF', fontWeight: '700' },
});
