// src/components/Media/GalleryViewer.js
import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, Image, StyleSheet, Dimensions, Pressable 
} from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler'; // Might have to change to V2 later
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GalleryViewer = ({ mediaBlocks, initialIndex, post, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
    const pagerRef = useRef(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    
    // Animation values for swipe-down
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    
    const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.25;

    useEffect(() => {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }, []);
    // This is the only way to reliably negotiate touch priority with native pagers like PagerView.
const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
        if (event.translationY > 0) {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        }
    },
    onEnd: (event) => {
        if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 1500) {
            // Exit: fixed-duration timing, not spring — guarantees it
            // finishes quickly regardless of travel distance/velocity.
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
                if (finished) runOnJS(onClose)();
            });
            translateX.value = withTiming(event.translationX + event.velocityX * 0.15, { duration: 220 });
        } else {
            // Snap-back: spring is fine here — short travel distance, no callback gating.
            translateX.value = withSpring(0);
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
    },
});

const backgroundStyle = useAnimatedStyle(() => {
    const distance = Math.sqrt(translateX.value ** 2 + translateY.value ** 2);
    const progress = Math.min(distance / SCREEN_HEIGHT, 1);
    return {
        opacity: interpolate(progress, [0, 1], [1, 0]),
    };
});

const animatedContainerStyle = useAnimatedStyle(() => {
    const distance = Math.sqrt(translateX.value ** 2 + translateY.value ** 2);
    const progress = Math.min(distance / SCREEN_HEIGHT, 1);
    return {
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: interpolate(progress, [0, 1], [1, 0.7]) },
        ],
    };
});

    const handlePageScroll = (e) => {
        setCurrentIndex(e.nativeEvent.position);
        setIsVideoPlaying(false);
    };

    return (
        <View style={styles.container}>
            {/* Fading black background */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backgroundStyle]} />
            
            <PanGestureHandler 
                onGestureEvent={gestureHandler}
                activeOffsetY={[-20, 20]} 
                failOffsetX={[-10, 10]} 
            >
                <Animated.View style={[styles.contentContainer, animatedContainerStyle]}>
                    
                    {/* Close Button */}
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={28} color="#fff" />
                    </Pressable>

                    {/* Horizontal PagerView */}
                    <PagerView
                        ref={pagerRef}
                        style={styles.pager}
                        initialPage={initialIndex}
                        onPageSelected={handlePageScroll}
                    >
                        {mediaBlocks.map((item, index) => {
                            const blockType = item.blockType || item.block_type;
                            return (
                                <View key={item.id} style={styles.slide}>
                                    {blockType === 'video' ? (
                                        <View style={styles.mediaContainer}>
                                            <Video
                                                source={{ uri: item.content }}
                                                style={styles.video}
                                                resizeMode="contain"
                                                paused={!isVideoPlaying || currentIndex !== index}
                                                repeat={true}
                                                muted={true}
                                                onLoad={() => {
                                                    if (index === initialIndex) setIsVideoPlaying(true);
                                                }}
                                            />
                                            {/* Unified Touch Layer for Video */}
                                            <Pressable 
                                                style={StyleSheet.absoluteFillObject}
                                                onPress={() => setIsVideoPlaying(!isVideoPlaying)}
                                            />
                                            {!isVideoPlaying && currentIndex === index && (
                                                <View style={styles.playOverlay}>
                                                    <Icon name="play-arrow" size={60} color="rgba(255,255,255,0.8)" />
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.mediaContainer}>
                                            <Image
                                                source={{ uri: item.content }}
                                                style={styles.image}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </PagerView>

                    {/* Media counter */}
                    {mediaBlocks.length > 1 && (
                        <View style={styles.counterContainer}>
                            <Text style={styles.counterText}>
                                {currentIndex + 1} / {mediaBlocks.length}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { flex: 1, width: SCREEN_WIDTH },
    pager: { flex: 1, width: SCREEN_WIDTH },
    slide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
    mediaContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: { width: '100%', height: '100%' },
    image: { width: '100%', height: '100%' },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    closeButton: {
        position: 'absolute', top: 50, left: 15, zIndex: 10,
        padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    },
    counterContainer: {
        position: 'absolute', top: 50, right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    },
    counterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default GalleryViewer;