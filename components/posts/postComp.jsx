import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable, Modal, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePStore } from '../../services/storage/store/postStore';
import { shallow } from 'zustand/shallow';
import { togglePostLike } from '../../services/api/feed/post/post';
import { useNavigation } from '@react-navigation/native';
import GalleryViewer from '../Media/GalleryViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MAX_CONTENT_LENGTH = 250;

// How tall an inline post's media preview is allowed to be before it gets
// cropped. Deliberately shorter than the gallery's natural heights (120-140
// below) so a peek is always visible whenever inline media exists.
const INLINE_MEDIA_PREVIEW_HEIGHT = 90;

// Planned as the future default palette — not wired in yet. When ready,
// nothing else in this file needs to change).
const UPCOMING_COLORS = {
    background: '#131313',
    backgroundPressed: '#1c1c1e',
    divider: '#2f3336',
    textPrimary: '#e7e9ea',
    textSecondary: '#8b98a5',
    border: '#232323',
    accent: '#f4425e',
    likeActive: '#f4425e',
    likeInactive: '#8b98a5',
    likePressed: 'rgba(244, 66, 94, 0.12)',
    pillPressed: 'rgba(255, 255, 255, 0.08)',
};

// Colors currently in use throughout this file (the original light palette).
const COLORS = {
    background: '#FFFFFF',
    backgroundPressed: '#e0e0e0',
    divider: '#e6e6e6',
    textPrimary: '#000000',
    textSecondary: '#666666',
    border: 'transparent',
    accent: '#1a73e8',
    likeActive: '#ff4444',
    likeInactive: '#ff0000',
    likePressed: 'rgba(255, 0, 0, 0.08)',
    pillPressed: 'rgba(0, 0, 0, 0.06)',
};

// Formats large counts the way most feeds do (1.2K, 3.4M) instead of raw numbers.
const formatCount = (count = 0) => {
    if (count < 1000) return `${count}`;
    if (count < 1000000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
};

// Relative time (3h, 2d), falling back to a short
// date once a post is more than a week old.
const formatRelativeTime = (dateString) => {
    const then = new Date(dateString).getTime();
    const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

    if (diffSeconds < 60) return 'now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Lays out 1-4+ media blocks as an album grid. 1 = full width, 2 = side by
// side, 3 = one big + two stacked, 4+ = 2x2 with a "+N" overlay on extras.
// When onPressItem is provided, every cell becomes tappable and opens the
// fullscreen gallery at that item's index (gallery layout mode). When it's
// omitted, cells render as plain, non-interactive Images so taps fall
// through to whatever wraps this component (used for the inline mode
// cropped preview, where the whole card is meant to be one "go to post"
// target alongside the explicit "View post" pill below it).
const MediaGallery = ({ media, style, onPressItem }) => {
    const count = media.length;
    if (count === 0) return null;

    const renderCell = (item, cellStyle) => {
        if (!onPressItem) {
            return <Image source={{ uri: item.content }} style={cellStyle} resizeMode="cover" />;
        }
        return (
            <Pressable
                android_disableSound={true}
                onPress={() => onPressItem(item.id)}
                style={cellStyle}
                accessibilityRole="button"
                accessibilityLabel="View image"
            >
                <Image source={{ uri: item.content }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            </Pressable>
        );
    };

    if (count === 1) {
        return (
            <View style={[styles.galleryContainer, style]}>
                {renderCell(media[0], styles.gallerySingle)}
            </View>
        );
    }

    if (count === 2) {
        return (
            <View style={[styles.galleryContainer, styles.galleryRow, style]}>
                {renderCell(media[0], [styles.galleryCell, styles.galleryGapRight])}
                {renderCell(media[1], styles.galleryCell)}
            </View>
        );
    }

    if (count === 3) {
        return (
            <View style={[styles.galleryContainer, styles.galleryRow, style]}>
                {renderCell(media[0], [styles.galleryCell, styles.galleryGapRight])}
                <View style={styles.galleryCell}>
                    {renderCell(media[1], styles.galleryHalf)}
                    {renderCell(media[2], [styles.galleryHalf, { marginTop: 3 }])}
                </View>
            </View>
        );
    }

    // 4 or more: 2x2 grid, with a "+N" overlay on the last visible cell if there are extras.
    const visible = media.slice(0, 4);
    const extraCount = count - 4;
    return (
        <View style={[styles.galleryContainer, styles.galleryGrid, style]}>
            {visible.map((item, i) => {
                const isLastCell = i === 3 && extraCount > 0;
                const overlay = isLastCell && (
                    <View style={styles.galleryOverlay}>
                        <Text style={styles.galleryOverlayText}>+{extraCount}</Text>
                    </View>
                );

                if (!onPressItem) {
                    return (
                        <View key={item.id} style={styles.galleryGridCell}>
                            <Image source={{ uri: item.content }} style={styles.galleryGridImage} resizeMode="cover" />
                            {overlay}
                        </View>
                    );
                }

                return (
                    <Pressable
                        key={item.id}
                        android_disableSound={true}
                        onPress={() => onPressItem(item.id)}
                        style={styles.galleryGridCell}
                        accessibilityRole="button"
                        accessibilityLabel="View image"
                    >
                        <Image source={{ uri: item.content }} style={styles.galleryGridImage} resizeMode="cover" />
                        {overlay}
                    </Pressable>
                );
            })}
        </View>
    );
};

const PostComponent = memo(({ postId }) => {
    const post = usePStore(
        state => state.getPost(postId),
        shallow
    );

    const [isLiked, setIsLiked] = useState(false);
    const updatePost = usePStore(state => state.updatePost);
    const [expanded, setExpanded] = useState(false);
    const navigation = useNavigation();
    const [isPressed, setIsPressed] = useState(false);
    const pressTimer = useRef(null);

    const [galleryViewerVisible, setGalleryViewerVisible] = useState(false);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

    useEffect(() => {
        if (post?.isLiked !== undefined) {
            setIsLiked(post.isLiked);
        }
    }, [post?.isLiked]);

    useEffect(() => {
        return () => clearTimeout(pressTimer.current);
    }, []);

    const handleLikePress = async () => {
        const previousLiked = isLiked;
        setIsLiked(!previousLiked); // optimistic update
        try {
            await togglePostLike(post.id, post.likesCount, updatePost);
        } catch (err) {
            console.log(err);
            setIsLiked(previousLiked);
        }
    };

    const toggleExpand = () => setExpanded(!expanded);
    const goToPost = () => navigation.navigate('MainApp', { screen: 'PostScreen', params: { post } });

    if (!post) return null;

    const textBlocks = post.postblocks.filter(b => b.blockType === 'text');
    const mediaBlocks = post.postblocks.filter(b => b.blockType === 'image');
    // Legacy posts without layout_mode set fall back to 'inline'.
    const layoutMode = post.layout_mode === 'gallery' ? 'gallery' : 'inline';
    console.log(post);

    // Opens the fullscreen gallery at the tapped item's index. Only ever
    // wired up in gallery mode — inline mode's preview stays non-interactive
    // so the whole card keeps acting as one "go to post" target.
    const openGallery = (blockId) => {
        const correctIndex = mediaBlocks.findIndex(b => b.id === blockId);
        setGalleryInitialIndex(correctIndex >= 0 ? correctIndex : 0);
        setGalleryViewerVisible(true);
        // StatusBar.setHidden(true);
    };

    const closeGallery = () => {
        setGalleryViewerVisible(false);
        // StatusBar.setHidden(false);
    };

    const renderTextBlock = (block) => {
        const isLong = block.content.length > MAX_CONTENT_LENGTH;
        return (
            <View style={styles.content} key={block.id}>
                <Text style={styles.textBlock}>
                    {isLong && !expanded ? `${block.content.substring(0, MAX_CONTENT_LENGTH)}...` : block.content}
                    {isLong && (
                        <Text onPress={toggleExpand} style={styles.readMore}>
                            {expanded ? '  Show less' : '  Show more'}
                        </Text>
                    )}
                </Text>
            </View>
        );
    };

    return (
        <>
            <Pressable
                android_disableSound={true}
                onPressIn={() => {
                    pressTimer.current = setTimeout(() => setIsPressed(true), 115);
                }}
                onPressOut={() => {
                    clearTimeout(pressTimer.current);
                    setIsPressed(false);
                }}
                style={[styles.container, { backgroundColor: isPressed ? COLORS.backgroundPressed : COLORS.background }]}
                onPress={goToPost}
            >
                <Image
                    source={post.user_avatar ? { uri: post.user_avatar } : require('../../icons/avatar.png')}
                    style={styles.avatar}
                />

                <View style={styles.body}>
                    <View style={styles.postHeader}>
                        <Text style={styles.username}>{post.user?.username}</Text>
                        <Text style={styles.timestamp}> · {formatRelativeTime(post.createdAt)}</Text>
                    </View>

                    <View>
                        {textBlocks.map(renderTextBlock)}
                    </View>

                    {mediaBlocks.length > 0 && layoutMode === 'gallery' && (
                        <MediaGallery media={mediaBlocks} onPressItem={openGallery} />
                    )}

                    {mediaBlocks.length > 0 && layoutMode === 'inline' && (
                        <>
                            <View style={styles.inlineMediaCap}>
                                <MediaGallery media={mediaBlocks} />
                            </View>
                            <Pressable
                                android_disableSound={true}
                                style={({ pressed }) => [styles.viewPostButton, { backgroundColor: pressed ? COLORS.pillPressed : 'transparent' }]}
                                onPress={goToPost}
                                accessibilityRole="button"
                                accessibilityLabel="View full post"
                            >
                                <Text style={styles.viewPostText}>View post</Text>
                                <Icon name="chevron-right" size={16} color={COLORS.accent} />
                            </Pressable>
                        </>
                    )}

                    <View style={styles.actionBar}>
                        <Pressable
                            android_disableSound={true}
                            style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? COLORS.pillPressed : 'transparent' }]}
                            onPress={() => navigation.navigate('MainApp', { screen: 'CommentComposerScreen', params: { post } })}
                            accessibilityRole="button"
                            accessibilityLabel="Reply to post"
                        >
                            <Icon name="chat-bubble-outline" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.actionText}>{formatCount(post.commentCount)}</Text>
                        </Pressable>

                        <Pressable
                            android_disableSound={true}
                            style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? COLORS.pillPressed : 'transparent' }]}
                            accessibilityRole="button"
                            accessibilityLabel="Repost"
                            // TODO: wire up real repost logic + count once the API supports it
                        >
                            <Icon name="repeat" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.actionText}>{formatCount(0)}</Text>
                        </Pressable>

                        <Pressable
                            android_disableSound={true}
                            style={({ pressed }) => [
                                styles.actionButton,
                                { backgroundColor: isLiked || pressed ? COLORS.likePressed : 'transparent' },
                            ]}
                            onPress={handleLikePress}
                            accessibilityRole="button"
                            accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
                        >
                            <Icon
                                name={isLiked ? 'favorite' : 'favorite-border'}
                                size={18}
                                color={isLiked ? COLORS.likeActive : COLORS.likeInactive}
                            />
                            <Text style={[styles.actionText, isLiked && { color: COLORS.likeActive }]}>
                                {formatCount(post.likesCount)}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Pressable>

            {galleryViewerVisible && (
                <Modal
                    visible={galleryViewerVisible}
                    animationType="none"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={closeGallery}
                >
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <GalleryViewer
                            mediaBlocks={mediaBlocks}
                            initialIndex={galleryInitialIndex}
                            post={post}
                            onClose={closeGallery}
                        />
                    </GestureHandlerRootView>
                </Modal>
            )}
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    body: {
        flex: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    username: {
        fontWeight: '700',
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    timestamp: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    content: {
        marginBottom: 8,
    },
    textBlock: {
        fontSize: 15,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },
    readMore: {
        color: COLORS.accent,
        fontWeight: '600',
        fontSize: 15,
    },
    galleryContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 4,
        marginBottom: 4,
    },
    galleryRow: {
        flexDirection: 'row',
        height: 120,
    },
    galleryCell: {
        flex: 1,
        height: '100%',
    },
    galleryGapRight: {
        marginRight: 3,
    },
    galleryHalf: {
        flex: 1,
        width: '100%',
    },
    gallerySingle: {
        width: '100%',
        height: 140,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: 140,
    },
    galleryGridCell: {
        width: '50%',
        height: '50%',
        padding: 1.5,
    },
    galleryGridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
    },
    galleryOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 1.5,
        borderRadius: 2,
    },
    galleryOverlayText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    inlineMediaCap: {
        maxHeight: INLINE_MEDIA_PREVIEW_HEIGHT,
        overflow: 'hidden',
        borderRadius: 14,
        marginTop: 4,
    },
    viewPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        marginTop: 6,
        marginBottom: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    viewPostText: {
        color: COLORS.accent,
        fontWeight: '600',
        fontSize: 13,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 260,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    actionText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});

export default PostComponent;