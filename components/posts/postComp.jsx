import React, { memo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePStore } from '../../services/storage/store/postStore';
import { shallow } from 'zustand/shallow'
import { togglePostLike } from '../../services/api/feed/post/post';
import { useNavigation, NavigationContainer } from '@react-navigation/native';
import { TextInput } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PostComponent = memo(({ postId }) => {
    const post = usePStore(
        state => state.getPost(postId),
        shallow
    );
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const updatePost = usePStore(state => state.updatePost);
    const [expanded, setExpanded] = useState(false);
    const navigation = useNavigation();
    const MAX_CONTENT_LENGTH = 250;
    const [isPressed, setIsPressed] = useState(false);
    const pressTimer = useRef(null);

    const likePost = () => {
        try{
            const like = togglePostLike(post.id, post.likesCount, updatePost);
        } 
        catch (err){
            console.log(err);
        }
        setIsLiked(!isLiked);
    }

    
    const toggleExpand = () => setExpanded(!expanded);

    if (!post) return null;
    

    const renderBlock = (block) => {
        // console.log(block.content)
        switch (block.blockType) {
            case 'text':
            return (
            <View style={styles.content} key={block.id}>
                <Text style={styles.textBlock}>
                    {block.content.length > MAX_CONTENT_LENGTH && !expanded ? `${block.content.substring(0, MAX_CONTENT_LENGTH)}...` : block.content}
                    {block.content.length > MAX_CONTENT_LENGTH && (
                        <Text onPress={toggleExpand} style={styles.readMore}>{!expanded ? ' Show more' : ''}</Text>
                    )}
                </Text>
            </View>
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
            style={[styles.container, { backgroundColor: isPressed ? "#e0e0e0" : "#FFFFFF" }]}
            onPress={() => navigation.navigate("MainApp", {screen: "PostScreen", params: { post: post }})}
            //.navigate(stack, { screen: screen })
        >
            {/* <View style={styles.container}> */}
                    {/* Left side: avatar */}
                    <View>
                        <Image 
                            source={post.user_avatar ? { uri: post.user_avatar } : require('../../icons/avatar.png')} 
                            style={styles.avatar}
                            />
                    </View>

                    {/* Right side */}
                    <View>
                        
                        <View style={styles.postHeader}>

                                <Text style={styles.username}>{post.user?.username} </Text>
                                <Text style={styles.timestamp}>
                                    • {new Date(post.createdAt).toLocaleDateString()}
                                </Text>

                        </View>
                        
                        {/* Post blocks */}
                        <View>
                            {post.postblocks.map(renderBlock)}
                        </View>
                        
                        {/* footer (likes, comments) */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity
                                touchSoundDisabled={true}
                                style={styles.actionButton} 
                                >
                                <Icon name="chat-bubble-outline" size={20} color="#666" />
                                <Text style={styles.actionText}>{post.commentCount}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.actionButton}>
                                <Icon 
                                    name="repeat"
                                    size={20}
                                />
                                <Text style={styles.actionText}>0</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={()=> likePost()}
                            >
                                <Icon 
                                    name={isLiked ? "favorite" : "favorite-border"} 
                                    size={20} 
                                    color={post.isLiked ? "#ff4444" : "#ff0000ff"} 
                                />
                                <Text style={styles.actionText}>{post.likesCount}</Text>
                            </TouchableOpacity>
                            {/* <Text>{post.likesCount} likes • {post.commentCount} comments</Text> */}
                        </View>
                    </View>
            {/* </View> */}
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        // marginBottom: 0.5,
        padding: 10,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: "#e6e6e6"
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
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    timestamp: {
        color: '#666',
        fontSize: 12,
    },
    content: {
        marginBottom: 12,
        // width: '94%',
        paddingRight: 50,
    },
    textBlock: {
        // backgroundColor: '#dd0000ff',
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 8,
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
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    actionBar: {
        flexDirection: 'row',
        // borderTopWidth: 1,
        // borderTopColor: '#eee',
        gap: 60,
        margin: 'auto',
        // marginLeft: 10,
        width: '100%',
        // backgroundColor: '#ff0000ff',

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
    }
});

export default PostComponent;