import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { FlatList, RefreshControl } from "react-native-gesture-handler";
import { getCommentReplies } from "../services/api/feed/post/post";
import ActionBar from "../components/posts/ActionBar/ActionBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MAX_ANCESTORS_SHOWN = 3;
const AVATAR_SIZE = 40;
const AVATAR_SIZE_SM = 40;
const THREAD_LINE_WIDTH = 1.5;
const THREAD_LINE_COLOR = "#d6d6d6";
const LEFT_COL_WIDTH = AVATAR_SIZE + 14;
const MAX_CONTENT_LENGTH = 250;
const TOP_SPACE_THREAD = 20;

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getTimeAgoForAncestor = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes !== 1 ? "s" : ""} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

const renderBlock = (block) => {
    const type = block.blockType || block.block_type;
    const content = block.content;
    switch (type) {
        case "text":
            return (
                <View style={styles.blockContent} key={block.id}>
                    <Text style={styles.textBlock}>{content}</Text>
                </View>
            );
        default:
            return null;
    }
};

const renderPostBlocks = (blocks, expanded, toggleExpand) => {
    const combinedText = blocks
        .filter(block => (block.blockType || block.block_type) === 'text')
        .map(block => block.content || '')
        .join(' '); // TODO: add space between blocks for natural reading

    const isLongContent = combinedText.length > MAX_CONTENT_LENGTH;
    
    if (!expanded && isLongContent) {
        return (
            <View key="preview" style={styles.blockContent}>
                <Text style={styles.textBlock}>
                    {combinedText.substring(0, MAX_CONTENT_LENGTH)}...
                    <Text 
                        onPress={toggleExpand} 
                        style={styles.readMore}
                    >
                        {' Show more'}
                    </Text>
                </Text>
            </View>
        );
    }
    

    return (
        <View key="full">
            {blocks.map(block => {
                const type = block.blockType || block.block_type;
                const content = block.content || '';
                
                switch (type) {
                    case "text":
                        return (
                            <View style={styles.blockContent} key={block.id}>
                                <Text style={styles.textBlock}>{content}</Text>
                            </View>
                        );
                    case "image":
                        return (
                            <Image 
                                key={block.id} 
                                source={{ uri: content }} 
                                style={styles.imageBlock} 
                            />
                        );
                    default:
                        return null;
                }
            })}
            
            {isLongContent && expanded && (
                <Text 
                    onPress={toggleExpand} 
                    style={styles.readMore}
                >
                    {' Show less'}
                </Text>
            )}
        </View>
    );
};

const threadStyles = StyleSheet.create({
    leftCol: {
        alignItems: "center",
        marginRight: 10,
        position: 'relative',
        justifyContent: 'flex-start',
        width: LEFT_COL_WIDTH,
        // backgroundColor: '#e40000'
    },
    lineSegment: {
        position: 'absolute',
        width: THREAD_LINE_WIDTH,
        backgroundColor: THREAD_LINE_COLOR,
        left: (LEFT_COL_WIDTH / 2) - (THREAD_LINE_WIDTH / 2),
        zIndex: 0,
    },
    lineTop: {
        top: 0,
        bottom: '100%',
        backgroundColor: '#00ff00',
    },
    lineSegmentFlow: {
        width: THREAD_LINE_WIDTH,
        backgroundColor: THREAD_LINE_COLOR,
        alignSelf: 'center',
        height: 0,
        bottom: '0%'
    },
    lineBottom: {
        top: '0%',
        bottom: 0,
        // height:200,
    },
    avatar: {
        borderWidth: 1,
        borderColor: "#e0e0e0",
        zIndex: 1,
        backgroundColor: '#fff',
    },
    AncestorActionBar: {
        flexDirection: "row",
        // paddingVertical: 10,
        // paddingLeft: LEFT_COL_WIDTH + 10,
        gap: 24,
        alignItems: "center",
        alignSelf: "flex-start",
        // backgroundColor: 'red'
    },
    actionButton: {
        padding: 4,
    },
});

const AvatarColumn = ({ source, size = AVATAR_SIZE, lineAbove = false, lineBelow = false }) => (
    <View style={threadStyles.leftCol}>
        {/* {lineAbove && <View style={[{paddingTop: 10}, threadStyles.lineSegment, threadStyles.lineTop, ]} />} */}
                {lineAbove && (
            <View 
                style={[
                    threadStyles.lineSegmentFlow, 
                    { height: TOP_SPACE_THREAD }
                ]} 
            />
        )}
        <Image
            source={source}
            style={[threadStyles.avatar, { width: size, height: size, borderRadius: size / 2 }, lineAbove && { marginTop: 0 }]}
        />
        {lineBelow && <View style={[threadStyles.lineSegment, threadStyles.lineBottom]} />}
    </View>
);

const PostCard = ({ post, onPress }) => {
    const pressTimer = useRef(null);
    const [isPressed, setIsPressed] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => setExpanded(prev => !prev);

    return (
        <Pressable 
            android_disableSound={true}
            onPressIn={() => {
                pressTimer.current = setTimeout(() => setIsPressed(true), 115);
            }}
            onPressOut={() => {
                clearTimeout(pressTimer.current);
                setIsPressed(false);
            }}
            onPress={() => onPress()}
            style={[styles.postContainer, { backgroundColor: isPressed ? "#e0e0e0" : "#FFFFFF" }]}>
            
            <View style={styles.cardRow}>
                <AvatarColumn 
                    source={post.user_avatar ? { uri: post.user_avatar } : require("../icons/avatar.png")}
                    size={40}
                    lineAbove={false}
                    lineBelow={true}
                />
                <View style={{ flex: 1 }}>
                    <View style={styles.cardContent}>
                        <Text style={styles.username}>
                            {post.user?.username}{" "}
                            <Text style={styles.inlineTimestamp}>
                                • {getTimeAgoForAncestor(post.createdAt)}
                            </Text>
                        </Text>
                        
                        
                        {renderPostBlocks(post.postblocks, expanded, toggleExpand)}
                        
                        <View style={threadStyles.AncestorActionBar}>
                            <ActionBar
                                iconSize={18}
                                gap={24}
                                onComment={() => console.log("comment")}
                                onRepost={() => console.log("repost")}
                                onLike={() => console.log("like")}
                                onBookmark={() => console.log("bookmark")}
                                onShare={() => console.log("share")}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};


const AncestorComment = ({ comment, onPress }) => {
    const [isPressed, setIsPressed] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const pressTimer = useRef(null);
    return (
        <Pressable
            android_disableSound={true}
            onPressIn={() => {
                pressTimer.current = setTimeout(() => setIsPressed(true), 115);
            }}
            onPressOut={() => {
                clearTimeout(pressTimer.current);
                setIsPressed(false);
            }}
            onPress={() => onPress(comment)}
            style={[styles.ancestorContainer, { backgroundColor: isPressed ? "#e0e0e0" : "#FFFFFF" }]}
        >
            <View style={styles.cardRow}>
                <AvatarColumn 
                    source={comment.user?.user_avatar ? { uri: comment.user.user_avatar } : require("../icons/avatar.png")}
                    size={AVATAR_SIZE_SM}
                    lineAbove={true}
                    lineBelow={true}
                />

                <View style={styles.ancestorContent}>
                    <View style={styles.ancestorHeader}>
                        <Text style={styles.ancestorUsername}>{comment.user?.username}</Text>
                        <Text style={styles.ancestorTimestamp}>• {getTimeAgoForAncestor(comment.created_at)}</Text>
                    </View>
                    <View style={styles.ancestorBody}>
                        {renderPostBlocks(comment.blocks, expanded, setExpanded)}
                    </View>
                    <View style={threadStyles.AncestorActionBar}>
                        <ActionBar
                            iconSize={18}
                            gap={24}
                            onComment={() => console.log("comment")}
                            onRepost={() => console.log("repost")}
                            onLike={() => console.log("like")}
                            onBookmark={() => console.log("bookmark")}
                            onShare={() => console.log("share")}
                        />
                    </View>
                </View>
            </View>
        </Pressable>
)};


const FocusedComment = ({ comment, onLayout }) => {
    return (
        <View onLayout={onLayout} style={styles.focusedContainer}>
            <View style={styles.cardRow}>
                <AvatarColumn 
                    source={comment.user.user_avatar ? { uri: comment.user.user_avatar } : require("../icons/avatar.png")}
                    size={AVATAR_SIZE}
                    lineAbove={true}
                    lineBelow={false}
                />
                
                <View style={[styles.focusedMeta, {marginTop: TOP_SPACE_THREAD}]}>
                    <Text style={styles.focusedUsername}>{comment.user?.username}</Text>
                    <Text style={styles.focusedTimestamp}>{getTimeAgo(comment.created_at)}</Text>
                </View>
            </View>

            <View style={styles.focusedBody}>
                {comment.blocks?.map(renderBlock)}
            </View>

            <View style={styles.focusedActionBar}>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="chat-bubble-outline" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="repeat" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="favorite-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="bookmark-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="share" size={16} color="#888" />
                </TouchableOpacity>
            </View>
        </View>
)};


const ReplyItem = ({ reply, onPress }) => {
    const [isPressed, setIsPressed] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const pressTimer = useRef(null);

    return (
        <Pressable
            android_disableSound={true}
            onPressIn={() => {
                pressTimer.current = setTimeout(() => setIsPressed(true), 115);
            }}
            onPressOut={() => {
                clearTimeout(pressTimer.current);
                setIsPressed(false);
            }}
            onPress={() => onPress(reply)}
            style={[replyStyles.container, { backgroundColor: isPressed ? "#e0e0e0" : "#fff" }]}
        >
            <View style={replyStyles.header}>
                <Image
                    source={reply.user?.avatar ? { uri: reply.user.avatar } : require("../icons/avatar.png")}
                    style={replyStyles.avatar}
                />
                <Text style={replyStyles.username}>{reply.user?.username}</Text>
                <Text style={replyStyles.timestamp}>• {getTimeAgo(reply.created_at)}</Text>
            </View>
            {renderPostBlocks(reply.blocks, expanded, setExpanded)}
            <View style={replyStyles.actionBar}>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="chat-bubble-outline" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="repeat" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="favorite-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="bookmark-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="share" size={16} color="#888" />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
};


export const CommentFocusScreen = ({ route }) => {
    const { comment, post, ancestors: passedAncestors } = route.params;
    const navigation = useNavigation();

    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isTopLevel = comment.parent_comment_id == null;
    const [ancestors, setAncestors] = useState(passedAncestors ?? []);
    const [loadingAncestors, setLoadingAncestors] = useState(!isTopLevel && !passedAncestors);
    const [showAllAncestors, setShowAllAncestors] = useState(false);
    const [bottomPadding, setBottomPadding] = useState(250);
    const flatListRef = useRef(null);
    const screenHeight = Dimensions.get("window").height;
    

    const ITEM_HEIGHTS = {
        post: 228,
        ancestor: 152,
        focused: 152,
        reply: 120,
        divider: 1,
        view_more: 37,
    };

    useEffect(() => {
        if (isTopLevel || passedAncestors) return;
        const fetchAncestors = async () => {
            try {
                // TODO: replace with thread endpoint when built
            } catch (err) {
                console.log("failed to fetch ancestors", err);
            } finally {
                setLoadingAncestors(false);
            }
        };
        fetchAncestors();
    }, [comment.id]);

    const fetchReplies = async () => {
        try {
            const response = await getCommentReplies(comment.id);
            if (response) setReplies(response.comments ?? response);
            if (response.comments.length > 5) setBottomPadding(0);
            else if(response.comments.length > 3) setBottomPadding(ITEM_HEIGHTS.reply * 2);
            else setBottomPadding(ITEM_HEIGHTS.reply * 2.3);
        } catch (err) {
            console.log("failed to fetch replies", err);
            setBottomPadding(ITEM_HEIGHTS.reply * 4.9);
        } finally {
            setLoadingReplies(false);
        }
    };

    useEffect(() => {
        fetchReplies();
    }, [comment.id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchReplies();
        setRefreshing(false);
    };

    const handlePostPress = () => navigation.push("PostScreen", { post });

    const handleReplyPress = (reply) => {
        const nextAncestors = [...ancestors, comment];
        const trimmed =
            nextAncestors.length > MAX_ANCESTORS_SHOWN && !showAllAncestors
                ? nextAncestors.slice(-MAX_ANCESTORS_SHOWN)
                : nextAncestors;
        navigation.push("CommentScreen", { comment: reply, post, ancestors: trimmed });
    };

    const visibleAncestors =
        showAllAncestors || ancestors.length <= MAX_ANCESTORS_SHOWN
            ? ancestors
            : ancestors.slice(-MAX_ANCESTORS_SHOWN);

    const hiddenCount = ancestors.length - MAX_ANCESTORS_SHOWN;

    const items = [
        { type: 'post', id: 'post', data: post },
        ...(hiddenCount > 0 && !showAllAncestors
            ? [{ type: 'view_more', id: 'view_more' }]
            : []),
        ...visibleAncestors.map(a => ({ type: 'ancestor', id: a.id, data: a })),
        { type: 'focused', id: comment.id, data: comment },
        { type: 'divider', id: 'divider' },
        ...replies.map(r => ({ type: 'reply', id: r.id, data: r })),
    ];

    const focusedIndex = items.findIndex(item => item.type === 'focused');

    const getItemLayout = (_, index) => {
        let offset = 0;
        for (let i = 0; i < index; i++) {
            offset += ITEM_HEIGHTS[items[i]?.type] ?? ITEM_HEIGHTS.reply;
        }
        return {
            length: ITEM_HEIGHTS[items[index]?.type] ?? ITEM_HEIGHTS.reply,
            offset,
            index,
        };
    };

    const renderItem = ({ item }) => {
        switch (item.type) {
            case 'post':
                return (
                    <View onLayout={(e) => console.log('post height:', e.nativeEvent.layout.height)}>
                        <PostCard post={item.data} onPress={handlePostPress} />
                    </View>
                );
            case 'view_more':
                return (
                    <View onLayout={(e) => console.log('ancestor height:', e.nativeEvent.layout.height)}>
                        <Pressable
                            android_disableSound={true}
                            onPress={() => setShowAllAncestors(true)}
                            style={styles.viewMoreContext}
                        >
                            <Text style={styles.viewMoreContextText}>
                                ↑ View {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"} in thread
                            </Text>
                        </Pressable>
                    </View>
                );
            case 'ancestor':
                return (
                    <View onLayout={(e) => console.log('ancestor height:', e.nativeEvent.layout.height)}>
                        <AncestorComment
                            comment={item.data}
                            onPress={(a) =>
                                navigation.push("CommentScreen", {
                                    comment: a,
                                    post,
                                    ancestors: ancestors.slice(0, ancestors.indexOf(a)),
                                })
                            }
                        />
                    </View>

                );
            case 'focused':
            return (
                <View onLayout={(e) => console.log('focused height:', e.nativeEvent.layout.height)}>
                    <FocusedComment comment={item.data} />
                </View>
            );
            case 'divider':
                return <View style={styles.replyDividerLine} />;
            case 'reply':
                return <ReplyItem reply={item.data} onPress={handleReplyPress} />;
            default:
                return null;
        }
    };

    return (
        <View style={styles.screenContainer}>
            <View style={styles.header}>
                <Pressable
                    android_disableSound={true}
                    style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1.0 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="black" />
                </Pressable>
                <Text style={styles.headerText}>{post.user.username}'s thread</Text>
            </View>

            {loadingReplies ? (
                <ActivityIndicator size="large" color="#1a1a1a" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    style={{ flex: 1 }}
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    initialScrollIndex={focusedIndex}
                    getItemLayout={getItemLayout}
                    ListFooterComponent={
                        <View style={{ paddingBottom: bottomPadding }}>
                            <Text style={{ margin: "auto", fontSize: 28, color: "#c7c7c7" }}>•</Text>
                        </View>
                    }
                    bounces={true}
                    overScrollMode="always"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#1a1a1a"]}
                            tintColor={"#1a1a1a"}
                        />
                    }
                />
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: "#f4f4f4",
    },
    header: {
        backgroundColor: "#f4f4f4",
        width: "100%",
        flexDirection: "row",
        paddingBottom: 10,
        height: 50,
        zIndex: 1,
    },
    headerText: {
        margin: "auto",
        marginLeft: 10,
        fontSize: 18,
        fontWeight: "500",
    },
    backButton: {
        marginLeft: 10,
        marginTop: 10,
        borderRadius: 50,
    },
    cardRow: {
        // paddingTop: 50,
        // backgroundColor: "#f80000",
        flexDirection: "row",
        alignItems: "stretch",
    },

    postContainer: {
        backgroundColor: "#fff",
        paddingTop: 15,
        paddingHorizontal: 15,
        paddingBottom: 0,
    },
    cardContent: {
        flex: 1,
        paddingBottom: 12,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#161616",
    },
    username: {
        fontWeight: "bold",
        fontSize: 16,
    },
    inlineTimestamp: {
        fontWeight: "400",
        fontSize: 13,
        color: "#888",
    },
    blockContent: {
        marginBottom: 8,
        paddingTop: 4,
        paddingRight: 20,
        paddingBottom: 0,
    },
    textBlock: {
        fontSize: 15,
        lineHeight: 20,
    },
    readMore:{
        color: '#1a73e8',
        marginTop: 4,
        fontWeight: '500',
    },
    ancestorContainer: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 15,
        paddingTop: 0,
        paddingBottom: 0,
    },
    ancestorContent: {
        flex: 1,
        paddingBottom: 25,
        paddingTop: 16,
    },
    ancestorHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 2,
    },
    ancestorUsername: {
        fontWeight: "600",
        fontSize: 15,
        color: "#444",
    },
    ancestorTimestamp: {
        fontSize: 12,
        color: "#aaa",
    },
    ancestorBody: {
        marginBottom: 10,
    },
    ancestorText: {
        fontSize: 15,
        color: "#777",
        lineHeight: 18,
    },
    focusedContainer: {
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingTop: 0,
        paddingBottom: 0,
    },
    focusedMeta: {
        flex: 1,
        justifyContent: "center",
        paddingBottom: 6,
    },
    focusedUsername: {
        fontWeight: "bold",
        fontSize: 15,
        color: "#1a1a1a",
    },
    focusedTimestamp: {
        fontSize: 12,
        color: "#888",
        marginTop: 1,
    },
    focusedBody: {
        paddingRight: 15,
        marginBottom: 10,
    },
    focusedActionBar: {
        // backgroundColor: "#e00000",
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#eaeaea",
        // borderBottomWidth: 1,
        // borderBottomColor: "#eaeaea",
        paddingVertical: 10,
        // paddingLeft: LEFT_COL_WIDTH + 10,
        gap: 56,
        alignItems: "center",
    },
    actionButton: {
        padding: 4,
    },
    replyDividerLine: {
        height: 1,
        backgroundColor: "#eaeaea",
    },
    viewMoreContext: {
        backgroundColor: "#fff",
        paddingVertical: 8,
        paddingLeft: LEFT_COL_WIDTH + 25,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    viewMoreContextText: {
        fontSize: 13,
        color: "#888",
    },
});


const replyStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 6,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    username: {
        fontWeight: "bold",
        fontSize: 14,
    },
    timestamp: {
        color: "#888",
        fontSize: 12,
    },
    actionBar: {
        flexDirection: "row",
        marginTop: 8,
        gap: 60,
    },
});