import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

type BottomNavigationBarProps = {
    activeScreen: string;
    visible: boolean;
    onNavigate: (screen: 'Home' | 'Messages') => void;
};

export function updateNavigationBarScroll(distance: number, delta: number): { distance: number; visible?: boolean } {
    if (Math.abs(delta) < 1) {return { distance };}
    const nextDistance = delta > 0 ? Math.max(0, distance) + delta : Math.min(0, distance) + delta;
    if (nextDistance <= -24) {return { distance: 0, visible: true };}
    if (nextDistance >= 20) {return { distance: 0, visible: false };}
    return { distance: nextDistance };
}

const items = [
    { label: 'Home', icon: 'home', screen: 'Home' },
    { label: 'Search', icon: 'search' },
    { label: 'Create post', icon: 'add-box' },
    { label: 'Notifications', icon: 'notifications-none' },
    { label: 'Messages', icon: 'chat-bubble-outline', screen: 'Messages' },
] as const;

export default function BottomNavigationBar({ activeScreen, visible, onNavigate }: BottomNavigationBarProps) {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const height = 56 + insets.bottom;
    const progress = useSharedValue(visible ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(visible ? 1 : 0, { duration: 200 });
    }, [progress, visible]);

    const clipStyle = useAnimatedStyle(() => ({ height: height * progress.value }));
    const barStyle = useAnimatedStyle(() => ({ transform: [{ translateY: height * (1 - progress.value) }] }));

    return (
        <Animated.View style={[styles.clip, clipStyle]} pointerEvents={visible ? 'auto' : 'none'}>
            <Animated.View style={[styles.bar, { height, paddingBottom: insets.bottom }, barStyle]}>
                {items.map(item => {
                    const screen = 'screen' in item ? item.screen : undefined;
                    const selected = screen === activeScreen;
                    return (
                        <Pressable
                            key={item.label}
                            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                            onPress={screen ? () => onNavigate(screen) : undefined}
                            disabled={!screen}
                            accessibilityRole="button"
                            accessibilityLabel={screen ? item.label : `${item.label}, unavailable`}
                            accessibilityState={{ disabled: !screen, selected }}
                        >
                            <View style={[styles.iconWrap, selected && styles.selected]}>
                                <Icon name={item.icon} size={24} color={screen ? colors.text : colors.textSecondary} style={!screen && styles.disabled} />
                            </View>
                        </Pressable>
                    );
                })}
            </Animated.View>
        </Animated.View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    clip: { overflow: 'hidden', backgroundColor: colors.background },
    bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
    item: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
    iconWrap: { width: 46, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    selected: { backgroundColor: colors.iconBg },
    pressed: { opacity: 0.6 },
    disabled: { opacity: 0.45 },
});
