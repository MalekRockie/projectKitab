import React, { useState, useRef } from 'react';
import { 
    View, Text, StyleSheet, Pressable, Dimensions, Modal, StatusBar, Animated, PanResponder 
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomSocialVideoPlayer = ({ block, post, forceFullscreenUI = false, isEmbedded = false}) => {
    const videoRef = useRef(null);
    
    // Core States
    const [isPlaying, setIsPlaying] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Progress & Seek States
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekTime, setSeekTime] = useState(0);
    const [progressBarWidth, setProgressBarWidth] = useState(0);
    
    // Refs to prevent stale closures in PanResponder
    const durationRef = useRef(0);
    const progressBarWidthRef = useRef(0);
    const isSeekingRef = useRef(false);
    const seekTimeRef = useRef(0); 
    
    // Fullscreen Transition States (To prevent video restart)
    const [savedVideoState, setSavedVideoState] = useState({ time: 0, playing: false });
    const [isReadyToPlay, setIsReadyToPlay] = useState(true);
    
    // Accurate container height for tap zones
    const [containerHeight, setContainerHeight] = useState(300); 
    
    // UI Animation for the Play/Pause icon
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Unified variable for UI rendering (true if standalone fullscreen OR embedded in gallery)
    const showFullscreenUI = isFullscreen || forceFullscreenUI;

    // 1. Handle Taps (Inline vs Fullscreen logic)
    const handleVideoTap = (event) => {
        if (isEmbedded) return;
        // If embedded in gallery, just handle standard fullscreen taps (no modal opening)
        if (forceFullscreenUI) {
            const { locationY } = event.nativeEvent;
            const topZone = containerHeight * 0.2;
            const bottomZone = containerHeight * 0.8;

            if (locationY < topZone || locationY > bottomZone) {
                setShowOverlay(prev => !prev);
            } else {
                setIsPlaying(prev => !prev);
                triggerPlayPauseIcon();
            }
            return;
        }

        if (!isFullscreen) {
            // Save state before opening modal to prevent restart
            setSavedVideoState({ time: currentTime, playing: isPlaying });
            setIsReadyToPlay(false); 
            
            StatusBar.setHidden(true);
            setIsFullscreen(true);
            setShowOverlay(true);
            return;
        }

        // In standalone fullscreen mode: Check tap zones
        const { locationY } = event.nativeEvent;
        const topZone = containerHeight * 0.2;
        const bottomZone = containerHeight * 0.8;

        if (locationY < topZone || locationY > bottomZone) {
            setShowOverlay(prev => !prev);
        } else {
            setIsPlaying(prev => !prev);
            triggerPlayPauseIcon();
        }
    };

    const triggerPlayPauseIcon = () => {
        setShowPlayIcon(true);
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.delay(400),
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => setShowPlayIcon(false));
    };

    // 2. PanResponder for the Progress Bar (Fixed for Taps & Drags)
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const x = evt.nativeEvent.locationX;
                if (progressBarWidthRef.current === 0 || durationRef.current === 0) return;
                
                isSeekingRef.current = true;
                setIsSeeking(true);
                
                const newTime = (x / progressBarWidthRef.current) * durationRef.current;
                const clampedTime = Math.max(0, Math.min(newTime, durationRef.current));
                
                seekTimeRef.current = clampedTime;
                setSeekTime(clampedTime);
            },
            onPanResponderMove: (evt) => {
                const x = evt.nativeEvent.locationX;
                if (progressBarWidthRef.current === 0 || durationRef.current === 0) return;
                
                const newTime = (x / progressBarWidthRef.current) * durationRef.current;
                const clampedTime = Math.max(0, Math.min(newTime, durationRef.current));
                
                seekTimeRef.current = clampedTime;
                setSeekTime(clampedTime);
            },
            onPanResponderRelease: () => {
                isSeekingRef.current = false;
                setIsSeeking(false);
                
                if (videoRef.current) {
                    videoRef.current.seek(seekTimeRef.current);
                }
                setCurrentTime(seekTimeRef.current);
            },
            onPanResponderTerminationRequest: () => false, 
        })
    ).current;

    // 3. The Video Component
    const renderVideo = () => (
        <Video
            ref={videoRef}
            source={{ uri: block.content }}
            style={showFullscreenUI ? styles.fullscreenVideo : styles.inlineVideo}
            resizeMode="cover"
            paused={!isPlaying || !isReadyToPlay} 
            muted={true} 
            repeat={true}
            controls={false} 
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            onProgress={(data) => {
                if (!isSeekingRef.current) setCurrentTime(data.currentTime); 
            }}
            onLoad={(data) => {
                const dur = data.duration;
                setDuration(dur);
                durationRef.current = dur; 
                
                if (savedVideoState.time > 0) {
                    if (videoRef.current) {
                        videoRef.current.seek(savedVideoState.time);
                    }
                    setCurrentTime(savedVideoState.time);
                    setIsPlaying(savedVideoState.playing);
                    setSavedVideoState({ time: 0, playing: false }); 
                    setIsReadyToPlay(true); 
                } else {
                    setIsReadyToPlay(true);
                }
            }}
        />
    );

    // 4. The Overlay UI (OP Info - Fullscreen Only)
    const renderOverlay = () => {
        if (!showFullscreenUI) return null;

        return (
            <Animated.View 
                style={[
                    styles.overlayContainer, 
                    { opacity: showOverlay ? 1 : 0 }
                ]}
                pointerEvents={showOverlay ? "box-none" : "none"} 
            >
                <View style={styles.bottomBar} pointerEvents="box-none">
                    <View style={styles.userInfo} pointerEvents="box-none">
                        <View style={styles.avatarPlaceholder} />
                        <View>
                            <Text style={styles.usernameText}>{post?.user?.username || 'username'}</Text>
                            <Text style={styles.captionText} numberOfLines={2}>
                                {post?.caption || 'Check out this video!'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actionButtons} pointerEvents="box-none">
                        <ActionButton icon="favorite-border" label={post?.likesCount || 0} />
                        <ActionButton icon="chat-bubble-outline" label={post?.commentCount || 0} />
                        <ActionButton icon="share" label="Share" />
                    </View>
                </View>
            </Animated.View>
        );
    };

    // 5. Center Play/Pause Indicator
    const renderCenterIcon = () => (
        showPlayIcon && (
            <Animated.View style={[styles.centerIconContainer, { opacity: fadeAnim }]} pointerEvents="none">
                <Icon 
                    name={isPlaying ? "play-arrow" : "pause"} 
                    size={60} 
                    color="rgba(255,255,255,0.8)" 
                />
            </Animated.View>
        )
    );

    // 6. Progress Bar (Seekable via Tap or Drag)
    const renderProgressBar = () => {
        if (!showFullscreenUI || !showOverlay || isEmbedded) return null; 

        const time = isSeeking ? seekTime : currentTime;
        const progressWidth = duration > 0 ? (time / duration) * 100 : 0;

        return (
            <View style={styles.progressBarContainer}>
                <View 
                    style={styles.progressBarInner}
                    onLayout={(e) => {
                        const w = e.nativeEvent.layout.width;
                        setProgressBarWidth(w);
                        progressBarWidthRef.current = w; 
                    }}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
                    </View>
                    <View style={[styles.progressBarThumb, { left: `${progressWidth}%` }]} />
                </View>
            </View>
        );
    };

    // 7. Close Fullscreen Button
    const renderCloseButton = () => {
        // Hide if not in standalone fullscreen, or if embedded in gallery mode
        if (!isFullscreen || !showOverlay || forceFullscreenUI) return null;

        return (
            <Pressable 
                style={styles.closeBtn}
                onPress={() => {
                    setSavedVideoState({ time: currentTime, playing: isPlaying });
                    setIsReadyToPlay(false); 
                    
                    StatusBar.setHidden(false);
                    setIsFullscreen(false);
                }}
            >
                <Icon name="close" size={26} color="#fff" />
            </Pressable>
        );
    };

    // Main Render Logic
    const VideoContent = (
        <View 
            style={showFullscreenUI ? styles.fullscreenContainer : styles.inlineContainer}
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)} 
        >
            {renderVideo()}
            
            {/* CRITICAL: Do not render the transparent Pressable if embedded! 
                If we render it, it will block the outer Gallery's GestureDetector. */}
            {!isEmbedded && (
                <Pressable 
                    style={StyleSheet.absoluteFillObject}
                    onPress={handleVideoTap}
                />
            )}

            {renderOverlay()}
            {renderCenterIcon()}
            {renderProgressBar()}
            {renderCloseButton()}
        </View>
    );

    // ONLY wrap in a Modal if it's the standalone fullscreen mode
    if (isFullscreen && !forceFullscreenUI) {
        return (
            <Modal 
                visible={true} 
                transparent={true} 
                animationType="slide" 
                onRequestClose={() => {
                    StatusBar.setHidden(false);
                    setIsFullscreen(false);
                }}
            >
                <View style={styles.modalBackground}>
                    {VideoContent}
                </View>
            </Modal>
        );
    }

    // Otherwise (including gallery mode), just return the content directly
    return VideoContent;
};

// --- Sub-components ---
const ActionButton = ({ icon, label }) => (
    <Pressable style={styles.actionBtn} onPress={() => console.log(`Pressed ${icon}`)}>
        <Icon name={icon} size={26} color="#fff" />
        <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
);

// --- Styles ---
const styles = StyleSheet.create({
    inlineContainer: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginVertical: 8,
    },
    inlineVideo: {
        width: '100%',
        height: '100%',
    },
    fullscreenContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#000',
    },
    fullscreenVideo: {
        width: '100%',
        height: '100%',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: 16,
        paddingBottom: 40, 
        backgroundColor: 'rgba(0,0,0,0.3)', 
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#555',
        marginRight: 10,
    },
    usernameText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 2,
    },
    captionText: {
        color: '#ddd',
        fontSize: 13,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 20,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 2,
    },
    centerIconContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30, 
        justifyContent: 'center',
    },
    progressBarInner: {
        height: 30, 
        marginHorizontal: 10, 
        justifyContent: 'center', 
        position: 'relative', 
    },
    progressBarTrack: {
        height: 4, 
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    progressBarThumb: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#fff',
        top: 8, 
        marginLeft: -7, 
    },
    closeBtn: {
        position: 'absolute',
        top: 50, 
        left: 15,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    }
});

export default CustomSocialVideoPlayer;