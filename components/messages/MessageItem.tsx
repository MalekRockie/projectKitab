import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Message } from '../../services/messages/messageMapping';
import Avatar, { AVATAR_TINTS } from './Avatar';

function MessageItem({ message, onPressAvatar }: { message: Message; onPressAvatar?: (message: Message) => void }) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const initials = message.own ? 'ME' : message.author.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
    const avatar = <Avatar initials={initials} tint={message.own ? AVATAR_TINTS.own : AVATAR_TINTS.other} size={38} />;

    return (
        <View style={styles.row}>
            {onPressAvatar ? (
                <Pressable onPress={() => onPressAvatar(message)} accessibilityRole="button" accessibilityLabel={`View ${message.author}'s profile`}>{avatar}</Pressable>
            ) : avatar}
            <View style={styles.content}>
                <View style={styles.meta}>
                    <Text style={[styles.author, message.own && styles.ownAuthor]}>{message.author}</Text>
                    <Text style={styles.time}>{message.time}</Text>
                </View>
                <Text style={styles.text}>{message.body}</Text>
            </View>
        </View>
    );
}

export default memo(MessageItem);

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 21 },
    content: { flex: 1, paddingTop: 1 },
    meta: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
    author: { color: colors.text, fontSize: 13, fontWeight: '700' },
    ownAuthor: { color: colors.accent },
    time: { color: colors.textSecondary, fontSize: 10 },
    text: { color: colors.text, fontSize: 14, lineHeight: 21 },
});
