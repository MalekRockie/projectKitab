import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { CircleProfile } from './circleProfile';

type CircleProfileSheetProps = {
    profile: CircleProfile;
    circleName: string;
    onClose: () => void;
    onEditProfile: () => void;
};

const OPEN_MS = 280;
const CLOSE_MS = 220;
const formatDate = (date: Date) => date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });

// Bottom sheet that covers nearly the whole screen. Close it by dragging the top
// area (grab handle, banner and avatar) down, tapping the handle, or tapping the dimmed edge.
export default function CircleProfileSheet({ profile, circleName, onClose, onEditProfile }: CircleProfileSheetProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const sheetHeight = height - insets.top - 28;
    const translateY = useSharedValue(sheetHeight);
    const dragStart = useSharedValue(0);

    useEffect(() => {
        translateY.value = withTiming(0, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
    }, [translateY]);

    const dismiss = useCallback(() => {
        translateY.value = withTiming(sheetHeight, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) }, finished => {
            if (finished) {
                runOnJS(onClose)();
            }
        });
    }, [onClose, sheetHeight, translateY]);

    const pan = Gesture.Pan()
        .onStart(() => { dragStart.value = translateY.value; })
        .onUpdate(event => { translateY.value = Math.max(0, dragStart.value + event.translationY); })
        .onEnd(event => {
            if (translateY.value > sheetHeight * 0.25 || event.velocityY > 900) {
                translateY.value = withTiming(sheetHeight, { duration: CLOSE_MS, easing: Easing.out(Easing.cubic) }, finished => {
                    if (finished) {
                        runOnJS(onClose)();
                    }
                });
            } else {
                translateY.value = withTiming(0, { duration: 180 });
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateY.value, [0, sheetHeight], [1, 0]) }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close profile" />
            </Animated.View>
            <Animated.View style={[styles.sheet, { height: sheetHeight, bottom: -insets.bottom }, sheetStyle]}>
                <GestureDetector gesture={pan}>
                    <View>
                        <Pressable onPress={dismiss} style={styles.handleArea} accessibilityRole="button" accessibilityLabel="Close profile">
                            <View style={styles.handle} />
                        </Pressable>
                        <View style={[styles.banner, { backgroundColor: profile.color }]}>
                            <View style={styles.bannerShade} />
                        </View>
                        <View style={styles.avatarRow}>
                            <View style={[styles.avatar, { backgroundColor: profile.color }]}>
                                <Text style={styles.avatarText}>{profile.initials}</Text>
                            </View>
                        </View>
                    </View>
                </GestureDetector>
                <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{profile.name}</Text>
                        <Text style={styles.username}>@{profile.username}</Text>
                    </View>
                    {profile.isOwn ? (
                        <Pressable onPress={onEditProfile} style={styles.editButton} accessibilityRole="button">
                            <Icon name="edit" size={16} color="#FFFFFF" />
                            <Text style={styles.editText}>Edit my circle profile</Text>
                        </Pressable>
                    ) : null}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={styles.cardIcon}><Icon name="event-available" size={18} color={colors.accent} /></View>
                            <View style={styles.cardCopy}>
                                <Text style={styles.cardLabel}>JOINED THE APP</Text>
                                <Text style={styles.cardValue}>{formatDate(profile.joinedApp)}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.cardRow}>
                            <View style={styles.cardIcon}><Icon name="group-add" size={18} color={colors.accent} /></View>
                            <View style={styles.cardCopy}>
                                <Text style={styles.cardLabel}>JOINED {circleName.toUpperCase()}</Text>
                                <Text style={styles.cardValue}>{formatDate(profile.joinedCircle)}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const AVATAR = 88;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.background, overflow: 'hidden', elevation: 24 },
    handleArea: { position: 'absolute', top: 0, left: 0, right: 0, height: 28, zIndex: 2, alignItems: 'center', justifyContent: 'center' },
    handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' },
    banner: { height: 150 },
    bannerShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
    avatarRow: { paddingHorizontal: 10, marginTop: -AVATAR / 2, height: AVATAR / 2 + 6 },
    avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: colors.background },
    avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
    body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    profileInfo: { marginTop: 40},
    name: { color: colors.text, fontSize: 24, fontWeight: '800' },
    username: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
    editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, marginTop: 16, borderRadius: 14, backgroundColor: colors.accent },
    editText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    card: { marginTop: 20, borderRadius: 16, backgroundColor: colors.surface, paddingVertical: 4 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    cardIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center' },
    cardCopy: { flex: 1 },
    cardLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    cardValue: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
    divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14, backgroundColor: colors.divider },
});
