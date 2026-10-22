import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomSocialVideoPlayer from '../Media/CustomSocialVideoPlayer';
import { useTheme } from '../../theme/useTheme';
import { getBlockType } from '../../utils/postBlocks';

// Renders one top-level block of a post (text, image or video). Media
// blocks open the fullscreen viewer through onOpenMedia, and the first one
// shows a gallery badge when the post has more than one media item.
// mediaBlocks must be the post's own media list.
const PostBlock = ({ block, post, mediaBlocks, onOpenMedia }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const type = getBlockType(block);

    if (type === 'text') {
        return (
            <View style={styles.content}>
                <Text style={styles.textBlock}>{block.content}</Text>
            </View>
        );
    }

    if (type !== 'image' && type !== 'video') {
        return null;
    }

    const showGalleryBadge = mediaBlocks[0]?.id === block.id && mediaBlocks.length > 1;

    return (
        <Pressable onPress={() => onOpenMedia(block.id)} style={styles.mediaWrapper}>
            {type === 'image' ? (
                <Image source={{ uri: block.content }} style={styles.inlineMedia} resizeMode="cover" />
            ) : (
                <View pointerEvents="none">
                    <CustomSocialVideoPlayer block={block} post={post} />
                </View>
            )}
            {showGalleryBadge && (
                <View style={styles.galleryIndicator}>
                    <Icon name="photo-library" size={20} color="#fff" />
                </View>
            )}
        </Pressable>
    );
};

const createStyles = (colors) => StyleSheet.create({
    content: {
        marginBottom: 8,
        padding: 5,
        paddingBottom: 0,
    },
    textBlock: {
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
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
});

export default PostBlock;
