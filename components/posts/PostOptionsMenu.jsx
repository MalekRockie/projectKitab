import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCUserStore } from '../../services/storage/store/cUserStore';
import { useTheme } from '../../theme/useTheme';

const PostOptionsMenu = ({ post, style }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const currentUserId = useCUserStore(state => state.userId);
    const sheetHeight = Math.min(height - insets.top - 12, 430);
    const translateY = useSharedValue(sheetHeight);
    const dragStart = useSharedValue(0);
    const [visible, setVisible] = useState(false);

    const authorId = post?.userId ?? post?.user_id ?? post?.user?.id ?? post?.user?.user_id;
    const isOwnPost = Boolean(currentUserId && authorId && String(currentUserId) === String(authorId));
    const actions = isOwnPost
        ? [
            { label: 'Edit post', icon: 'edit' },
            { label: 'Pin to profile', icon: 'push-pin' },
            { label: 'Copy link', icon: 'link' },
            { label: 'Delete post', icon: 'delete', destructive: true },
        ]
        : [
            { label: 'Save post', icon: 'bookmark-border' },
            { label: 'Copy link', icon: 'link' },
            { label: 'Not interested', icon: 'visibility-off' },
            { label: 'Block user', icon: 'block' },
            { label: 'Mute user', icon: 'volume-off' },
            { label: 'Report post', icon: 'outlined-flag', destructive: true },
        ];

    useEffect(() => {
        if (visible) {
            translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
        }
    }, [translateY, visible]);

    const finishDismiss = useCallback(() => setVisible(false), []);
    const dismiss = useCallback(() => {
        translateY.value = withTiming(sheetHeight, { duration: 220, easing: Easing.in(Easing.cubic) }, finished => {
            if (finished) {
                runOnJS(finishDismiss)();
            }
        });
    }, [finishDismiss, sheetHeight, translateY]);

    const pan = Gesture.Pan()
        .onStart(() => {
            dragStart.value = translateY.value;
        })
        .onUpdate(event => {
            translateY.value = Math.max(0, dragStart.value + event.translationY);
        })
        .onEnd(event => {
            if (translateY.value > sheetHeight * 0.22 || event.velocityY > 900) {
                translateY.value = withTiming(sheetHeight, { duration: 220 }, finished => {
                    if (finished) {
                        runOnJS(finishDismiss)();
                    }
                });
            } else {
                translateY.value = withTiming(0, { duration: 180 });
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [0, sheetHeight], [1, 0]),
    }));

    return (
        <>
            <Pressable
                onPress={event => {
                    event.stopPropagation();
                    setVisible(true);
                }}
                style={({ pressed }) => [styles.trigger, style, pressed && styles.triggerPressed]}
                accessibilityRole="button"
                accessibilityLabel="Post options"
                hitSlop={6}
            >
                <Icon name="more-vert" size={22} color={colors.textSecondary} />
            </Pressable>
            <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Animated.View style={[styles.backdrop, backdropStyle]}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={dismiss}
                            accessibilityRole="button"
                            accessibilityLabel="Close post options"
                        />
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.sheet,
                            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 20) },
                            sheetStyle,
                        ]}
                    >
                        <GestureDetector gesture={pan}>
                            <View>
                                <Pressable
                                    onPress={dismiss}
                                    style={styles.handleArea}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close post options"
                                >
                                    <View style={styles.handle} />
                                </Pressable>
                            </View>
                        </GestureDetector>
                        {/* <View style={styles.header}>
                            <Text style={styles.title}>Post options</Text>
                            <Text style={styles.subtitle}>{isOwnPost ? 'Your post' : 'Post by another user'}</Text>
                        </View> */}
                        <View style={styles.actionList}>
                            {actions.map(action => (
                                <Pressable
                                    key={action.label}
                                    onPress={dismiss}
                                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                                    accessibilityRole="button"
                                >
                                    <Icon
                                        name={action.icon}
                                        size={21}
                                        color={action.destructive ? colors.danger : colors.textSecondary}
                                    />
                                    <Text style={[styles.actionText, action.destructive && styles.destructiveText]}>
                                        {action.label}
                                    </Text>
                                    <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const createStyles = colors => StyleSheet.create({
    trigger: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
    },
    triggerPressed: {
        backgroundColor: colors.iconBg,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        elevation: 24,
    },
    handleArea: {
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.divider,
    },
    header: {
        paddingHorizontal: 22,
        paddingTop: 6,
        paddingBottom: 15,
    },
    title: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 4,
    },
    actionList: {
        paddingHorizontal: 18,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 58,
        gap: 14,
        // borderTopWidth: StyleSheet.hairlineWidth,
        // borderTopColor: colors.divider,
    },
    actionPressed: {
        backgroundColor: colors.iconBg,
    },
    actionText: {
        flex: 1,
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
    destructiveText: {
        color: colors.danger,
    },
});

export default PostOptionsMenu;
