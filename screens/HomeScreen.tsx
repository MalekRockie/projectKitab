import React, { useMemo, useState } from 'react';
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

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.surface}
            />
            
            <View style={styles.header}>
                <Pressable
                    android_disableSound={true}
                    onPress={toggleSidebar}
                    style={({ pressed }) => [styles.hamburgerButtonContainer, { opacity: pressed ? 0.5 : 1.0 }]}
                >
                    {/* Added tintColor assuming your icon is a monochrome template image */}
                    <Image 
                        style={[styles.hamburgerButton, { tintColor: colors.text }]} 
                        source={require('../icons/burger-menu.png')} 
                    />
                </Pressable>
            </View>

            <View style={styles.tabsContainer}>
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
            </View>

            <View style={{ flex: 1, overflow: 'hidden' }}>
                <GestureDetector gesture={pan}>
                    <Animated.View style={[{ flex: 1, flexDirection: 'row', width: windowWidth * routes.length }, pagerStyle]}>
                        {routes.map((tab) => (
                            <View key={tab.key} style={{ width: windowWidth, backgroundColor: colors.background }}>
                                <TimelineScreen tabType={tab.key} />
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
        marginTop: 50,
        backgroundColor: colors.surface,
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: 50,
        justifyContent: 'flex-end', // Pushes hamburger to the right
        alignItems: 'center',
    },
    tabsContainer: {
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
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