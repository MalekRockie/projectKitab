import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { SocketStatus } from '../../services/messages/useMessagesSocket';
import { Message } from '../../services/messages/messageMapping';

export type ComposerProps = {
    wide: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    placeholder: string;
    disabled?: boolean;
    connection?: { status: SocketStatus; onReconnect: () => void };
    replyTo?: Message | null;
    onCancelReply?: () => void;
    inputRef?: React.Ref<TextInput>;
};

export default function Composer({ wide, value, onChangeText, onSend, placeholder, disabled = false, connection, replyTo, onCancelReply, inputRef }: ComposerProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors, wide), [colors, wide]);
    const connected = !connection || connection.status === 'connected';
    const blocked = disabled || !connected;
    const sendDisabled = blocked || !value.trim();

    return (
        <View>
            {connection && !connected ? (
                <View style={styles.notice}>
                    <Icon name={connection.status === 'error' ? 'wifi-off' : 'sync'} size={16} color={colors.textSecondary} />
                    <Text style={styles.noticeText}>
                        {connection.status === 'connecting' ? 'Connecting to messaging…' : 'Messaging connection unavailable.'}
                    </Text>
                    {connection.status === 'error' ? <Pressable onPress={connection.onReconnect} accessibilityRole="button"><Text style={styles.retryText}>Reconnect</Text></Pressable> : null}
                </View>
            ) : null}
            {replyTo ? (
                <View style={styles.replyPreview}>
                    <Icon name="reply" size={18} color={colors.textSecondary} />
                    <View style={styles.replyCopy}>
                        <Text style={styles.replyAuthor} numberOfLines={1}>Replying to {replyTo.author}</Text>
                        <Text style={styles.replyBody} numberOfLines={1}>{replyTo.body}</Text>
                    </View>
                    <Pressable onPress={onCancelReply} accessibilityRole="button" accessibilityLabel="Cancel reply" hitSlop={8}>
                        <Icon name="close" size={20} color={colors.textSecondary} />
                    </Pressable>
                </View>
            ) : null}
            <View style={styles.wrap}>
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSend}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    returnKeyType="send"
                    editable={!blocked}
                />
                <Pressable onPress={onSend} disabled={sendDisabled} style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]} accessibilityRole="button" accessibilityLabel="Send message">
                    <Icon name="arrow-upward" size={19} color="#FFFFFF" />
                </Pressable>
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors, wide: boolean) => StyleSheet.create({
    wrap: { minHeight: 56, marginHorizontal: wide ? 18 : 12, marginBottom: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 5 },
    replyPreview: { marginHorizontal: wide ? 18 : 12, marginBottom: 6, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.surface },
    replyCopy: { flex: 1, minWidth: 0 },
    replyAuthor: { color: colors.text, fontSize: 12, fontWeight: '700' },
    replyBody: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    notice: { minHeight: 48, marginHorizontal: wide ? 18 : 12, marginBottom: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, backgroundColor: colors.iconBg },
    noticeText: { color: colors.textSecondary, fontSize: 12 },
    retryText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
    input: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, paddingVertical: 10 },
    sendButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2B776A', alignItems: 'center', justifyContent: 'center' },
    sendButtonDisabled: { opacity: 0.45 },
});
