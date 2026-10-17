import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Message } from '../../services/messages/messageMapping';
import Avatar, { AVATAR_TINTS } from './Avatar';
import Composer, { ComposerProps } from './Composer';
import MessageItem from './MessageItem';

// In the inverted list index 0 is the newest message: keep older rows still, but follow new ones when within 100px of the bottom.
const MESSAGE_LIST_ANCHORING = { minIndexForVisible: 1, autoscrollToTopThreshold: 100 };

const renderMessage = ({ item }: { item: Message }) => <MessageItem message={item} />;
const keyExtractor = (item: Message) => item.id;

type ChatViewProps = {
    wide: boolean;
    listRef: React.Ref<FlatList<Message>>;
    // Remounts the list so each conversation opens at its newest message.
    listKey: string;
    messages: Message[];
    title: string;
    subtitle: string;
    leading?: 'hash' | { initials: string };
    onBack?: () => void;
    onOpenChannels?: () => void;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    emptyTitle: string;
    emptyCopy: string;
    composer: Omit<ComposerProps, 'wide'>;
};

export default function ChatView({
    wide, listRef, listKey, messages, title, subtitle, leading, onBack, onOpenChannels,
    loading = false, error = null, onRetry, emptyTitle, emptyCopy, composer,
}: ChatViewProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors, wide), [colors, wide]);
    const newestFirst = useMemo(() => [...messages].reverse(), [messages]);

    const emptyState = loading
        ? <ActivityIndicator style={styles.stateBlock} color={colors.accent} />
        : error
            ? (
                <View style={styles.stateBlock}>
                    <Text style={styles.stateText}>{error}</Text>
                    {onRetry ? <Pressable onPress={onRetry} accessibilityRole="button"><Text style={styles.retryText}>Try again</Text></Pressable> : null}
                </View>
            )
            : <View style={styles.empty}><Text style={styles.emptyTitle}>{emptyTitle}</Text><Text style={styles.emptyCopy}>{emptyCopy}</Text></View>;

    return (
        <View style={styles.pane}>
            <View style={styles.header}>
                {onBack ? <Pressable onPress={onBack} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Back to direct messages"><Icon name="arrow-back" size={21} color={colors.text} /></Pressable> : null}
                {leading === 'hash' ? <Text style={styles.headerHash}>#</Text> : leading ? <Avatar initials={leading.initials} tint={AVATAR_TINTS.contact} size={34} /> : null}
                <View style={styles.headerCopy}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                {onOpenChannels ? <Pressable onPress={onOpenChannels} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Open channel list"><Icon name="menu-open" size={22} color={colors.textSecondary} /></Pressable> : null}
            </View>
            <FlatList
                key={listKey}
                ref={listRef}
                data={newestFirst}
                inverted
                maintainVisibleContentPosition={MESSAGE_LIST_ANCHORING}
                keyExtractor={keyExtractor}
                renderItem={renderMessage}
                contentContainerStyle={styles.list}
                ListEmptyComponent={emptyState}
            />
            <Composer wide={wide} {...composer} />
        </View>
    );
}

const createStyles = (colors: ThemeColors, wide: boolean) => StyleSheet.create({
    pane: { flex: 1, minWidth: 0, backgroundColor: colors.background },
    header: { minHeight: 61, flexDirection: 'row', alignItems: 'center', paddingHorizontal: wide ? 20 : 14, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    headerHash: { color: colors.textSecondary, fontSize: 25 },
    headerCopy: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 15, fontWeight: '700' },
    subtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
    headerIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: wide ? 22 : 15, paddingTop: 20, paddingBottom: 18 },
    empty: { minHeight: 220, justifyContent: 'center', paddingHorizontal: 22 },
    emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
    emptyCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
    stateBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    stateText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    retryText: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 10 },
});
