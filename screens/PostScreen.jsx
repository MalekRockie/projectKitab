import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePStore } from "../services/storage/store/postStore";
import { useNavigation } from "@react-navigation/native";
import { createComment, getCommentReplies, getPostComments, togglePostLike } from "../services/api/feed/post/post";
import { FlatList, RefreshControl } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get('window');


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

const CommentItem = ({ comment, renderBlock, post }) => {
    const [isPressed, setIsPressed] = useState(false);
    const pressTimer = useRef(null);
    const navigation = useNavigation();
    const fetchReplies = async (commentID) => {
        const response = await getCommentReplies(commentID);
        console.log(response);
    }

    const naviageToComment = async() =>{
        navigation.navigate("MainApp", {screen: 'CommentScreen', params: { comment, post }})
    }
    // console.log(comment.created_at);
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
            onPress={() => navigation.navigate("MainApp", {screen: 'CommentScreen', params: { comment, post }})}
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
                onPress={() => (console.log("open comment input screen"))}
                style={commentStyles.actionButton}>
                    <Icon name="chat-bubble-outline" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton}>
                    <Icon name="repeat" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton}>
                    <Icon name="favorite-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton}>
                    <Icon name="bookmark-border" size={16} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={commentStyles.actionButton}>
                    <Icon name="share" size={16} color="#888" />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
};

export const PostScreen = ({ route }) => {


    const post = route.params?.post;
    const [refreshing, setRefreshing] = useState(false);
    const [isLiked, setIsLiked] = useState(route.params?.post.isLiked);
    const updatePost = usePStore(state => state.updatePost);
    const navigation = useNavigation();
    // const [newComment, setNewComment] = useState('');
    const [postComments, setPostComments] = useState();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState({name:'Top Comments', value: 'top'});
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const buttonRef = useRef(null);

    const options = [{
        name: 'Most Recent',
        value: 'recent'
    },
    {
        name:'Top Comments', 
        value: 'top'
    }];

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


    const fetchComments = async (option) => {
        if (option == null) option = selectedOption;
        const response = await getPostComments(post.id, option.value);
        setPostComments(response.comments);
        if (response.total_count != post.total_count) {
            updatePost(post.id, { commentCount: response.total_count });
            post.total_count = response.total_count;
        }
    };



    const onRefresh = async () => {
        setRefreshing(true);
        await fetchComments();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchComments();
    }, []);

    // useEffect(() => {
    //     console.log(postComments);
    // }, [postComments]);

    const likePost = () => {
        try{
            const like = togglePostLike(post.id, post.likesCount, updatePost);
        } 
        catch (err){
            console.log(err);
        }
        setIsLiked(!isLiked);
    }

    // const makeComment = () => {
    //     const newComment = {
    //         parent_comment_id: null,
    //         blocks: [
    //                 {
    //                     Type: "text",
    //                     Content: newComment
    //                 }
    //         ]
    //     }
    //     createComment(post.id, newComment);
    //     setNewComment('')
    // }

    
    // const toggleExpand = () => setExpanded(!expanded);

    if (!post) return null;
    

    const renderBlock = (block) => {
        const type = block.blockType || block.block_type;
        const content = block.content;

        switch (type) {
            case 'text':
                return (
                    <View style={styles.content} key={block.id}>
                        <Text style={styles.textBlock}>{content}</Text>
                    </View>
                );
            default:
                return null;
        }
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    android_disableSound={true}
                    style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1.0 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="black" />
                </Pressable>
                <Text style={styles.headerText}>
                    {post.user?.username}'s post
                </Text>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={postComments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CommentItem comment={item} renderBlock={renderBlock} post={post} />
                )}
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
                            <View>
                                {post.postblocks.map(renderBlock)}
                            </View>
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
                                        // console.log("open comment input screen")
                                        navigation.navigate("MainApp", {screen: 'CommentComposerScreen', params: { post: post }})
                                    }
                                >
                                    <Icon name="chat-bubble-outline" size={20} color="#666" />
                                    <Text style={styles.actionText}>{post.commentCount}</Text>
                                </Pressable>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Icon name="repeat" size={20} color="#666" />
                                    <Text style={styles.actionText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => likePost()}
                                >
                                    <Icon
                                        name={isLiked ? "favorite" : "favorite-border"}
                                        size={20}
                                        color={isLiked ? "#ff4444" : "#666"}
                                    />
                                    <Text style={styles.actionText}>{post.likesCount}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Icon name="bookmark-border" size={20} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
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
                ListFooterComponent={
                    <View>
                        <Text style={{ margin: 'auto', fontSize: 28, color: '#c7c7c7',}}>•</Text>
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
                        {options.map((option, index) => (
                            <Pressable
                                android_disableSound={true}
                                key={index}
                                style={[
                                    styles.dropdownOption,
                                    selectedOption === option && styles.selectedOption
                                ]}
                                onPress={() => handleSelectOption(option)}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    selectedOption === option.name && styles.selectedText
                                ]}>
                                    {option.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
    postContainer: {
        backgroundColor: '#fff',
        // marginBottom: 0,
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
        zIndex:1,
    },
    headerText: {
        // backgroundColor: 'rgb(228, 2, 2)',
        margin:'auto',
        marginLeft: 10,
        // textAlign:'center',
        // height:'auto',
        fontSize: 18,
        fontWeight:'500'
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
        // width: '94%',
        padding: 5,
        paddingRight: 50,
        paddingBottom: 0
    },
    textBlock: {
        // backgroundColor: '#dd0000ff',
        fontSize: 15,
        lineHeight: 20,
        // marginBottom: 0,
    },
    readMore: {
        color: '#1a73e8',
        marginTop: 4,
        fontWeight: '500',
    },
    media: {
        width: SCREEN_WIDTH - 24,
        height: 300,
        borderRadius: 8,
        marginBottom: 8,
    },
    footer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingTop: 8,
    },
    actionBar: {
        flexDirection: 'row',
        // borderTopWidth: 1,
        // borderTopColor: '#eee',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
        // padding: 10,
        paddingTop: 10,
        paddingBottom: 10,
        gap: 56,
        // margin: 'auto',
        width: '100%',
        // backgroundColor: 'rgb(215, 0, 0)',
        alignItems:'center',
        marginBottom: 0,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        // marginLeft: 10,
    },
    actionText: {
        marginLeft: 4,
        color: '#666',
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
        gap: '60',
        // backgroundColor: '#ff0000',
    },
    actionButton: {
        padding: 4,
        // margin:'auto',
        // marginLeft: 10,
    },
});