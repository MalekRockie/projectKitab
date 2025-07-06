import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TextPost = ({
    id,
    username,
    content,
    likes,
    comments,
    timestamp,
    userAvatar,
    isLiked: initialIsLiked = false,
    onLikePress,
    onCommentPress,
    onMorePress,
    }) => {
        const [isLiked, setIsLiked] = useState(initialIsLiked);
        const [likeCount, setLikeCount] = useState(likes);
        const [expanded, setExpanded] = useState(false);

        const MAX_CONTENT_LENGTH = 150;

        const toggleLike = () => {
            const newLikeState = !isLiked;
            setIsLiked(newLikeState);
            setLikeCount(newLikeState ? likeCount + 1 : likeCount - 1);
            onLikePress?.(id, newLikeState); // Callback for API call
    };

    const toggleExpand = () => setExpanded(!expanded);

    const displayContent = 
        content.length > MAX_CONTENT_LENGTH && !expanded
        ? `${content.substring(0, MAX_CONTENT_LENGTH)}...`
        : content;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Image 
                source={{ uri: userAvatar || 'https://i.imgur.com/placeholder.png' }} 
                style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{username}</Text>
                    <Text style={styles.timestamp}>
                        {formatDistanceToNow(new Date(timestamp))} ago
                    </Text>
                </View>
                <TouchableOpacity onPress={onMorePress}>
                    <Icon name="more-vert" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <Text style={styles.contentText}>
                {displayContent}
                </Text>
                {content.length > MAX_CONTENT_LENGTH && (
                <TouchableOpacity onPress={toggleExpand}>
                    <Text style={styles.readMore}>
                    {expanded ? 'Show less' : 'Read more'}
                    </Text>
                </TouchableOpacity>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actionBar}>
                <TouchableOpacity 
                style={styles.actionButton} 
                onPress={toggleLike}
                >
                <Icon 
                    name={isLiked ? "favorite" : "favorite-border"} 
                    size={24} 
                    color={isLiked ? "#ff4444" : "#666"} 
                />
                <Text style={styles.actionText}>{likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                style={styles.actionButton}
                onPress={onCommentPress}
                >
                <Icon name="chat-bubble-outline" size={24} color="#666" />
                <Text style={styles.actionText}>{comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                <Icon name="share" size={24} color="#666" />
                </TouchableOpacity>
            </View>
            </View>
        );
    };

    const styles = StyleSheet.create({
        container: {
            backgroundColor: '#fff',
            borderRadius: 8,
            marginBottom: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 12,
        },
        userInfo: {
            flex: 1,
        },
        username: {
            fontWeight: '600',
            fontSize: 16,
        },
        timestamp: {
            color: '#666',
            fontSize: 12,
            marginTop: 2,
        },
        contentContainer: {
            marginBottom: 12,
        },
        contentText: {
            fontSize: 15,
            lineHeight: 20,
        },
        readMore: {
            color: '#1a73e8',
            marginTop: 4,
            fontWeight: '500',
        },
        actionBar: {
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            paddingTop: 8,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 24,
        },
        actionText: {
            marginLeft: 4,
            color: '#666',
        },
    });

export default TextPost;