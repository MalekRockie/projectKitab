import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBlockType } from '../../utils/postBlocks';

// A single grid cell — an image, or a video thumbnail with a play badge.
// overlayCount, when set, replaces the play badge with a "+N" overlay
// (used on the last visible cell when there are more than 4 media items).
const MediaCell = ({ block, style, overlayCount, onPress }) => {
    const isVideo = getBlockType(block) === 'video';
    const showPlayBadge = isVideo && overlayCount == null;

    return (
        <Pressable
            onPress={onPress}
            style={[styles.cell, style]}
            accessibilityRole="button"
            accessibilityLabel={isVideo ? 'Play video' : 'View image'}
        >
            {isVideo && !block.thumbnailUrl ? (
                <View style={styles.videoPlaceholder} />
            ) : (
                <Image
                    source={{ uri: isVideo ? block.thumbnailUrl : block.content }}
                    style={styles.cellImage}
                    resizeMode="cover"
                />
            )}
            {showPlayBadge && (
                <View style={styles.playBadge}>
                    <Icon name="play-arrow" size={22} color="#fff" />
                </View>
            )}
            {overlayCount != null && (
                <View style={styles.moreOverlay}>
                    <Text style={styles.moreOverlayText}>+{overlayCount}</Text>
                </View>
            )}
        </Pressable>
    );
};

// Arrangement rules: 1 full width, 2 side by side, 3 one-big-two-stacked,
// 4+ as a 2x2 with a "+N" overlay. Image and video blocks are both valid
// cells, and every cell calls onPressItem with its block id.
const MediaGrid = ({ media, onPressItem }) => {
    const count = media.length;
    if (count === 0) {return null;}

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
            <View style={styles.container}>
                {renderCell(media[0], styles.single)}
            </View>
        );
    }

    if (count === 2) {
        return (
            <View style={[styles.container, styles.row]}>
                {renderCell(media[0], [styles.rowCell, styles.gapRight])}
                {renderCell(media[1], styles.rowCell)}
            </View>
        );
    }

    if (count === 3) {
        return (
            <View style={[styles.container, styles.row]}>
                {renderCell(media[0], [styles.rowCell, styles.gapRight])}
                <View style={styles.rowCell}>
                    {renderCell(media[1], styles.half)}
                    {renderCell(media[2], [styles.half, styles.stackedGap])}
                </View>
            </View>
        );
    }

    const visible = media.slice(0, 4);
    const extraCount = count - 4;
    return (
        <View style={[styles.container, styles.grid]}>
            {visible.map((block, i) => {
                const isLastCell = i === 3 && extraCount > 0;
                return renderCell(block, styles.gridCell, isLastCell ? extraCount : null);
            })}
        </View>
    );
};

const styles = StyleSheet.create({
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
    stackedGap: {
        marginTop: 3,
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

export default MediaGrid;
