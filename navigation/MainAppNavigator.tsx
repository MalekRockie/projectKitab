import React, { useCallback, useEffect, useRef, useState } from "react";
import { ProfileScreen } from "../screens/profileScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { PostScreen } from "../screens/PostScreen";
import SettingsScreen from "../screens/SettingsScreen"
import AccountSettingsScreen from "../screens/AccountSettingsScreen";
import ThemeSettingsScreen from "../screens/ThemeSettingsScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import BookmarkFolderScreen from "../screens/BookmarkFolderScreen";
import { View, Dimensions, Keyboard, Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useNavigationState, useRoute } from '@react-navigation/native';
import { Sidebar } from "../components/sidebar/Sidebar";
import BottomNavigationBar from '../components/common/BottomNavigationBar';
import { CommentComposer } from "../screens/CommentComposerScreen";
import { CommentFocusScreen } from "../screens/CommentFocusScreen";
import MessagesScreen from "../screens/MessagesScreen";
import { useSharedValue } from "react-native-reanimated";
import { useSettingsSync } from "../services/sync/useSettingsSync";
import { getMainTabActions, MainTab } from './mainTabNavigation';

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();

function MainAppNavigator() {
    useSettingsSync();
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [barVisible, setBarVisible] = useState(true);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [pendingTab, setPendingTab] = useState<MainTab | null>(null);
    const [sidebarTab, setSidebarTab] = useState<MainTab | null>(null);
    const navigation = useNavigation();
    const route = useRoute();
    const mainState = useNavigationState(state => state.routes.find(item => item.key === route.key)?.state);
    const activeRoute = mainState?.routes[mainState.index ?? 0];
    const tabsRoute = mainState?.routes[0]?.name === 'MainTabs' ? mainState.routes[0] : undefined;
    const tabsState = tabsRoute?.state;
    const activeScreen = tabsState?.routes[tabsState.index ?? 0]?.name ?? 'Home';
    const windowWidth = Dimensions.get('window').width;

    const sidebarOffset = useSharedValue(windowWidth);
    const openSidebar = useCallback(() => setSidebarVisible(true), []);

    useEffect(() => {
        setBarVisible(true);
    }, [activeScreen]);

    useEffect(() => {
        const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
        return () => { show.remove(); hide.remove(); };
    }, []);

    const switchTab = (screen: MainTab) => {
        getMainTabActions(screen, mainState?.key, tabsState?.key, activeRoute?.name)
            .forEach(action => navigation.dispatch(action));
    };
    const switchTabRef = useRef(switchTab);
    switchTabRef.current = switchTab;

    useEffect(() => {
        if (!pendingTab) return;
        switchTabRef.current(pendingTab);
        const frame = requestAnimationFrame(() => setPendingTab(null));
        return () => cancelAnimationFrame(frame);
    }, [pendingTab]);

    useEffect(() => {
        if (!sidebarTab) return;
        switchTabRef.current(sidebarTab);
        const timer = setTimeout(() => setSidebarTab(null), 500);
        return () => clearTimeout(timer);
    }, [sidebarTab]);

    return (
        <View style={{ flex: 1 }}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: pendingTab ? 'none' : 'slide_from_right',
                    gestureEnabled: false,
                }}
            >
                <Stack.Screen name="MainTabs">
                    {() => (
                        <View style={{ flex: 1 }}>
                            <Tabs.Navigator screenOptions={{ headerShown: false, animation: sidebarTab ? 'shift' : 'none', freezeOnBlur: false }} detachInactiveScreens tabBar={() => null}>
                                <Tabs.Screen name="Home">
                                    {props => <HomeScreen {...props} onOpenSidebar={openSidebar} sidebarOffset={sidebarOffset} onNavigationBarVisibilityChange={setBarVisible} />}
                                </Tabs.Screen>
                                <Tabs.Screen name="Messages">
                                    {props => <MessagesScreen {...props} onOpenSidebar={openSidebar} onNavigationBarVisibilityChange={setBarVisible} bottomBarVisible={barVisible && !keyboardVisible} />}
                                </Tabs.Screen>
                            </Tabs.Navigator>
                            <BottomNavigationBar
                                activeScreen={activeScreen}
                                visible={barVisible && !keyboardVisible}
                                onNavigate={screen => {
                                    setSidebarTab(null);
                                    setPendingTab(screen);
                                }}
                            />
                        </View>
                    )}
                </Stack.Screen>
                <Stack.Screen name={"Profile"} component={ProfileScreen}/>
                <Stack.Screen name={"PostScreen"} component={PostScreen} />
                <Stack.Screen
                    name={"CommentScreen"} component={CommentFocusScreen}
                    options={{ animation: pendingTab ? 'none' : 'slide_from_right' }}/>
                <Stack.Screen
                    name={"CommentComposerScreen"}
                    options={{ animation: pendingTab ? 'none' : 'slide_from_bottom' }}
                    component={CommentComposer}/>
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
                <Stack.Screen name="Theme" component={ThemeSettingsScreen} />
                <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
                <Stack.Screen name="BookmarkFolder" component={BookmarkFolderScreen} />
            </Stack.Navigator>

            <Sidebar
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                onOpen={() => setSidebarVisible(true)}
                sidebarOffset={sidebarOffset}
                onNavigateTab={(screen: MainTab) => {
                    if (screen === activeScreen && activeRoute?.name === 'MainTabs') return;
                    setPendingTab(null);
                    setSidebarTab(screen);
                }}
            />

        </View>
    );
}

export default MainAppNavigator;