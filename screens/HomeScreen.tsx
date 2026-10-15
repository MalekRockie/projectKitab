import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable, Dimensions, StatusBar } from 'react-native';
import { TimelineScreen } from './TimelineScreen';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../theme/useTheme';
import { ThemeColors, darkColors } from '../theme/colors';

const routes = [
    { key: 'following', title: 'Following' },
    { key: 'foryou', title: 'For you' },
];
const TAB_BAR_HEIGHT = 40;
const HEADER_BAR_HEIGHT = 50;
const STATUS_BAR_HEIGHT = 50;
const STATUS_BAR_COLLAPSE_START = TAB_BAR_HEIGHT + HEADER_BAR_HEIGHT;
const CHROME_COLLAPSE_HEIGHT = STATUS_BAR_COLLAPSE_START + STATUS_BAR_HEIGHT;
const SHOW_SCROLL_THRESHOLD = 20;

interface HomeScreenProps {
    onOpenSidebar: () => void;
    sidebarOffset: SharedValue<number>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenSidebar, sidebarOffset }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const isDark = colors === darkColors;
    
    const windowWidth = Dimensions.get('window').width;

    const [tabIndex, setTabIndex] = useState(1);
    const [isStatusBarHidden, setIsStatusBarHidden] = useState(false);
    const activeFeedKey = useRef(routes[tabIndex].key);
    const lastScrollY = useRef<number | null>(null);
    const upwardDistance = useRef(0);
    const isRevealingChrome = useRef(false);
    const statusBarHidden = useRef(false);
    const chromeCollapse = useSharedValue(0);

    const pagerX = useSharedValue(-tabIndex * windowWidth);
    const startX = useSharedValue(0);
    const maxPagerOffset = -(routes.length - 1) * windowWidth;

    const toggleSidebar = () => onOpenSidebar();

    const goToTab = (index: number) => {
        pagerX.value = withTiming(-index * windowWidth);
        setTabIndex(index);
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .onBegin(() => {
            startX.value = pagerX.value;
        })
        .onChange((event) => {
            const proposed = startX.value + event.translationX;

            if (proposed < maxPagerOffset) {
                pagerX.value = maxPagerOffset;
                const overflow = maxPagerOffset - proposed;
                sidebarOffset.value = Math.min(Math.max(windowWidth - overflow, 0), windowWidth);
            } else if (proposed > 0) {
                pagerX.value = proposed * 0.3;
                sidebarOffset.value = windowWidth;
            } else {
                pagerX.value = proposed;
                sidebarOffset.value = windowWidth;
            }
        })
        .onEnd((event) => {
            if (sidebarOffset.value < windowWidth) {
                const openedFarEnough = sidebarOffset.value < windowWidth * 0.6;
                const flungOpen = event.velocityX < -600;
                if (openedFarEnough || flungOpen) {
                    runOnJS(onOpenSidebar)();
                } else {
                    sidebarOffset.value = withTiming(windowWidth);
                }
            }

            const raw = -pagerX.value / windowWidth;
            let nextIndex = Math.round(raw);
            if (Math.abs(event.velocityX) > 400) {
                nextIndex = event.velocityX < 0 ? Math.ceil(raw) : Math.floor(raw);
            }
            nextIndex = Math.min(Math.max(nextIndex, 0), routes.length - 1);
            pagerX.value = withTiming(-nextIndex * windowWidth);
            runOnJS(setTabIndex)(nextIndex);
        });

    const pagerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: pagerX.value }],
    }));

    const tabsClipStyle = useAnimatedStyle(() => ({
        height: TAB_BAR_HEIGHT - Math.min(chromeCollapse.value, TAB_BAR_HEIGHT),
    }));

    const tabsContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -Math.min(chromeCollapse.value, TAB_BAR_HEIGHT) }],
    }));

    const headerClipStyle = useAnimatedStyle(() => ({
        height: HEADER_BAR_HEIGHT - Math.max(0, Math.min(chromeCollapse.value - TAB_BAR_HEIGHT, HEADER_BAR_HEIGHT)),
    }));

    const headerContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -Math.max(0, Math.min(chromeCollapse.value - TAB_BAR_HEIGHT, HEADER_BAR_HEIGHT)) }],
    }));

    const statusBarInsetStyle = useAnimatedStyle(() => {
        const insetCollapse = Math.max(0, Math.min(chromeCollapse.value - STATUS_BAR_COLLAPSE_START, STATUS_BAR_HEIGHT));
        return { height: STATUS_BAR_HEIGHT - insetCollapse };
    });

    const updateChromeCollapse = (nextCollapse: number) => {
        const clampedCollapse = Math.max(0, Math.min(CHROME_COLLAPSE_HEIGHT, nextCollapse));
        chromeCollapse.value = clampedCollapse;
        const shouldHideStatusBar = clampedCollapse >= STATUS_BAR_COLLAPSE_START;
        if (statusBarHidden.current !== shouldHideStatusBar) {
            statusBarHidden.current = shouldHideStatusBar;
            setIsStatusBarHidden(shouldHideStatusBar);
        }
    };

    const handleTimelineScroll = (offsetY: number, feedKey: string, isActive: boolean) => {
        if (!isActive) return;
        if (activeFeedKey.current !== feedKey) {
            activeFeedKey.current = feedKey;
            lastScrollY.current = offsetY;
            upwardDistance.current = 0;
            isRevealingChrome.current = false;
            return;
        }
        if (lastScrollY.current === null || offsetY <= 0) {
            lastScrollY.current = Math.max(0, offsetY);
            upwardDistance.current = 0;
            isRevealingChrome.current = false;
            if (offsetY <= 0) updateChromeCollapse(0);
            return;
        }

        const delta = offsetY - lastScrollY.current;
        lastScrollY.current = offsetY;
        if (Math.abs(delta) < 1) return;

        if (delta > 0) {
            upwardDistance.current = 0;
            isRevealingChrome.current = false;
            updateChromeCollapse(chromeCollapse.value + delta);
        } else {
            const upwardDelta = -delta;
            if (!isRevealingChrome.current) {
                upwardDistance.current += upwardDelta;
                if (upwardDistance.current < SHOW_SCROLL_THRESHOLD) return;
                isRevealingChrome.current = true;
                updateChromeCollapse(chromeCollapse.value - (upwardDistance.current - SHOW_SCROLL_THRESHOLD));
                upwardDistance.current = SHOW_SCROLL_THRESHOLD;
                return;
            }
            updateChromeCollapse(chromeCollapse.value - upwardDelta);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar
                hidden={isStatusBarHidden}
                animated
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.surface}
            />

            <Animated.View style={[styles.statusBarInset, statusBarInsetStyle]} />
            <Animated.View style={[styles.headerClip, headerClipStyle]}>
                <Animated.View style={[styles.header, headerContentStyle]}>
                    <Pressable
                        android_disableSound={true}
                        onPress={toggleSidebar}
                        style={({ pressed }) => [styles.hamburgerButtonContainer, { opacity: pressed ? 0.5 : 1.0 }]}
                    >
                        <Image
                            style={[styles.hamburgerButton, { tintColor: colors.text }]}
                            source={require('../icons/burger-menu.png')}
                        />
                    </Pressable>
                </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.tabsClip, tabsClipStyle]}>
                <Animated.View style={[styles.tabsContainer, tabsContentStyle]}>
                    {routes.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, tabIndex === index && styles.selectedTab]}
                            onPress={() => goToTab(index)}
                        >
                            <Text style={[styles.tabText, tabIndex === index && styles.selectedTabText]}>
                                {tab.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            </Animated.View>

            <View style={{ flex: 1, overflow: 'hidden' }}>
                <GestureDetector gesture={pan}>
                    <Animated.View style={[{ flex: 1, flexDirection: 'row', width: windowWidth * routes.length }, pagerStyle]}>
                        {routes.map((tab, index) => (
                            <View key={tab.key} style={{ width: windowWidth, backgroundColor: colors.background }}>
                                <TimelineScreen
                                    tabType={tab.key}
                                    isActive={tabIndex === index}
                                    onTimelineScroll={handleTimelineScroll}
                                />
                            </View>
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    header: {
        backgroundColor: colors.surface,
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: HEADER_BAR_HEIGHT,
        justifyContent: 'flex-end', // Pushes hamburger to the right
        alignItems: 'center',
    },
    headerClip: {
        overflow: 'hidden',
    },
    statusBarInset: {
        height: STATUS_BAR_HEIGHT,
    },
    tabsContainer: {
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        height: TAB_BAR_HEIGHT,
    },
    tabsClip: {
        overflow: 'hidden',
    },
    tab: {
        padding: 10,
        paddingBottom: 8,
        paddingTop: 8,
    }, 
    selectedTab: {
        borderBottomWidth: 2,
        // Replaced hardcoded '#00e5ffff' with theme text color. 
        // If you add a 'primary' brand color to your theme later, use that here!
        borderBottomColor: colors.text, 
    },
    tabText: {
        color: colors.textSecondary,
        fontWeight: '500',
    },
    selectedTabText: {
        color: colors.text,
        fontWeight: '600',
    },
    hamburgerButton: {
        width: 24,
        height: 24,
        // tintColor is applied inline inside the JSX
    },
    hamburgerButtonContainer: {
        marginRight: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;