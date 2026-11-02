import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { getBlockType } from '../../utils/postBlocks';

const EmbeddedPost = ({ post, onPress, compact = true, embedded = true, accessibilityLabel = 'Open embedded post' }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    if (!post || typeof post !== 'object') {
        return (
            <View style={styles.unavailable}>
                <Text style={styles.unavailableText}>This post isn't available.</Text>
            </View>
        );
    }

    const blocks = (post.postblocks ?? post.blocks ?? [])
        .slice()
        .sort((a, b) => (a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0));
    const text = blocks
        .filter(block => getBlockType(block) === 'text')
        .map(block => block.content ?? '')
        .filter(Boolean)
        .join('\n');
    const media = blocks.find(block => getBlockType(block) === 'image' || getBlockType(block) === 'video');
    const user = post.user ?? post.author ?? {};
    const username = post.username ?? user.username ?? 'Unknown user';
    const avatar = post.user_avatar ?? post.avatar_url ?? user.avatar ?? user.avatar_url;
    const createdAt = post.createdAt ?? post.created_at;
    const date = createdAt && !Number.isNaN(new Date(createdAt).getTime())
        ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : null;

    const content = (
        <>
            <View style={styles.header}>
                <Image
                    source={avatar ? { uri: avatar } : require('../../icons/avatar.png')}
                    style={styles.avatar}
                />
                <Text style={styles.username} numberOfLines={1}>{username}</Text>
                {date ? <Text style={styles.date}> · {date}</Text> : null}
            </View>
            {text ? (
                <Text style={styles.text} numberOfLines={compact ? 4 : undefined}>
                    {text}
                </Text>
            ) : null}
            {media ? (
                getBlockType(media) === 'image' ? (
                    <Image source={{ uri: media.content }} style={styles.media} resizeMode="cover" />
                ) : (
                    <View style={[styles.media, styles.video]}>
                        <Icon name="play-circle-filled" size={40} color="#FFFFFF" />
                        <Text style={styles.videoText}>Video</Text>
                    </View>
                )
            ) : null}
            {!text && !media ? <Text style={styles.unavailableText}>This post has no content.</Text> : null}
        </>
    );

    if (!onPress) {
        return <View style={embedded ? styles.container : styles.fullContainer}>{content}</View>;
    }

    return (
        <Pressable
            onPress={event => {
                event.stopPropagation();
                onPress(post);
            }}
            style={({ pressed }) => [
                embedded ? styles.container : styles.fullContainer,
                pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
        >
            {content}
        </Pressable>
    );
};

const createStyles = colors => StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: 14,
        padding: 12,
        marginTop: 8,
        overflow: 'hidden',
    },
    fullContainer: {
        marginTop: 8,
    },
    pressed: {
        backgroundColor: colors.iconBg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: colors.avatarBg,
    },
    username: {
        color: colors.text,
        fontWeight: '700',
        fontSize: 13,
        flexShrink: 1,
    },
    date: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    text: {
        color: colors.text,
        fontSize: 14,
        lineHeight: 19,
    },
    media: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginTop: 8,
        backgroundColor: colors.iconBg,
    },
    video: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#171717',
    },
    videoText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 4,
    },
    unavailable: {
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: 14,
        padding: 12,
        marginTop: 8,
    },
    unavailableText: {
        color: colors.textSecondary,
        fontSize: 13,
    },
});

export default EmbeddedPost;
