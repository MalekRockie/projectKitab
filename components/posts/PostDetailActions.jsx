import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, Pressable, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';

// Action row shown on the post detail screen: reply, repost, like,
// bookmark and share, with counts where they apply.
const PostDetailActions = ({
    commentCount,
    likesCount,
    isLiked,
    isBookmarked,
    onReply,
    onLike,
    onBookmark,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.actionBar}>
            <Pressable
                android_disableSound={true}
                style={styles.actionButton}
                onPress={onReply}
                accessibilityRole="button"
                accessibilityLabel="Reply to post"
            >
                <Icon name="chat-bubble-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.actionText}>{commentCount}</Text>
            </Pressable>
            <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Repost">
                <Icon name="repeat" size={20} color={colors.textSecondary} />
                <Text style={styles.actionText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={onLike}
                accessibilityRole="button"
                accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
            >
                <Icon
                    name={isLiked ? 'favorite' : 'favorite-border'}
                    size={20}
                    color={isLiked ? colors.danger : colors.textSecondary}
                />
                <Text style={styles.actionText}>{likesCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={onBookmark}
                accessibilityRole="button"
                accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
            >
                <Icon
                    name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                    size={20}
                    color={isBookmarked ? colors.accent : colors.textSecondary}
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Share post">
                <Icon name="share" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    actionBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
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
        color: colors.textSecondary,
    },
});

export default PostDetailActions;
