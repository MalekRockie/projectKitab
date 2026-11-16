import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Dimensions, StyleSheet } from 'react-native';
import { Sidebar } from '../components/sidebar/Sidebar';
import { HomeScreen } from '../screens/HomeScreen';

let mockIsFocused = true;
const mockTimelineUnmount = jest.fn();
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }), useIsFocused: () => mockIsFocused }));
jest.mock('react-native-vector-icons/Entypo', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-reanimated', () => ({
    __esModule: true,
    default: { View: require('react-native').View },
    useSharedValue: (value: number) => require('react').useRef({ value }).current,
    useAnimatedStyle: (callback: () => unknown) => callback(),
    withTiming: (value: number) => value,
    runOnJS: (callback: unknown) => callback,
}));
jest.mock('react-native-gesture-handler', () => ({
    GestureDetector: 'GestureDetector',
    Gesture: {
        Pan: () => {
            const gesture: Record<string, any> = {};
            ['activeOffsetX', 'failOffsetY', 'onBegin', 'onChange', 'onEnd', 'onFinalize'].forEach(name => {
                gesture[name] = (value: unknown) => { gesture[`${name}Value`] = value; return gesture; };
            });
            return gesture;
        },
    },
}));
jest.mock('../theme/useTheme', () => ({ useTheme: () => require('../theme/colors').lightColors }));
jest.mock('../components/common/BottomNavigationBar', () => ({ updateNavigationBarScroll: () => ({ distance: 0 }) }));
jest.mock('../screens/TimelineScreen', () => ({
    TimelineScreen: () => {
        require('react').useEffect(() => () => mockTimelineUnmount(), []);
        return require('react').createElement('Timeline');
    },
}));
jest.mock('../services/storage/store/cUserStore', () => ({ useCUserStore: (selector: (state: object) => unknown) => selector({ username: 'test' }) }));
jest.mock('../services/api/auth/auth', () => ({ Logout: jest.fn() }));
jest.mock('../components/MenuButton/DropDownMenu.jsx', () => ({ DropdownMenu: () => null }));

it('passes touches through the wrapper while retaining the open backdrop', async () => {
    const onClose = jest.fn();
    const props = { visible: false, onClose, onOpen: jest.fn(), sidebarOffset: { value: 400 }, onNavigateTab: jest.fn() };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => { renderer = ReactTestRenderer.create(<Sidebar {...props} />); });
    expect(renderer!.root.findAllByProps({ pointerEvents: 'box-none' }).length).toBeGreaterThan(0);
    await act(() => { renderer!.update(<Sidebar {...props} visible />); });
    const backdrop = renderer!.root.findAllByProps({ pointerEvents: 'auto' }).find(node => typeof node.props.onPress === 'function');
    expect(backdrop).toBeDefined();
    await act(() => { backdrop!.props.onPress(); });
    expect(onClose).toHaveBeenCalled();
});

it('swipes between timeline tabs and opens the sidebar beyond the rightmost tab', async () => {
    mockTimelineUnmount.mockClear();
    const onOpenSidebar = jest.fn();
    const width = Dimensions.get('window').width;
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const props = { onOpenSidebar, sidebarOffset: { value: width } as any, onNavigationBarVisibilityChange: jest.fn() };
    await act(() => { renderer = ReactTestRenderer.create(<HomeScreen {...props} />); });
    let detector = renderer!.root.findByType('GestureDetector' as any);
    expect(detector.findByProps({ testID: 'home-swipe-viewport' }).props.collapsable).toBe(false);
    let gesture = detector.props.gesture;
    expect(gesture.failOffsetYValue).toEqual([-5, 5]);
    expect(renderer!.root.findAllByType('Timeline' as any)).toHaveLength(2);
    await act(() => {
        gesture.onBeginValue();
        gesture.onChangeValue({ translationX: width * 0.75 });
        gesture.onEndValue({ velocityX: 0 });
    });
    const following = renderer!.root.findAllByProps({ children: 'Following' }).find(node => node.props.style);
    expect(StyleSheet.flatten(following!.props.style).fontWeight).toBe('600');
    await act(() => { mockIsFocused = false; renderer!.update(<HomeScreen {...props} />); });
    await act(() => { mockIsFocused = true; renderer!.update(<HomeScreen {...props} />); });
    expect(mockTimelineUnmount).not.toHaveBeenCalled();
    const retainedFollowing = renderer!.root.findAllByProps({ children: 'Following' }).find(node => node.props.style);
    expect(StyleSheet.flatten(retainedFollowing!.props.style).fontWeight).toBe('600');
    detector = renderer!.root.findByType('GestureDetector' as any);
    expect(detector.props.gesture).toBe(gesture);
    gesture = detector.props.gesture;
    await act(() => {
        gesture.onBeginValue();
        gesture.onChangeValue({ translationX: -width * 0.75 });
        gesture.onEndValue({ velocityX: 0 });
    });
    await act(() => {
        gesture.onBeginValue();
        gesture.onChangeValue({ translationX: -width * 0.7 });
        gesture.onEndValue({ velocityX: 0 });
    });
    expect(onOpenSidebar).toHaveBeenCalledTimes(1);
    await act(() => { renderer!.unmount(); });
});
