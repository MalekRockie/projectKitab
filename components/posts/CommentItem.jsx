import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import CustomSocialVideoPlayer from '../Media/CustomSocialVideoPlayer';
import { getCommentReplies } from '../../services/api/feed/post/post';
import { useTheme } from '../../theme/useTheme';
import { darkColors } from '../../theme/colors';
import { openUserProfile } from '../../utils/profileNavigation';

import { getBlockType } from '../../utils/postBlocks';

const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays <= 2) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// `post` is optional: without it the comment is shown but can't open its thread.
const CommentItem = React.memo(({ comment, post, onRemoveBookmark }) => {
    const [isPressed, setIsPressed] = useState(false);
    const pressTimer = useRef(null);
    const navigation = useNavigation();
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const pillPressed = colors === darkColors ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    // TODO: not wired to any UI yet — intended for an expandable replies thread.
    const fetchReplies = async (commentID) => {
        const response = await getCommentReplies(commentID);
        console.log(response);
    };

    const navigateToComment = () => {
        if (!post) {
            return;
        }
        navigation.navigate('MainApp', { screen: 'CommentScreen', params: { comment, post } });
    };

    const handleOpenProfile = (event) => {
        event.stopPropagation();
        openUserProfile(navigation, comment.user?.id ?? comment.user?.user_id ?? comment.user_id);
    };

    useEffect(() => {
        return () => clearTimeout(pressTimer.current);
    }, []);

    // No gallery Pressable here: it would swallow the tap that opens the thread
    // and the video player already handles its own tap-to-play/fullscreen.
    const renderBlock = (block) => {
        switch (getBlockType(block)) {
            case 'text':
                return (
                    <View style={styles.content} key={block.id}>
                        <Text style={styles.textBlock}>{block.content}</Text>
                    </View>
                );
            case 'image':
                return (
                    <Image
                        key={block.id}
                        source={{ uri: block.content }}
                        style={styles.inlineMedia}
                        resizeMode="cover"
                    />
                );
            case 'video':
                return (
                    <CustomSocialVideoPlayer key={block.id} block={block} post={post} />
                );
            default:
                return null;
        }
    };

    return (
        <Pressable
            android_disableSound={true}
            onPressIn={() => {
                pressTimer.current = setTimeout(() => {
                    setIsPressed(true);
                }, 115);
            }}
            onPressOut={() => {
                clearTimeout(pressTimer.current);
                setIsPressed(false);
            }}
            onPress={navigateToComment}
            style={[styles.container, { backgroundColor: isPressed ? colors.iconBg : colors.surface }]}>
            <Pressable onPress={handleOpenProfile} accessibilityRole="button" accessibilityLabel="Open profile">
                <Image
                    source={comment.user_avatar ? { uri: comment.user_avatar } : require('../../icons/avatar.png')}
                    style={styles.avatar}
                />
            </Pressable>

            <View style={styles.body}>
                <View style={styles.header}>
                    <Pressable onPress={handleOpenProfile} accessibilityRole="button">
                        <Text style={styles.username}>{comment.user?.username}</Text>
                    </Pressable>
                    <Text style={styles.timestamp}> • {getTimeAgo(comment.created_at)}</Text>
                </View>

                {(comment.blocks ?? []).map(renderBlock)}

                <View style={styles.actionBar}>
                    <Pressable
                        android_disableSound={true}
                        onPress={() => console.log("open comment input screen")}
                        style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? pillPressed : 'transparent' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Reply to comment"
                    >
                        <Icon name="chat-bubble-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.actionText}>0</Text>
                    </Pressable>
                    <Pressable
                        android_disableSound={true}
                        style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? pillPressed : 'transparent' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Repost"
                    >
                        <Icon name="repeat" size={18} color={colors.textSecondary} />
                        <Text style={styles.actionText}>0</Text>
                    </Pressable>
                    <Pressable
                        android_disableSound={true}
                        style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? pillPressed : 'transparent' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Like comment"
                    >
                        <Icon name="favorite-border" size={18} color={colors.textSecondary} />
                        <Text style={styles.actionText}>0</Text>
                    </Pressable>
                    <Pressable
                        android_disableSound={true}
                        onPress={async (event) => {
                            event.stopPropagation();
                            await onRemoveBookmark?.();
                        }}
                        style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? pillPressed : 'transparent' }]}
                        accessibilityRole="button"
                        accessibilityLabel={onRemoveBookmark ? 'Remove bookmark' : 'Bookmark comment'}
                    >
                        <Icon name="bookmark-border" size={18} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable
                        android_disableSound={true}
                        style={({ pressed }) => [styles.actionButton, styles.shareActionButton, { backgroundColor: pressed ? pillPressed : 'transparent' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Share comment"
                    >
                        <Icon name="share" size={18} color={colors.textSecondary} />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
});

const createStyles = (colors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: colors.surface,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 1,
        borderColor: colors === darkColors ? '#232323' : 'transparent',
        backgroundColor: '#fff',
    },
    body: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    username: {
        fontWeight: '700',
        fontSize: 15,
        color: colors.text,
    },
    timestamp: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    content: {
        marginBottom: 8,
    },
    textBlock: {
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
    },
    inlineMedia: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 4,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    actionText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    shareActionButton: {
        marginLeft: 'auto',
    },
});

export default CommentItem;
