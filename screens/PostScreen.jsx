import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Pressable, RefreshControl, StatusBar, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePStore } from "../services/storage/store/postStore";
import { useNavigation } from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getCommentReplies, getPostComments, togglePostLike } from "../services/api/feed/post/post";
import { FlatList } from "react-native-gesture-handler";
import GalleryViewer from "../components/Media/GalleryViewer";
import CustomSocialVideoPlayer from "../components/Media/CustomSocialVideoPlayer";
import ScreenHeader from "../components/common/ScreenHeader";

const { width: SCREEN_WIDTH } = Dimensions.get('window');


const OPTIONS = [
    { name: 'Most Recent', value: 'recent' },
    { name: 'Top Comments', value: 'top' },
];

const getBlockType = (block) => block.blockType || block.block_type;

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

const CommentItem = React.memo(({ comment, renderBlock, post }) => {
    const [isPressed, setIsPressed] = useState(false);
    const pressTimer = useRef(null);
    const navigation = useNavigation();

    // TODO: not wired to any UI yet — intended for an expandable replies thread.
    const fetchReplies = async (commentID) => {
        const response = await getCommentReplies(commentID);
        console.log(response);
    };

    const navigateToComment = () => {
        navigation.navigate('MainApp', { screen: 'CommentScreen', params: { comment, post } });
    };

    useEffect(() => {
        return () => clearTimeout(pressTimer.current);
    }, []);

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
            style={[commentStyles.container, { backgroundColor: isPressed ? "#e0e0e0" : "#FFFFFF" }]}>
            <View style={commentStyles.header}>
                <Image
                    source={comment.user_avatar ? { uri: comment.user_avatar } : require('../icons/avatar.png')}
                    style={commentStyles.avatar}
                />
                <Text style={commentStyles.username}>{comment.user?.username}</Text>
                <Text style={commentStyles.timestamp}>
                    • {getTimeAgo(comment.created_at)}
                </Text>
            </View>

            {comment.blocks.map(renderBlock)}

            <View style={commentStyles.actionBar}>
                <TouchableOpacity
                    onPress={() => console.log("open comment input screen")}
                    style={commentStyles.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Reply to comment"
                >
                    <Icon name="chat-bubble-outline" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton} accessibilityRole="button" accessibilityLabel="Repost">
                    <Icon name="repeat" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton} accessibilityRole="button" accessibilityLabel="Like comment">
                    <Icon name="favorite-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton} accessibilityRole="button" accessibilityLabel="Bookmark comment">
                    <Icon name="bookmark-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton} accessibilityRole="button" accessibilityLabel="Share comment">
                    <Icon name="share" size={16} color="#888" />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
});

// A single grid cell — an image, or a video thumbnail with a play badge.
// overlayCount, when set, replaces the play badge with a "+N" overlay
// (used on the last visible cell when there are more than 4 media items).
const MediaCell = ({ block, style, overlayCount, onPress }) => {
    const isVideo = getBlockType(block) === 'video';
    const showPlayBadge = isVideo && overlayCount == null;

    return (
        <Pressable
            onPress={onPress}
            style={[mediaGridStyles.cell, style]}
            accessibilityRole="button"
            accessibilityLabel={isVideo ? 'Play video' : 'View image'}
        >
            {isVideo && !block.thumbnailUrl ? (
                <View style={mediaGridStyles.videoPlaceholder} />
            ) : (
                <Image
                    source={{ uri: isVideo ? block.thumbnailUrl : block.content }}
                    style={mediaGridStyles.cellImage}
                    resizeMode="cover"
                />
            )}
            {showPlayBadge && (
                <View style={mediaGridStyles.playBadge}>
                    <Icon name="play-arrow" size={22} color="#fff" />
                </View>
            )}
            {overlayCount != null && (
                <View style={mediaGridStyles.moreOverlay}>
                    <Text style={mediaGridStyles.moreOverlayText}>+{overlayCount}</Text>
                </View>
            )}
        </Pressable>
    );
};

// Same arrangement rules as the feed card's MediaGallery (1 full width, 2
// side by side, 3 one-big-two-stacked, 4+ as a 2x2 with a "+N" overlay),
// ported here and extended so video blocks are valid grid cells too. Every
// cell is individually tappable and opens the fullscreen GalleryViewer at
// its correct index. Only used in gallery layout mode.
const MediaGrid = ({ media, onPressItem }) => {
    const count = media.length;
    if (count === 0) return null;

    const renderCell = (block, style, overlayCount = null) => (
        <MediaCell
            key={block.id}
            block={block}
            style={style}
            overlayCount={overlayCount}
            onPress={() => onPressItem(block.id)}
        />
    );

    if (count === 1) {
        return (
            <View style={mediaGridStyles.container}>
                {renderCell(media[0], mediaGridStyles.single)}
            </View>
        );
    }

    if (count === 2) {
        return (
            <View style={[mediaGridStyles.container, mediaGridStyles.row]}>
                {renderCell(media[0], [mediaGridStyles.rowCell, mediaGridStyles.gapRight])}
                {renderCell(media[1], mediaGridStyles.rowCell)}
            </View>
        );
    }

    if (count === 3) {
        return (
            <View style={[mediaGridStyles.container, mediaGridStyles.row]}>
                {renderCell(media[0], [mediaGridStyles.rowCell, mediaGridStyles.gapRight])}
                <View style={mediaGridStyles.rowCell}>
                    {renderCell(media[1], mediaGridStyles.half)}
                    {renderCell(media[2], [mediaGridStyles.half, { marginTop: 3 }])}
                </View>
            </View>
        );
    }

    // 4 or more: 2x2 grid, "+N" overlay on the last visible cell if there are extras.
    const visible = media.slice(0, 4);
    const extraCount = count - 4;
    return (
        <View style={[mediaGridStyles.container, mediaGridStyles.grid]}>
            {visible.map((block, i) => {
                const isLastCell = i === 3 && extraCount > 0;
                return renderCell(block, mediaGridStyles.gridCell, isLastCell ? extraCount : null);
            })}
        </View>
    );
};

export const PostScreen = ({ route }) => {
    const post = route.params?.post;
    const [refreshing, setRefreshing] = useState(false);
    const [isLiked, setIsLiked] = useState(post?.isLiked);
    const updatePost = usePStore(state => state.updatePost);
    const navigation = useNavigation();
    const [postComments, setPostComments] = useState();
    const [galleryViewerVisible, setGalleryViewerVisible] = useState(false);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState(OPTIONS[1]);
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const buttonRef = useRef(null);

    // 'gallery' → caption + grid layout. Anything else ('inline', missing,
    // etc.) → blocks render in original authored order, text/media interleaved.
    const isGalleryMode = post?.layout_mode === 'gallery';

    // Guarded against post being undefined — these still run before the
    // early return below since hooks can't be called conditionally.
    const mediaBlocks = useMemo(
        () => post?.postblocks?.filter(b => getBlockType(b) === 'image' || getBlockType(b) === 'video') ?? [],
        [post]
    );
    const textBlocks = useMemo(
        () => post?.postblocks?.filter(b => getBlockType(b) === 'text') ?? [],
        [post]
    );

    const handleOpenDropdown = () => {
        buttonRef.current?.measureInWindow((x, y, width, height) => {
            setDropdownPos({ x, y, width, height });
            setDropdownVisible(true);
        });
    };

    const handleSelectOption = (option) => {
        setSelectedOption(option);
        setDropdownVisible(false);
        fetchComments(option);
    };

    const fetchComments = async (option = selectedOption) => {
        const response = await getPostComments(post.id, option.value);
        setPostComments(response.comments);
        if (response.total_count !== post.commentCount) {
            updatePost(post.id, { commentCount: response.total_count });
        }
    };

    // Finds the block's index within the POST's own mediaBlocks. Only
    // correct for the post's own media — never call this with a comment's
    // block id, since it won't be found and will silently fall back to 0.
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

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchComments();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const handleLikePress = async () => {
        const previousLiked = isLiked;
        setIsLiked(!previousLiked); // optimistic update
        try {
            await togglePostLike(post.id, post.likesCount, updatePost);
        } catch (err) {
            console.log(err);
            setIsLiked(previousLiked); // roll back on failure
        }
    };

    // Renders the POST's own top-level blocks (both gallery-mode caption
    // text and inline-mode interleaved blocks route through here). Media
    // is wrapped to open the fullscreen GalleryViewer at the correct index
    // — safe because mediaBlocks here is guaranteed to be the post's own.
    const renderPostBlock = useCallback((block) => {
        const type = getBlockType(block);
        switch (type) {
            case 'text':
                return (
                    <View style={styles.content} key={block.id}>
                        <Text style={styles.textBlock}>{block.content}</Text>
                    </View>
                );
            case 'image':
                return (
                    <Pressable
                        key={block.id}
                        onPress={() => openGallery(block.id)}
                        style={styles.mediaWrapper}
                    >
                        <Image
                            source={{ uri: block.content }}
                            style={styles.inlineMedia}
                            resizeMode="cover"
                        />
                        {mediaBlocks[0]?.id === block.id && mediaBlocks.length > 1 && (
                            <View style={styles.galleryIndicator}>
                                <Icon name="photo-library" size={20} color="#fff" />
                            </View>
                        )}
                    </Pressable>
                );
            case 'video':
                return (
                    <Pressable
                        key={block.id}
                        onPress={() => openGallery(block.id)}
                        style={styles.mediaWrapper}
                    >
                        <View pointerEvents="none">
                            <CustomSocialVideoPlayer block={block} post={post} />
                        </View>
                        {mediaBlocks[0]?.id === block.id && mediaBlocks.length > 1 && (
                            <View style={styles.galleryIndicator}>
                                <Icon name="photo-library" size={20} color="#fff" />
                            </View>
                        )}
                    </Pressable>
                );
            default:
                return null;
        }
    }, [post, mediaBlocks]);

    // Renders blocks WITHIN an individual comment. Deliberately plain — no
    // gallery-opening Pressable here. Reasons: (1) openGallery(block.id)
    // searches the post's own mediaBlocks, which never contains a comment's
    // block id, so it'd silently fall back to opening the post's first
    // item; (2) wrapping media in its own Pressable would swallow the tap
    // before it reaches CommentItem's outer Pressable, breaking "tap a
    // comment to open its thread"; (3) leaving video un-wrapped lets
    // CustomSocialVideoPlayer's own tap-to-play/fullscreen logic work.
    const renderCommentBlock = useCallback((block) => {
        const type = getBlockType(block);
        switch (type) {
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
    }, [post]);

    const renderItem = useCallback(({ item }) => (
        <CommentItem comment={item} renderBlock={renderCommentBlock} post={post} />
    ), [renderCommentBlock, post]);

    if (!post) return null;

    return (
        <View style={styles.container}>

            <ScreenHeader title={`${post.user?.username}'s post`} />

            <FlatList
                style={{ flex: 1 }}
                data={postComments}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                bounces={true}
                overScrollMode="always"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1a1a1a']}
                        tintColor={'#1a1a1a'}
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
                                    <View style={styles.postTextContainer}>
                                        {textBlocks.map(renderPostBlock)}
                                    </View>
                                    {mediaBlocks.length > 0 && (
                                        <MediaGrid media={mediaBlocks} onPressItem={openGallery} />
                                    )}
                                </>
                            ) : (
                                <View style={styles.postBlocksContainer}>
                                    {post.postblocks.map(renderPostBlock)}
                                </View>
                            )}

                            <View style={styles.timestampContainer}>
                                <Text style={styles.timestamp}>
                                    {new Date(post.createdAt).toLocaleString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    })} • {new Date(post.createdAt).toLocaleString('en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: '2-digit'
                                    })}
                                </Text>
                            </View>
                            <View style={styles.actionBar}>
                                <Pressable
                                    android_disableSound={true}
                                    style={styles.actionButton}
                                    onPress={() =>
                                        navigation.navigate("MainApp", { screen: 'CommentComposerScreen', params: { post } })
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel="Reply to post"
                                >
                                    <Icon name="chat-bubble-outline" size={20} color="#666" />
                                    <Text style={styles.actionText}>{post.commentCount}</Text>
                                </Pressable>
                                <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Repost">
                                    <Icon name="repeat" size={20} color="#666" />
                                    <Text style={styles.actionText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleLikePress}
                                    accessibilityRole="button"
                                    accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
                                >
                                    <Icon
                                        name={isLiked ? "favorite" : "favorite-border"}
                                        size={20}
                                        color={isLiked ? "#ff4444" : "#666"}
                                    />
                                    <Text style={styles.actionText}>{post.likesCount}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Bookmark post">
                                    <Icon name="bookmark-border" size={20} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Share post">
                                    <Icon name="share" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.CommentTreeHeader}>
                            <Pressable
                                android_disableSound={true}
                                ref={buttonRef}
                                style={styles.CommentTreeHeaderButton}
                                onPress={handleOpenDropdown}
                            >
                                <Text>{selectedOption.name}</Text>
                            </Pressable>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    postComments && postComments.length === 0 ? (
                        <Text style={styles.emptyText}>No comments yet</Text>
                    ) : null
                }
                ListFooterComponent={
                    <View>
                        <Text style={{ margin: 'auto', fontSize: 28, color: '#c7c7c7' }}>•</Text>
                    </View>
                }
            />
            {dropdownVisible && (
                <>
                    <Pressable
                        android_disableSound={true}
                        style={StyleSheet.absoluteFill}
                        onPress={() => setDropdownVisible(false)}
                    />
                    <View style={[
                        styles.dropdownContainer,
                        {
                            position: 'absolute',
                            top: dropdownPos.y + dropdownPos.height + 1,
                            right: 30,
                        }
                    ]}>
                        {OPTIONS.map((option, index) => (
                            <Pressable
                                android_disableSound={true}
                                key={index}
                                style={[
                                    styles.dropdownOption,
                                    selectedOption.value === option.value && styles.selectedOption
                                ]}
                                onPress={() => handleSelectOption(option)}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    selectedOption.value === option.value && styles.selectedText
                                ]}>
                                    {option.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </>
            )}

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    postContainer: {
        backgroundColor: '#fff',
        padding: 15,
        paddingBottom: 0,
        width: '100%',
    },
    header: {
        marginTop: 0,
        backgroundColor: '#f4f4f4ff',
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: 50,
        zIndex: 1,
    },
    headerText: {
        margin: 'auto',
        marginLeft: 10,
        fontSize: 18,
        fontWeight: '500'
    },
    backButton: {
        marginLeft: 10,
        marginTop: 10,
        borderRadius: 50,
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
        borderColor: '#161616ff'
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    postTextContainer: {
        marginBottom: 4,
    },
    postBlocksContainer: {
        marginBottom: 4,
    },
    timestampContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
        paddingBottom: 10
    },
    timestamp: {
        color: '#666',
        fontSize: 14,
    },
    content: {
        marginBottom: 8,
        padding: 5,
        paddingBottom: 0
    },
    textBlock: {
        fontSize: 15,
        lineHeight: 20,
    },
    readMore: {
        color: '#1a73e8',
        marginTop: 4,
        fontWeight: '500',
    },
    inlineMedia: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 4,
    },
    mediaWrapper: {
        position: 'relative',
    },
    galleryIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    footer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingTop: 8,
    },
    actionBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
        paddingTop: 10,
        paddingBottom: 10,
        gap: 56,
        width: '100%',
        alignItems: 'center',
        marginBottom: 0,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    actionText: {
        marginLeft: 4,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        marginTop: 24,
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: '#ff0000ff',
        padding: 10,
        borderColor: '#000',
        borderWidth: 1,
        margin: 12,
    },
    commentInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: '#efefef',
        borderBottomColor: '#efefef',
        backgroundColor: '#fff',
        gap: 8,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    commentInput: {
        flex: 1,
        minHeight: 38,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: 14,
        color: '#1a1a1a',
        lineHeight: 20,
    },
    sendButton: {
        width: 50,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 14,
    },
    CommentTreeHeader: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    },
    CommentTreeHeaderButton: {
        margin: 'auto',
        marginRight: 30,
        minWidth: 110,
        paddingHorizontal: 6,
        paddingVertical: 6,
        textAlign: 'center'
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        minWidth: 110,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 3,
        overflow: 'hidden',
    },
    dropdownOption: {
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedOption: {
        backgroundColor: '#f0f0f0',
    },
    dropdownText: {
        fontSize: 14,
        color: '#333',
    },
    selectedText: {
        fontWeight: '600',
    },
});

const mediaGridStyles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 8,
    },
    row: {
        flexDirection: 'row',
        height: 240,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: 280,
    },
    cell: {
        overflow: 'hidden',
        position: 'relative',
    },
    single: {
        width: '100%',
        height: 400,
    },
    rowCell: {
        flex: 1,
        height: '100%',
    },
    gapRight: {
        marginRight: 3,
    },
    half: {
        flex: 1,
        width: '100%',
    },
    gridCell: {
        width: '50%',
        height: '50%',
        padding: 1.5,
    },
    cellImage: {
        width: '100%',
        height: '100%',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    playBadge: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    moreOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    moreOverlayText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
});

const commentStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    timestamp: {
        color: '#888',
        fontSize: 12,
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: '#1a1a1a',
    },
    actionBar: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 60,
    },
    actionButton: {
        padding: 4,
    },
});