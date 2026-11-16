import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { withTiming } from 'react-native-reanimated';
import BottomNavigationBar, { updateNavigationBarScroll } from '../components/common/BottomNavigationBar';

jest.mock('../theme/useTheme', () => ({ useTheme: () => require('../theme/colors').lightColors }));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 20 }) }));
jest.mock('react-native-reanimated', () => ({
    __esModule: true,
    default: { View: require('react-native').View },
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useSharedValue: (value: number) => require('react').useRef({ value }).current,
    withTiming: jest.fn((value: number) => value),
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

it('keeps the bar covering its clipping container halfway through hiding', async () => {
    const onNavigate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => { renderer = ReactTestRenderer.create(<BottomNavigationBar activeScreen="Home" visible onNavigate={onNavigate} />); });
    jest.mocked(withTiming).mockReturnValueOnce(0.5);
    await act(() => { renderer!.update(<BottomNavigationBar activeScreen="Home" visible={false} onNavigate={onNavigate} />); });
    await act(() => { renderer!.update(<BottomNavigationBar activeScreen="Home" visible={false} onNavigate={onNavigate} />); });

    const container = renderer!.toJSON();
    if (!container || Array.isArray(container)) { throw new Error('Expected a single bottom bar container'); }
    const bar = container.children?.[0];
    if (!bar || typeof bar === 'string') { throw new Error('Expected the bottom bar'); }
    expect(StyleSheet.flatten(container.props.style).height).toBe(38);
    expect(StyleSheet.flatten(bar.props.style)).toMatchObject({ height: 76 });
    expect(StyleSheet.flatten(bar.props.style).transform).toBeUndefined();
    await act(() => { renderer!.unmount(); });
});

it('changes visibility after short directional scrolls and resets on reversal', () => {
    expect(updateNavigationBarScroll(0, 10)).toEqual({ distance: 10 });
    expect(updateNavigationBarScroll(10, 10)).toEqual({ distance: 0, visible: false });
    expect(updateNavigationBarScroll(10, -8)).toEqual({ distance: -8 });
    expect(updateNavigationBarScroll(-8, -16)).toEqual({ distance: 0, visible: true });
});
