import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePStore } from '../../services/storage/store/postStore';
import { shallow } from 'zustand/shallow'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostComponent = memo(({ postId }) => {

    // console.log('Post component rendering: ', postId);
    const post = usePStore(
        state => state.getPost(postId),
        shallow
        );

    if (!post) return null;
    
    
    const renderBlock = (block) => {
        // console.log(block.content)
        switch (block.blockType) {
            case 'text':
            return (
            <Text style={styles.textBlock} key={block.id}>
                {block.content}
            </Text>
            );
        
        
            default:
            return null;
        }
    };

    return (
        <TouchableOpacity>
            <View style={styles.container}>
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
                        <View style={styles.content}>
                            {post.postblocks.map(renderBlock)}
                        </View>
                        
                        {/* footer (likes, comments) */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity 
                                style={styles.actionButton} 
                                >
                                <Icon name="chat-bubble-outline" size={20} color="#666" />
                                <Text style={styles.actionText}>{post.commentCount}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                            style={styles.actionButton} 
                            >
                                <Icon 
                                    name={post.isLiked ? "favorite" : "favorite-border"} 
                                    size={20} 
                                    color={post.isLiked ? "#ff4444" : "#666"} 
                                />
                                <Text style={styles.actionText}>{post.likesCount}</Text>
                            </TouchableOpacity>
                            {/* <Text>{post.likesCount} likes • {post.commentCount} comments</Text> */}
                        </View>
                    </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 1,
        padding: 10,
        width: '100%'
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
    },
});

export default PostComponent;