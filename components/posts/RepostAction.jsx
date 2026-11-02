import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { createQuoteRepost, repostPost } from '../../services/api/feed/post/repost';
import EmbeddedPost from './EmbeddedPost';

const RepostAction = ({ post, iconSize = 18, actionStyle, textStyle, label = 'Repost' }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const sheetHeight = Math.min(height - insets.top - 12, 600);
    const translateY = useSharedValue(sheetHeight);
    const dragStart = useSharedValue(0);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [quoteComposerOpen, setQuoteComposerOpen] = useState(false);
    const [quoteText, setQuoteText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (sheetOpen) {
            translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
        }
    }, [sheetOpen, translateY]);

    const finishDismiss = useCallback(() => {
        setSheetOpen(false);
        setQuoteComposerOpen(false);
        setQuoteText('');
        setFeedback('');
    }, []);

    const dismiss = useCallback(() => {
        translateY.value = withTiming(sheetHeight, { duration: 220, easing: Easing.in(Easing.cubic) }, finished => {
            if (finished) {
                runOnJS(finishDismiss)();
            }
        });
    }, [finishDismiss, sheetHeight, translateY]);

    const pan = Gesture.Pan()
        .onStart(() => {
            dragStart.value = translateY.value;
        })
        .onUpdate(event => {
            translateY.value = Math.max(0, dragStart.value + event.translationY);
        })
        .onEnd(event => {
            if (translateY.value > sheetHeight * 0.22 || event.velocityY > 900) {
                translateY.value = withTiming(sheetHeight, { duration: 220 }, finished => {
                    if (finished) {
                        runOnJS(finishDismiss)();
                    }
                });
            } else {
                translateY.value = withTiming(0, { duration: 180 });
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [0, sheetHeight], [1, 0]),
    }));

    const sendRepost = async () => {
        if (submitting) {
            return;
        }

        setSubmitting(true);
        try {
            await repostPost(post.id);
            dismiss();
        } catch {
            setFeedback('Could not repost. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitQuote = async () => {
        if (!quoteText.trim() || submitting) {
            return;
        }

        setSubmitting(true);
        try {
            await createQuoteRepost(post, quoteText);
            dismiss();
        } catch {
            setFeedback('Could not quote repost. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const showOptions = event => {
        event.stopPropagation();
        setQuoteComposerOpen(false);
        setFeedback('');
        setSheetOpen(true);
    };

    return (
        <>
            <Pressable
                android_disableSound
                onPress={showOptions}
                style={actionStyle}
                accessibilityRole="button"
                accessibilityLabel={label}
            >
                <Icon name="repeat" size={iconSize} color={colors.textSecondary} />
                {textStyle ? <Text style={textStyle}>0</Text> : null}
            </Pressable>
            <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={dismiss}>
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Animated.View style={[styles.backdrop, backdropStyle]}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={dismiss}
                            accessibilityRole="button"
                            accessibilityLabel="Close repost options"
                        />
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.sheet,
                            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 20) },
                            sheetStyle,
                        ]}
                    >
                        <GestureDetector gesture={pan}>
                            <View>
                                <Pressable
                                    onPress={dismiss}
                                    style={styles.handleArea}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close repost options"
                                >
                                    <View style={styles.handle} />
                                </Pressable>
                            </View>
                        </GestureDetector>
                        {quoteComposerOpen ? (
                            <>
                                <View style={styles.sheetHeader}>
                                    <Pressable
                                        onPress={() => setQuoteComposerOpen(false)}
                                        accessibilityRole="button"
                                        accessibilityLabel="Back to repost options"
                                        hitSlop={8}
                                    >
                                        <Icon name="arrow-back" size={23} color={colors.text} />
                                    </Pressable>
                                    <Text style={styles.title}>Quote repost</Text>
                                    <View style={styles.headerSpacer} />
                                </View>
                                <ScrollView
                                    style={styles.quoteContent}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    <TextInput
                                        value={quoteText}
                                        onChangeText={value => {
                                            setQuoteText(value);
                                            setFeedback('');
                                        }}
                                        placeholder="Add your thoughts..."
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        maxLength={500}
                                        editable={!submitting}
                                        style={styles.input}
                                        accessibilityLabel="Quote repost text"
                                    />
                                    <EmbeddedPost post={post} />
                                    {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
                                </ScrollView>
                                <Pressable
                                    onPress={submitQuote}
                                    disabled={!quoteText.trim() || submitting}
                                    style={[styles.submitButton, (!quoteText.trim() || submitting) && styles.disabledButton]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.submitText}>{submitting ? 'Posting…' : 'Post'}</Text>
                                </Pressable>
                            </>
                        ) : (
                            <View style={styles.optionsContent}>
                                <Text style={styles.title}>Share post</Text>
                                <Text style={styles.subtitle}>Choose how you want to share this post.</Text>
                                {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
                                <Pressable
                                    onPress={sendRepost}
                                    disabled={submitting}
                                    style={styles.option}
                                    accessibilityRole="button"
                                >
                                    <View style={styles.optionIcon}>
                                        <Icon name="repeat" size={22} color={colors.accent} />
                                    </View>
                                    <View style={styles.optionCopy}>
                                        <Text style={styles.optionTitle}>Repost</Text>
                                        <Text style={styles.optionDescription}>Share this post with your followers</Text>
                                    </View>
                                    <Icon name="chevron-right" size={22} color={colors.textSecondary} />
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setFeedback('');
                                        setQuoteComposerOpen(true);
                                    }}
                                    style={styles.option}
                                    accessibilityRole="button"
                                >
                                    <View style={styles.optionIcon}>
                                        <Icon name="edit" size={21} color={colors.accent} />
                                    </View>
                                    <View style={styles.optionCopy}>
                                        <Text style={styles.optionTitle}>Quote repost</Text>
                                        <Text style={styles.optionDescription}>Add your thoughts to this post</Text>
                                    </View>
                                    <Icon name="chevron-right" size={22} color={colors.textSecondary} />
                                </Pressable>
                                <Pressable onPress={dismiss} style={styles.cancelButton} accessibilityRole="button">
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </Pressable>
                            </View>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const createStyles = colors => StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        elevation: 24,
    },
    handleArea: {
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.divider,
    },
    optionsContent: {
        paddingHorizontal: 22,
        paddingTop: 6,
        paddingBottom: 8,
    },
    title: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 5,
        marginBottom: 16,
    },
    feedback: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 68,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.divider,
    },
    optionIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.iconBg,
        marginRight: 13,
    },
    optionCopy: {
        flex: 1,
    },
    optionTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '700',
    },
    optionDescription: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 3,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    headerSpacer: {
        width: 23,
    },
    quoteContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        marginTop: 8,
        borderRadius: 14,
        backgroundColor: colors.iconBg,
    },
    cancelText: {
        color: colors.text,
        fontWeight: '700',
    },
    input: {
        minHeight: 100,
        maxHeight: 180,
        paddingVertical: 14,
        color: colors.text,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    submitButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 14,
        backgroundColor: colors.accent,
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default RepostAction;
