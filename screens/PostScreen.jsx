import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, RefreshControl, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView, FlatList } from 'react-native-gesture-handler';
import { usePStore } from '../services/storage/store/postStore';
import GalleryViewer from '../components/Media/GalleryViewer';
import MediaGrid from '../components/Media/MediaGrid';
import CommentItem from '../components/posts/CommentItem';
import PostBlock from '../components/posts/PostBlock';
import PostDetailActions from '../components/posts/PostDetailActions';
import ScreenHeader from '../components/common/ScreenHeader';
import SortDropdown from '../components/common/SortDropdown';
import useGalleryViewer from '../hooks/useGalleryViewer';
import usePostActions from '../hooks/usePostActions';
import usePostComments, { COMMENT_SORT_OPTIONS } from '../hooks/usePostComments';
import { useTheme } from '../theme/useTheme';
import { formatPostTimestamp } from '../utils/date';
import { getMediaBlocks, getTextBlocks } from '../utils/postBlocks';

export const PostScreen = ({ route }) => {
    const post = route.params?.post;
    const navigation = useNavigation();
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const updatePost = usePStore(state => state.updatePost);

    // 'gallery' → caption + grid layout. Anything else ('inline', missing,
    // etc.) → blocks render in original authored order, text/media interleaved.
    const isGalleryMode = post?.layout_mode === 'gallery';

    // Guarded against post being undefined — hooks run before the early
    // return below since they can't be called conditionally.
    const mediaBlocks = useMemo(() => getMediaBlocks(post?.postblocks), [post]);
    const textBlocks = useMemo(() => getTextBlocks(post?.postblocks), [post]);

    const gallery = useGalleryViewer(mediaBlocks);
    const { comments, sort, setSort, refreshing, refresh } = usePostComments(post, updatePost);
    const { isLiked, isBookmarked, toggleLike, toggleBookmark } = usePostActions(post, updatePost);

    const renderBlock = useCallback((block) => (
        <PostBlock
            key={block.id}
            block={block}
            post={post}
            mediaBlocks={mediaBlocks}
            onOpenMedia={gallery.open}
        />
    ), [post, mediaBlocks, gallery.open]);

    const renderItem = useCallback(({ item }) => (
        <CommentItem comment={item} post={post} />
    ), [post]);

    if (!post) {return null;}

    return (
        <View style={styles.container}>
            <ScreenHeader title={`${post.user?.username}'s post`} titleInBackButton />

            <FlatList
                style={styles.list}
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                bounces={true}
                overScrollMode="always"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        colors={[colors.accent]}
                        tintColor={colors.accent}
                    />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.postContainer}>
                            <View style={styles.postHeader}>
                                <Image
                                    source={post.user_avatar ? { uri: post.user_avatar } : require('../icons/avatar.png')}
                                    style={styles.avatar}
                                />
                                <Text style={styles.username}>{post.user?.username}</Text>
                            </View>

                            {isGalleryMode ? (
                                <>
                                    <View style={styles.blocksContainer}>
                                        {textBlocks.map(renderBlock)}
                                    </View>
                                    {mediaBlocks.length > 0 && (
                                        <MediaGrid media={mediaBlocks} onPressItem={gallery.open} />
                                    )}
                                </>
                            ) : (
                                <View style={styles.blocksContainer}>
                                    {post.postblocks.map(renderBlock)}
                                </View>
                            )}

                            <View style={styles.timestampContainer}>
                                <Text style={styles.timestamp}>{formatPostTimestamp(post.createdAt)}</Text>
                            </View>

                            <PostDetailActions
                                commentCount={post.commentCount}
                                likesCount={post.likesCount}
                                isLiked={isLiked}
                                isBookmarked={isBookmarked}
                                onReply={() => navigation.navigate('MainApp', {
                                    screen: 'CommentComposerScreen',
                                    params: { post },
                                })}
                                onLike={toggleLike}
                                onBookmark={toggleBookmark}
                            />
                        </View>
                        <SortDropdown options={COMMENT_SORT_OPTIONS} selected={sort} onSelect={setSort} />
                    </>
                }
                ListEmptyComponent={
                    comments && comments.length === 0 ? (
                        <Text style={styles.emptyText}>No comments yet</Text>
                    ) : null
                }
                ListFooterComponent={<Text style={styles.footerDot}>•</Text>}
            />

            {gallery.visible && (
                <Modal
                    visible={gallery.visible}
                    animationType="none"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={gallery.close}
                >
                    <GestureHandlerRootView style={styles.flex}>
                        <GalleryViewer
                            mediaBlocks={mediaBlocks}
                            initialIndex={gallery.initialIndex}
                            post={post}
                            onClose={gallery.close}
                        />
                    </GestureHandlerRootView>
                </Modal>
            )}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        flex: 1,
    },
    postContainer: {
        backgroundColor: colors.surface,
        padding: 15,
        paddingBottom: 0,
        width: '100%',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.divider,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
        color: colors.text,
    },
    blocksContainer: {
        marginBottom: 4,
    },
    timestampContainer: {
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        paddingBottom: 10,
    },
    timestamp: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 24,
        marginBottom: 12,
    },
    footerDot: {
        margin: 'auto',
        fontSize: 28,
        color: colors.textSecondary,
    },
});
