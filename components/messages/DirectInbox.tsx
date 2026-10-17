import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Conversation } from '../../services/api/messages/conversations';
import { formatMessageTime, getConversationInitials, getConversationName } from '../../services/messages/messageMapping';
import Avatar, { AVATAR_TINTS } from './Avatar';

type DirectInboxProps = {
    conversations: Conversation[];
    currentUserId: string;
    activeConversationId: string | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    onOpen: (conversation: Conversation) => void;
    // Full-width rows for the mobile inbox, narrow rows for the wide sidebar.
    compact: boolean;
};

export default function DirectInbox({ conversations, currentUserId, activeConversationId, loading, error, onRefresh, onOpen, compact }: DirectInboxProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <>
            {conversations.map(item => {
                const name = getConversationName(item);
                const lastMessage = item.last_message;
                const preview = lastMessage
                    ? `${lastMessage.sender_id === currentUserId ? 'You: ' : ''}${lastMessage.content}`
                    : 'Start a conversation';
                const time = lastMessage ? formatMessageTime(lastMessage.created_at) : '';
                return (
                    <Pressable
                        key={item.id}
                        onPress={() => onOpen(item)}
                        style={compact ? styles.mobileRow : styles.row}
                        accessibilityRole="button"
                        accessibilityLabel={`Open chat with ${name}`}
                    >
                        <Avatar initials={getConversationInitials(item)} tint={AVATAR_TINTS.contact} size={compact ? 48 : 36} />
                        {compact ? (
                            <View style={styles.mobileCopy}>
                                <View style={styles.mobileMeta}>
                                    <Text numberOfLines={1} style={styles.mobileName}>{name}</Text>
                                    <Text style={styles.mobileTime}>{time}</Text>
                                </View>
                                <Text numberOfLines={1} style={styles.mobilePreview}>{preview}</Text>
                            </View>
                        ) : (
                            <View style={styles.copy}>
                                <Text numberOfLines={1} style={[styles.name, activeConversationId === item.id && styles.nameActive]}>{name}</Text>
                                <Text numberOfLines={1} style={styles.status}>{preview}</Text>
                            </View>
                        )}
                        {!compact && time ? <Text style={styles.time}>{time}</Text> : null}
                    </Pressable>
                );
            })}
            {loading ? <ActivityIndicator style={styles.state} color={colors.accent} /> : null}
            {!loading && error ? (
                <View style={styles.state}>
                    <Text style={styles.stateText}>{error}</Text>
                    <Pressable onPress={onRefresh} accessibilityRole="button">
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                </View>
            ) : null}
            {!loading && !error && conversations.length === 0 ? <Text style={[styles.state, styles.stateText]}>No conversations yet.</Text> : null}
        </>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 7, borderRadius: 9 },
    copy: { flex: 1 },
    name: { color: colors.text, fontSize: 13, fontWeight: '600' },
    nameActive: { fontWeight: '700' },
    status: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
    time: { color: colors.textSecondary, fontSize: 10, alignSelf: 'flex-start', marginTop: 4 },
    mobileRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    mobileCopy: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 5 },
    mobileMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    mobileName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
    mobileTime: { color: colors.textSecondary, fontSize: 11 },
    mobilePreview: { color: colors.textSecondary, fontSize: 13 },
    state: { minHeight: 96, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
    stateText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    retryText: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 10 },
});
