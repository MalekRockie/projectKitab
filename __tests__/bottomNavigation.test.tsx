import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import BottomNavigationBar, { updateNavigationBarScroll } from '../components/common/BottomNavigationBar';

jest.mock('../theme/useTheme', () => ({ useTheme: () => require('../theme/colors').lightColors }));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 20 }) }));
jest.mock('react-native-reanimated', () => ({
    __esModule: true,
    default: { View: require('react-native').View },
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useSharedValue: (value: number) => require('react').useRef({ value }).current,
    withTiming: (value: number) => value,
}));

it('navigates to available screens and marks unfinished destinations unavailable', async () => {
    const onNavigate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => { renderer = ReactTestRenderer.create(<BottomNavigationBar activeScreen="Home" visible onNavigate={onNavigate} />); });
    expect(renderer!.root.findByProps({ accessibilityLabel: 'Home' }).props.accessibilityState.selected).toBe(true);
    await act(() => { renderer!.root.findByProps({ accessibilityLabel: 'Messages' }).props.onPress(); });
    expect(onNavigate).toHaveBeenCalledWith('Messages');
    for (const label of ['Search', 'Create post', 'Notifications']) {
        expect(renderer!.root.findByProps({ accessibilityLabel: `${label}, unavailable` }).props.disabled).toBe(true);
    }
});

it('changes visibility after short directional scrolls and resets on reversal', () => {
    expect(updateNavigationBarScroll(0, 10)).toEqual({ distance: 10 });
    expect(updateNavigationBarScroll(10, 10)).toEqual({ distance: 0, visible: false });
    expect(updateNavigationBarScroll(10, -8)).toEqual({ distance: -8 });
    expect(updateNavigationBarScroll(-8, -16)).toEqual({ distance: 0, visible: true });
});
