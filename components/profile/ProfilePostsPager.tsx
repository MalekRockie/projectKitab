import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent, ListRenderItemInfo } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getMyPosts } from '../../services/api/user/currentUser';
import { usePStore } from '../../services/storage/store/postStore';
import PostComponent from '../posts/postComp';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { openUserProfile } from '../../utils/profileNavigation';

type PageKey = 'posts' | 'media' | 'comments';
type ProfileMode = 'posts' | 'media' | 'images' | 'videos' | 'comments' | 'replies';
type MenuOption = { value: string; label: string };

type IncludedComment = {
    id?: string | number;
    content?: string;
    text?: string;
    body?: string;
    comment?: string;
    username?: string;
    user?: { id?: string | number; user_id?: string | number; username?: string };
    user_id?: string | number;
    created_at?: string;
    blocks?: Array<{ content?: string }>;
    replies?: IncludedComment[];
};

type ProfilePost = {
    id: string | number;
    comments?: IncludedComment[];
    post_comments?: IncludedComment[];
};

const TypedPostComponent = PostComponent as React.ComponentType<{ postId: string | number }>;

const PAGE_KEYS: PageKey[] = ['posts', 'media', 'comments'];
const FEED_KEYS: Record<ProfileMode, string> = {
    posts: 'profileAll',
    media: 'profileMedia',
    images: 'profileImages',
    videos: 'profileVideo',
    comments: 'profileComments',
    replies: 'profileReplies',
};
const EMPTY_PAGINATION = { page: 1, hasNext: false, totalPosts: 0 };
const EMPTY_FEED_IDS: Array<string | number> = [];
const EMPTY_INCLUDED_POSTS: Record<string, ProfilePost> = {};
const MEDIA_OPTIONS: MenuOption[] = [
    { value: 'media', label: 'All media' },
    { value: 'images', label: 'Images' },
    { value: 'videos', label: 'Videos' },
];
const COMMENT_OPTIONS: MenuOption[] = [
    { value: 'comments', label: 'Comments' },
    { value: 'replies', label: 'Comments & replies' },
];

function getRequestOptions(mode: ProfileMode) {
    switch (mode) {
        case 'media':
            return { hasMedia: true };
        case 'images':
            return { hasMedia: true, mediaType: 'image' };
        case 'videos':
            return { hasMedia: true, mediaType: 'video' };
        case 'comments':
            return { includeComments: true, commentsLimit: 5 };
        case 'replies':
            return { includeReplies: true, commentsLimit: 5, repliesLimit: 3 };
        default:
            return {};
    }
}

function getCommentText(comment: IncludedComment) {
    if (comment.content || comment.text || comment.body || comment.comment) {
        return comment.content || comment.text || comment.body || comment.comment;
    }
    return comment.blocks?.map(block => block.content).filter(Boolean).join(' ') || '';
}

function getEmptyMessage(mode: ProfileMode) {
    if (mode === 'posts') return 'You haven’t shared any posts yet.';
    if (mode === 'media' || mode === 'images' || mode === 'videos') return 'No media to show yet.';
    return 'No comments to show yet.';
}

function CommentActivity({ comments, includeReplies, styles }: {
    comments: IncludedComment[];
    includeReplies: boolean;
    styles: ReturnType<typeof createStyles>;
}) {
    const navigation = useNavigation();
    if (comments.length === 0) {
        return <Text style={styles.noComments}>No comments on this post</Text>;
    }

    return (
        <View style={styles.comments}>
            {comments.map((comment, index) => (
                <View key={comment.id ?? `${comment.created_at ?? 'comment'}-${index}`} style={styles.comment}>
                    <Text onPress={() => openUserProfile(navigation, comment.user?.id ?? comment.user?.user_id ?? comment.user_id)} style={styles.commentAuthor}>{comment.user?.username ?? comment.username ?? 'Comment'}</Text>
                    <Text style={styles.commentText}>{getCommentText(comment)}</Text>
                    {includeReplies && comment.replies?.map((reply, replyIndex) => (
                        <View key={reply.id ?? `${reply.created_at ?? 'reply'}-${replyIndex}`} style={styles.reply}>
                            <Text onPress={() => openUserProfile(navigation, reply.user?.id ?? reply.user?.user_id ?? reply.user_id)} style={styles.commentAuthor}>{reply.user?.username ?? reply.username ?? 'Reply'}</Text>
                            <Text style={styles.commentText}>{getCommentText(reply)}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

function ProfileFeedPage({ mode, active, available, colors, styles }: {
    mode: ProfileMode;
    active: boolean;
    available: boolean;
    colors: ThemeColors;
    styles: ReturnType<typeof createStyles>;
}) {
    const feedKey = FEED_KEYS[mode];
    const postIds = usePStore(state => state.feeds[feedKey] || EMPTY_FEED_IDS);
    const visiblePostIds = available ? postIds : EMPTY_FEED_IDS;
    const pagination = usePStore(state => state.pagination[feedKey] || EMPTY_PAGINATION);
    const addPosts = usePStore(state => state.addPosts);
    const clearFeed = usePStore(state => state.clearFeed);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [includedPostsByFeed, setIncludedPostsByFeed] = useState<Record<string, Record<string, ProfilePost>>>({});
    const inFlightModes = useRef(new Set<string>());
    const activeFeedRef = useRef(feedKey);
    activeFeedRef.current = feedKey;
    const loadedFeeds = useRef(new Set<string>());
    const endReachedForScroll = useRef(false);
    const isUserScrolling = useRef(false);

    const fetchPage = useCallback(async (reset = false) => {
        if (!available) return;
        if (inFlightModes.current.has(feedKey)) return;
        const latestPagination = usePStore.getState().pagination[feedKey];
        if (!reset && !latestPagination?.hasNext) return;

        const page = reset ? 1 : (latestPagination?.page ?? 1) + 1;
        inFlightModes.current.add(feedKey);
        setLoading(true);
        setError(null);
        if (reset) {
            clearFeed(feedKey);
            setIncludedPostsByFeed(current => ({ ...current, [feedKey]: {} }));
        }

        try {
            const response = await getMyPosts({ page, limit: 20, ...getRequestOptions(mode) });
            if (!Array.isArray(response?.posts) || !response?.pagination) {
                throw new Error('The posts response did not include posts and pagination.');
            }

            addPosts(response, feedKey);
            const responsePosts = response.posts as ProfilePost[];
            setIncludedPostsByFeed(current => ({
                ...current,
                [feedKey]: {
                    ...(reset ? {} : current[feedKey]),
                    ...Object.fromEntries(responsePosts.map(post => [String(post.id), post])),
                },
            }));
        } catch (fetchError) {
            loadedFeeds.current.delete(feedKey);
            console.warn('Could not load profile feed', fetchError);
            if (activeFeedRef.current === feedKey) {
                setError('We couldn’t load this content right now. Check your connection and try again.');
            }
        } finally {
            inFlightModes.current.delete(feedKey);
            if (activeFeedRef.current === feedKey) {
                setLoading(inFlightModes.current.size > 0);
            }
        }
    }, [addPosts, available, clearFeed, feedKey, mode]);

    useEffect(() => {
        if (!active || !available || loadedFeeds.current.has(feedKey)) return;

        loadedFeeds.current.add(feedKey);
        endReachedForScroll.current = false;
        fetchPage(true);
    }, [active, available, feedKey, fetchPage]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
        if (isUserScrolling.current && distanceFromEnd > 80) endReachedForScroll.current = false;
    }, []);

    const handleEndReached = useCallback(() => {
        if (endReachedForScroll.current || loading || !pagination.hasNext) return;
        endReachedForScroll.current = true;
        fetchPage();
    }, [fetchPage, loading, pagination.hasNext]);

    const renderItem = useCallback(({ item: postId }: ListRenderItemInfo<number | string>) => {
        const post = (includedPostsByFeed[feedKey] || EMPTY_INCLUDED_POSTS)[String(postId)];
        if (mode !== 'comments' && mode !== 'replies') return <TypedPostComponent postId={postId} />;

        const comments = post?.comments ?? post?.post_comments ?? [];
        return (
            <View>
                <TypedPostComponent postId={postId} />
                <CommentActivity comments={comments} includeReplies={mode === 'replies'} styles={styles} />
            </View>
        );
    }, [feedKey, includedPostsByFeed, mode, styles]);

    const renderEmpty = useCallback(() => {
        if (!available) return <Text style={[styles.emptyState, styles.stateText]}>{getEmptyMessage(mode)}</Text>;
        if (loading) return <ActivityIndicator style={styles.emptyState} color={colors.accent} />;
        if (error) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.stateText}>{error}</Text>
                    <Pressable onPress={() => fetchPage(true)} accessibilityRole="button">
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                </View>
            );
        }
        const emptyMessage = pagination.totalPosts === 0
            ? getEmptyMessage(mode)
            : 'There’s nothing to show here yet.';
        return <Text style={[styles.emptyState, styles.stateText]}>{emptyMessage}</Text>;
    }, [available, colors.accent, error, fetchPage, loading, mode, pagination.totalPosts, styles]);

    return (
        <FlatList
            style={styles.postsList}
            data={visiblePostIds}
            renderItem={renderItem}
            keyExtractor={postId => postId.toString()}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            onScroll={handleScroll}
            onScrollBeginDrag={() => { isUserScrolling.current = true; }}
            onScrollEndDrag={() => { isUserScrolling.current = false; }}
            onMomentumScrollBegin={() => { isUserScrolling.current = true; }}
            onMomentumScrollEnd={() => { isUserScrolling.current = false; }}
            scrollEventThrottle={16}
            refreshControl={
                <RefreshControl
                    refreshing={loading && postIds.length > 0}
                    onRefresh={() => {
                        endReachedForScroll.current = false;
                        fetchPage(true);
                    }}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={loading && postIds.length > 0 ? (
                <ActivityIndicator style={styles.footerLoader} color={colors.accent} />
            ) : error && postIds.length > 0 ? (
                <Pressable style={styles.footerLoader} onPress={() => fetchPage()} accessibilityRole="button">
                    <Text style={styles.retryText}>Couldn’t load more. Tap to try again.</Text>
                </Pressable>
            ) : null}
        />
    );
}

const TAB_TITLES: Record<PageKey, string> = {
    posts: 'Posts',
    media: 'Media',
    comments: 'Comments',
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    pager: {
        flex: 1,
        overflow: 'hidden',
    },
    pagerRow: {
        flex: 1,
        flexDirection: 'row',
    },
    page: {
        flex: 1,
    },
    postsList: {
        flex: 1,
        width: '100%',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 45,
        right: 4,
        minWidth: 180,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.divider,
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 10,
        elevation: 5,
    },
    dropdownOption: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    dropdownOptionText: {
        color: colors.text,
        fontSize: 14,
    },
    dropdownOptionSelected: {
        color: colors.accent,
        fontWeight: '600',
    },
    topTabs: {
        position: 'relative',
        zIndex: 3,
        height: 48,
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        elevation: 3,
    },
    topTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    topTabSelected: {
        borderBottomColor: colors.accent,
    },
    topTabText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    topTabTextSelected: {
        color: colors.text,
        fontWeight: '600',
    },
    emptyState: {
        minHeight: 160,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    stateText: {
        paddingTop: 30,
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: 15,
        marginBottom: 10,
    },
    retryText: {
        color: colors.accent,
        fontSize: 14,
        fontWeight: '600',
    },
    footerLoader: {
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    comments: {
        paddingHorizontal: 14,
        paddingBottom: 12,
        backgroundColor: colors.surface,
    },
    comment: {
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.divider,
    },
    reply: {
        marginTop: 8,
        marginLeft: 18,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: colors.divider,
    },
    commentAuthor: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    commentText: {
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 3,
    },
    noComments: {
        color: colors.textSecondary,
        fontSize: 13,
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
});

const ProfilePostsPager: React.FC<{ available?: boolean }> = ({ available = true }) => {
    const { width } = useWindowDimensions();
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [mediaMode, setMediaMode] = useState<ProfileMode>('media');
    const [commentsMode, setCommentsMode] = useState<ProfileMode>('comments');
    const [openMenu, setOpenMenu] = useState<PageKey | null>(null);
    const pagerX = useSharedValue(0);
    const startX = useSharedValue(0);

    const goToPage = (index: number) => {
        const nextIndex = Math.max(0, Math.min(PAGE_KEYS.length - 1, index));
        pagerX.value = withTiming(-nextIndex * width);
        setActiveIndex(nextIndex);
        setOpenMenu(null);
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-8, 8])
        .onBegin(() => {
            startX.value = pagerX.value;
        })
        .onChange((event) => {
            pagerX.value = Math.max(-width * (PAGE_KEYS.length - 1), Math.min(0, startX.value + event.translationX));
        })
        .onEnd((event) => {
            const rawIndex = -pagerX.value / width;
            let nextIndex = Math.round(rawIndex);
            if (Math.abs(event.velocityX) > 450) {
                nextIndex = event.velocityX < 0 ? Math.ceil(rawIndex) : Math.floor(rawIndex);
            }
            nextIndex = Math.max(0, Math.min(PAGE_KEYS.length - 1, nextIndex));
            pagerX.value = withTiming(-nextIndex * width);
            runOnJS(setActiveIndex)(nextIndex);
            runOnJS(setOpenMenu)(null);
        });

    const animatedPagerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: pagerX.value }],
    }));

    useEffect(() => {
        pagerX.value = withTiming(-activeIndex * width);
    }, [activeIndex, pagerX, width]);

    const renderMenu = (page: PageKey, selected: ProfileMode, options: MenuOption[], onSelect: (mode: ProfileMode) => void) => (
        <View style={styles.dropdownMenu}>
            {options.map(option => (
                <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => {
                        onSelect(option.value as ProfileMode);
                        setOpenMenu(null);
                    }}
                    style={styles.dropdownOption}
                >
                    <Text style={[
                        styles.dropdownOptionText,
                        selected === option.value && styles.dropdownOptionSelected,
                    ]}>{option.label}</Text>
                </Pressable>
            ))}
        </View>
    );

    const mediaOptions = MEDIA_OPTIONS;
    const commentsOptions = COMMENT_OPTIONS;

    return (
        <View style={styles.pager}>
            <View style={styles.topTabs} accessibilityRole="tablist">
                {PAGE_KEYS.map((page, index) => (
                    <Pressable
                        key={page}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: activeIndex === index }}
                        onPress={() => {
                            if (activeIndex !== index) {
                                goToPage(index);
                                return;
                            }

                            if (page === 'media' || page === 'comments') {
                                setOpenMenu(current => current === page ? null : page);
                            } else {
                                setOpenMenu(null);
                            }
                        }}
                        style={[styles.topTab, activeIndex === index && styles.topTabSelected]}
                    >
                        <Text style={[styles.topTabText, activeIndex === index && styles.topTabTextSelected]}>
                            {TAB_TITLES[page]}
                        </Text>
                    </Pressable>
                ))}
                {openMenu === 'media' && renderMenu('media', mediaMode, mediaOptions, setMediaMode)}
                {openMenu === 'comments' && renderMenu('comments', commentsMode, commentsOptions, setCommentsMode)}
            </View>
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.pagerRow, { width: width * PAGE_KEYS.length }, animatedPagerStyle]}>
                    {PAGE_KEYS.map((page, index) => {
                        const mode: ProfileMode = page === 'posts' ? 'posts' : page === 'media' ? mediaMode : commentsMode;

                        return (
                            <View key={page} style={[styles.page, { width }]}>
                                <ProfileFeedPage
                                    mode={mode}
                                    active={activeIndex === index}
                                    available={available}
                                    colors={colors}
                                    styles={styles}
                                />
                            </View>
                        );
                    })}
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

export default ProfilePostsPager;