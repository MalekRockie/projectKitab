import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainAppNavigator from '../navigation/MainAppNavigator';
import BottomNavigationBar from '../components/common/BottomNavigationBar';
import { Sidebar } from '../components/sidebar/Sidebar';

const mockTabOptions = jest.fn();

jest.mock('@react-navigation/stack', () => {
    const ReactModule = require('react');
    const { View } = require('react-native');
    const { createNavigatorFactory, StackRouter, useNavigationBuilder } = require('@react-navigation/native');
    const Navigator = (props: object) => {
        const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
        return ReactModule.createElement(NavigationContent, null, state.routes.map((route: { key: string; name: string }, index: number) =>
            ReactModule.createElement(View, { key: route.key, testID: `tab-${route.name}`, style: { display: index === state.index ? 'flex' : 'none' } }, descriptors[route.key].render()),
        ));
    };
    return { createStackNavigator: createNavigatorFactory(Navigator) };
});
jest.mock('@react-navigation/bottom-tabs', () => {
    const ReactModule = require('react');
    const { View } = require('react-native');
    const { createNavigatorFactory, TabRouter, useNavigationBuilder } = require('@react-navigation/native');
    const Navigator = (props: object) => {
        mockTabOptions(props);
        const { state, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, props);
        return ReactModule.createElement(NavigationContent, null, state.routes.map((route: { key: string; name: string }, index: number) =>
            ReactModule.createElement(View, { key: route.key, testID: `tab-${route.name}`, style: { display: index === state.index ? 'flex' : 'none' } }, descriptors[route.key].render()),
        ));
    };
    return { createBottomTabNavigator: createNavigatorFactory(Navigator) };
});
jest.mock('react-native-reanimated', () => ({ useSharedValue: (value: number) => require('react').useRef({ value }).current }));
jest.mock('../services/sync/useSettingsSync', () => ({ useSettingsSync: () => {} }));
jest.mock('../theme/useTheme', () => ({ useTheme: () => require('../theme/colors').darkColors }));
jest.mock('../components/sidebar/Sidebar', () => ({
    Sidebar: ({ onNavigateTab }: { onNavigateTab: (screen: string) => void }) =>
        require('react').createElement(require('react-native').Pressable, { accessibilityLabel: 'Sidebar Messages', onPress: () => onNavigateTab('Messages') }),
}));
jest.mock('../components/common/BottomNavigationBar', () => ({ onNavigate }: { onNavigate: (screen: string) => void }) =>
    require('react').createElement(require('react-native').View, null,
        require('react').createElement(require('react-native').Pressable, { accessibilityLabel: 'Home tab', onPress: () => onNavigate('Home') }),
        require('react').createElement(require('react-native').Pressable, { accessibilityLabel: 'Messages tab', onPress: () => onNavigate('Messages') }),
    ),
);
jest.mock('../screens/HomeScreen', () => ({
    HomeScreen: ({ navigation, onNavigationBarVisibilityChange }: { navigation: { navigate: (name: string) => void }; onNavigationBarVisibilityChange: (visible: boolean) => void }) => {
        const ReactModule = require('react');
        const { View, Pressable, Text } = require('react-native');
        const [count, setCount] = ReactModule.useState(0);
        return ReactModule.createElement(View, null,
            ReactModule.createElement(Pressable, { accessibilityLabel: 'Open profile', onPress: () => navigation.navigate('Profile') }),
            ...['PostScreen', 'CommentScreen', 'CommentComposerScreen', 'Settings', 'AccountSettings', 'Theme', 'Bookmarks', 'BookmarkFolder'].map(screen =>
                ReactModule.createElement(Pressable, { key: screen, accessibilityLabel: `Open ${screen}`, onPress: () => navigation.navigate(screen) }),
            ),
            ReactModule.createElement(Pressable, { accessibilityLabel: 'Hide bottom bar', onPress: () => onNavigationBarVisibilityChange(false) }),
            ReactModule.createElement(Pressable, { accessibilityLabel: 'Change Home state', onPress: () => setCount((value: number) => value + 1) }, ReactModule.createElement(Text, null, `Home state: ${count}`)),
        );
    },
}));
jest.mock('../screens/MessagesScreen', () => ({ navigation }: { navigation: { navigate: (name: string) => void } }) =>
    require('react').createElement(require('react-native').Pressable, { accessibilityLabel: 'Open profile from Messages', onPress: () => navigation.navigate('Profile') }),
);
jest.mock('../screens/profileScreen', () => ({
    ProfileScreen: ({ navigation }: { navigation: { goBack: () => void } }) =>
        require('react').createElement(require('react-native').Pressable, { accessibilityLabel: 'Back from profile', onPress: () => navigation.goBack() }),
}));
jest.mock('../screens/PostScreen', () => ({ PostScreen: () => null }));
jest.mock('../screens/SettingsScreen', () => () => null);
jest.mock('../screens/AccountSettingsScreen', () => () => null);
jest.mock('../screens/ThemeSettingsScreen', () => () => null);
jest.mock('../screens/BookmarksScreen', () => () => null);
jest.mock('../screens/BookmarkFolderScreen', () => () => null);
jest.mock('../screens/CommentComposerScreen', () => ({ CommentComposer: () => null }));
jest.mock('../screens/CommentFocusScreen', () => ({ CommentFocusScreen: () => null }));

it('opens Messages from the bottom bar on the first attempt', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    expect(mockTabOptions).toHaveBeenLastCalledWith(expect.objectContaining({
        detachInactiveScreens: true,
        screenOptions: expect.objectContaining({ freezeOnBlur: false, sceneStyle: { backgroundColor: '#000000' } }),
    }));
    expect(renderer!.root.findByType(BottomNavigationBar).parent!.props.style.backgroundColor).toBe('#000000');
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Messages tab' }).props.onPress(); });
    expect(renderer!.root.findAllByProps({ testID: 'tab-Messages' }).some(node => node.props.style?.display === 'flex')).toBe(true);
    await act(() => { renderer!.unmount(); });
});

it('keeps the bottom bar visible beneath the sidebar when it opens', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    const sidebar = renderer!.root.findByType(Sidebar);
    const bar = renderer!.root.findByType(BottomNavigationBar);
    let barAncestor = bar;
    while (barAncestor.parent && barAncestor.parent !== sidebar.parent) barAncestor = barAncestor.parent;
    expect(barAncestor.parent).toBe(sidebar.parent);
    expect(sidebar.parent!.children.indexOf(barAncestor)).toBeLessThan(sidebar.parent!.children.indexOf(sidebar));
    expect(bar.props.visible).toBe(true);
    await act(() => { sidebar.props.onOpen(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(true);
    await act(() => { sidebar.props.onClose(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(true);
    await act(() => { renderer!.unmount(); });
});

it('opens Messages from the sidebar on the first attempt', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Sidebar Messages' }).props.onPress(); });
    expect(renderer!.root.findAllByProps({ testID: 'tab-Messages' }).some(node => node.props.style?.display === 'flex')).toBe(true);
    await act(() => { renderer!.unmount(); });
});

it('opens Messages after visiting and returning from a profile', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Open profile' }).props.onPress(); });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Back from profile' }).props.onPress(); });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Messages tab' }).props.onPress(); });
    expect(renderer!.root.findAllByProps({ testID: 'tab-Messages' }).some(node => node.props.style?.display === 'flex')).toBe(true);
    await act(() => { renderer!.unmount(); });
});

it.each([
    ['Profile', 'Open profile'],
    ...['PostScreen', 'CommentScreen', 'CommentComposerScreen', 'Settings', 'AccountSettings', 'Theme', 'Bookmarks', 'BookmarkFolder'].map(screen => [screen, `Open ${screen}`]),
])('keeps the bottom bar on the previous screen when opening %s', async (screen, label) => {
    const RootStack = createStackNavigator();
    const navigationRef = createNavigationContainerRef();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer ref={navigationRef}>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(true);
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: label }).props.onPress(); });
    const tabsScene = renderer!.root.findByProps({ testID: 'tab-MainTabs' });
    const detailScene = renderer!.root.findByProps({ testID: `tab-${screen}` });
    expect(tabsScene.findByType(BottomNavigationBar).props.visible).toBe(true);
    expect(tabsScene.props.style.display).toBe('none');
    expect(detailScene.props.style.display).toBe('flex');
    expect(detailScene.findAllByType(BottomNavigationBar)).toHaveLength(0);
    await act(() => { navigationRef.goBack(); });
    expect(renderer!.root.findByProps({ testID: 'tab-MainTabs' }).props.style.display).toBe('flex');
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(true);
    await act(() => { renderer!.unmount(); });
});

it('restores the bottom bar on Messages after returning from a profile', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Messages tab' }).props.onPress(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(true);
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Open profile from Messages' }).props.onPress(); });
    expect(renderer!.root.findByProps({ testID: 'tab-MainTabs' }).findByType(BottomNavigationBar).props).toMatchObject({ visible: true, activeScreen: 'Messages' });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Back from profile' }).props.onPress(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(true);
    expect(renderer!.root.findAllByProps({ testID: 'tab-Messages' }).some(node => node.props.style?.display === 'flex')).toBe(true);
    await act(() => { renderer!.unmount(); });
});

it('preserves a scroll-hidden bottom bar when opening and closing a detail screen', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Hide bottom bar' }).props.onPress(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(false);
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Open profile' }).props.onPress(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(false);
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Back from profile' }).props.onPress(); });
    expect(renderer!.root.findByType(BottomNavigationBar).props.visible).toBe(false);
    await act(() => { renderer!.unmount(); });
});

it('preserves Home state when returning from Messages', async () => {
    const RootStack = createStackNavigator();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
        renderer = ReactTestRenderer.create(
            <NavigationContainer>
                <RootStack.Navigator><RootStack.Screen name="MainApp" component={MainAppNavigator} /></RootStack.Navigator>
            </NavigationContainer>,
        );
    });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Change Home state' }).props.onPress(); });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Messages tab' }).props.onPress(); });
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Home tab' }).props.onPress(); });
    expect(renderer!.root.findAllByProps({ testID: 'tab-Home' }).some(node => node.props.style?.display === 'flex')).toBe(true);
    expect(renderer!.root.findAllByProps({ children: 'Home state: 1' }).length).toBeGreaterThan(0);
    await act(() => { renderer!.unmount(); });
});
