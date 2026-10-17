import { useEffect, useState } from 'react';
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

export const CIRCLE_RAIL_WIDTH = 64;
export const CIRCLE_DRAWER_WIDTH = 300;

const EDGE_WIDTH = 28;
const SLIDE_MS = 220;

export function useCircleDrawer() {
    const [open, setOpen] = useState(false);
    const x = useSharedValue(-CIRCLE_DRAWER_WIDTH);
    const edgeStartX = useSharedValue(0);
    const dragStartX = useSharedValue(0);

    useEffect(() => {
        x.value = withTiming(open ? 0 : -CIRCLE_DRAWER_WIDTH, { duration: SLIDE_MS });
    }, [open, x]);

    const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

    // swipe from the left edge of the chat to pull the drawer open.
    const edgeGesture = Gesture.Pan()
        .activeOffsetX(18)
        .failOffsetY([-12, 12])
        .onBegin(event => { edgeStartX.value = event.x; })
        .onChange(event => {
            if (!open && edgeStartX.value < EDGE_WIDTH) {
                x.value = Math.max(-CIRCLE_DRAWER_WIDTH, Math.min(0, -CIRCLE_DRAWER_WIDTH + event.translationX));
            }
        })
        .onFinalize(event => {
            if (!open && edgeStartX.value < EDGE_WIDTH) {
                const shouldOpen = x.value > -CIRCLE_DRAWER_WIDTH * 0.55 || event.velocityX > 550;
                x.value = withTiming(shouldOpen ? 0 : -CIRCLE_DRAWER_WIDTH, { duration: SLIDE_MS });
                runOnJS(setOpen)(shouldOpen);
            }
        });

    // Drag the open drawer itself to close or settle it.
    const dragGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-12, 12])
        .onBegin(() => { dragStartX.value = x.value; })
        .onChange(event => {
            x.value = Math.max(-CIRCLE_DRAWER_WIDTH, Math.min(0, dragStartX.value + event.translationX));
        })
        .onEnd(event => {
            const shouldOpen = event.translationX > 0
                ? x.value > -CIRCLE_DRAWER_WIDTH * 0.55 || event.velocityX > 450
                : x.value > -CIRCLE_DRAWER_WIDTH * 0.35 && event.velocityX > -450;
            runOnJS(setOpen)(shouldOpen);
        });

    return {
        open,
        openDrawer: () => setOpen(true),
        closeDrawer: () => setOpen(false),
        style,
        edgeGesture,
        dragGesture,
    };
}

export type CircleDrawerController = ReturnType<typeof useCircleDrawer>;
