import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Message } from '../../services/messages/messageMapping';
import Avatar, { AVATAR_TINTS } from './Avatar';

function MessageItem({ message, onPressAvatar, onReply, onSwipeReply, replyTo }: { message: Message; onPressAvatar?: (message: Message) => void; onReply?: (message: Message) => void; onSwipeReply?: (message: Message) => void; replyTo?: Message }) {
    const colors = useTheme();
    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const initials = message.own ? 'ME' : message.author.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
    const avatar = <Avatar initials={initials} tint={message.own ? AVATAR_TINTS.own : AVATAR_TINTS.other} size={38} />;
    const [pressed, setPressed] = useState(false);
    const translateX = useSharedValue(0);
    const rowAnimation = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
    const replyAnimation = useAnimatedStyle(() => ({ opacity: Math.min(1, -translateX.value / 60) }));
    const swipe = Gesture.Pan()
        .enabled(Boolean(onSwipeReply))
        .onTouchesDown((event, state) => {
            if (width < 760 && event.allTouches[0]?.absoluteX >= width - 32) {
                state.fail();
            }
        })
        .activeOffsetX(-12)
        .failOffsetX(12)
        .failOffsetY([-10, 10])
        .onUpdate(event => { translateX.value = Math.max(-80, Math.min(0, event.translationX)); })
        .onEnd(event => {
            if (event.translationX <= -60 && onSwipeReply) {
                runOnJS(onSwipeReply)(message);
            }
        })
        .onFinalize(() => { translateX.value = withSpring(0); });

    return (
        <View style={styles.rowContainer}>
            <Animated.View style={[styles.swipeIcon, replyAnimation]} pointerEvents="none">
                <Icon name="reply" size={22} color={colors.accent} />
            </Animated.View>
            <GestureDetector gesture={swipe}>
                <Animated.View style={[styles.row, rowAnimation]}>
                    {pressed ? <View testID="message-highlight" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressed]} /> : null}
                    {onPressAvatar ? (
                        <Pressable onPress={() => onPressAvatar(message)} accessibilityRole="button" accessibilityLabel={`View ${message.author}'s profile`}>{avatar}</Pressable>
                    ) : avatar}
                    <Pressable
                        style={styles.content}
                        onPressIn={() => setPressed(true)}
                        onPressOut={() => setPressed(false)}
                        onLongPress={onReply ? () => onReply(message) : undefined}
                        accessibilityRole={onReply ? 'button' : undefined}
                        accessibilityLabel={onReply ? `${message.author}: ${message.body}. Message actions` : undefined}
                        accessibilityActions={onReply ? [{ name: 'activate', label: 'Message actions' }] : undefined}
                        onAccessibilityAction={onReply ? () => onReply(message) : undefined}
                    >
                        {message.replyToMessageId ? (
                            <View style={styles.reply}>
                                <Icon name="reply" size={15} color={colors.textSecondary} />
                                <Text style={styles.replyText} numberOfLines={1}>{replyTo ? `${replyTo.author}: ${replyTo.body}` : 'Original message unavailable'}</Text>
                            </View>
                        ) : null}
                        <View style={styles.meta}>
                            <Text style={[styles.author, message.own && styles.ownAuthor]}>{message.author}</Text>
                            <Text style={styles.time}>{message.time}</Text>
                        </View>
                        <Text style={styles.text}>{message.body}</Text>
                    </Pressable>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

export default memo(MessageItem);

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    rowContainer: { marginBottom: 13 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 4, marginHorizontal: -4, borderRadius: 4 },
    pressed: { backgroundColor: colors.text, opacity: 0.06, borderRadius: 4 },
    swipeIcon: { position: 'absolute', right: 4, top: 8 },
    content: { flex: 1, paddingTop: 1 },
    reply: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    replyText: { flex: 1, color: colors.textSecondary, fontSize: 12 },
    meta: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
    author: { color: colors.text, fontSize: 13, fontWeight: '700' },
    ownAuthor: { color: colors.accent },
    time: { color: colors.textSecondary, fontSize: 10 },
    text: { color: colors.text, fontSize: 14, lineHeight: 21 },
});
