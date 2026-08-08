import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { TimelineScreen } from './TimelineScreen';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const routes = [
    { key: 'following', title: 'Following' },
    { key: 'foryou', title: 'For you' },
];

export const HomeScreen = ({ visible, onOpenSidebar, sidebarOffset }) => {
    const windowWidth = Dimensions.get('window').width;

    const [tabIndex, setTabIndex] = useState(1);

    const pagerX = useSharedValue(-tabIndex * windowWidth);
    const startX = useSharedValue(0);
    const maxPagerOffset = -(routes.length - 1) * windowWidth;

    const toggleSidebar = () => onOpenSidebar();

    const goToTab = (index) => {
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
        <View style={{ flex: 1 }}>
            <View style={styles.header}>
                <Pressable
                    android_disableSound={true}
                    onPress={toggleSidebar}
                    style={({ pressed }) => [styles.hamburgerButtonContainer, { opacity: pressed ? 0.5 : 1.0 }]}
                >
                    <Image style={styles.hamburgerButton} source={require('../icons/burger-menu.png')} />
                </Pressable>
            </View>

            <View style={styles.tabsContainer}>
                {routes.map((tab, index) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, tabIndex === index && styles.selectedTab]}
                        onPress={() => goToTab(index)}
                    >
                        <Text>{tab.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ flex: 1, overflow: 'hidden' }}>
                <GestureDetector gesture={pan}>
                    <Animated.View style={[{ flex: 1, flexDirection: 'row', width: windowWidth * routes.length }, pagerStyle]}>
                        {routes.map((tab) => (
                            <View key={tab.key} style={{ width: windowWidth }}>
                                <TimelineScreen tabType={tab.key} />
                            </View>
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header:{
        marginTop: 0,
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: 50
    },
    tabsContainer: {
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'row'
    },
    tab: {
        padding: 10,
        paddingBottom: 5,
        paddingTop: 5
    },
    selectedTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#00e5ffff'
    },
    hamburgerButton: {
        padding: 10,
        width: 32,
        height: 32,
        borderRadius: 50
    },
    hamburgerButtonContainer: {
        margin: 'auto',
        marginRight: 20,
        width: 32,
        height: 32
    },
});

export default HomeScreen;