import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { CircleChannel, CircleChannelCategory } from '../../services/api/messages/circles';
import ChannelRow from './ChannelRow';

type CircleChannelListProps = {
    categories: CircleChannelCategory[];
    channels: CircleChannel[];
    selectedChannelId: string;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onSelect: (channelId: string) => void;
};

export default function CircleChannelList({
    categories, channels, selectedChannelId, loading, error, onRetry, onSelect,
}: CircleChannelListProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const orderedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
    const orderedChannels = [...channels].sort((a, b) => a.display_order - b.display_order);
    const uncategorized = orderedChannels.filter(channel => !channel.category_id || !categories.some(category => category.id === channel.category_id));

    if (error) {
        return (
            <Pressable onPress={onRetry} style={styles.status} accessibilityRole="button">
                <Text style={styles.error}>{error}</Text>
                <Text style={styles.retry}>Try again</Text>
            </Pressable>
        );
    }
    if (loading && !channels.length) {
        return <Text style={styles.status}>Loading channels…</Text>;
    }
    if (!channels.length) {
        return <Text style={styles.status}>No channels in this circle yet.</Text>;
    }

    const renderChannels = (items: CircleChannel[]) => items.map(channel => (
        <ChannelRow
            key={channel.id}
            name={channel.name}
            active={selectedChannelId === channel.id}
            unread={false}
            onPress={() => onSelect(channel.id)}
        />
    ));

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            {orderedCategories.map(category => {
                const categoryChannels = orderedChannels.filter(channel => channel.category_id === category.id);
                if (!categoryChannels.length) {return null;}
                return (
                    <View key={category.id}>
                        <Text style={styles.category}>{category.name}</Text>
                        {renderChannels(categoryChannels)}
                    </View>
                );
            })}
            {uncategorized.length ? (
                <View>
                    {orderedCategories.length ? <Text style={styles.category}>Other channels</Text> : null}
                    {renderChannels(uncategorized)}
                </View>
            ) : null}
        </ScrollView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    status: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingHorizontal: 8, paddingVertical: 12 },
    error: { color: colors.danger, fontSize: 12, lineHeight: 17 },
    retry: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 7 },
    category: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 5, textTransform: 'uppercase' },
});
