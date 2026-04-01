import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Image,
    Keyboard,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createComment } from "../services/api/feed/post/post";

const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
};

const AvatarPlaceholder = ({ username, size = 32 }) => {
    const initials = username ? username.slice(0, 2).toUpperCase() : "??";
    const palette = ["#6C63FF", "#FF6584", "#43B89C", "#F4A261", "#E76F51"];
    const bg = palette[username?.charCodeAt(0) % palette.length] ?? palette[0];
    return (
        <View style={[styles.avatarBase, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
            <Text style={[styles.avatarInitials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
    );
};

const PREVIEW_CHAR_LIMIT = 120;

const PostContentPreview = ({ postblocks = [] }) => {
    const merged = postblocks
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((b) => b.content ?? "")
        .join("\n")
        .replace(/^> ?/gm, "")
        .replace(/\n+/g, " ")
        .trim();

    const truncated = merged.length > PREVIEW_CHAR_LIMIT;
    const preview = truncated ? merged.slice(0, PREVIEW_CHAR_LIMIT).trimEnd() : merged;

    return (
        <Text style={styles.previewText} numberOfLines={3}>
            {preview}
            {truncated && <Text style={styles.previewEllipsis}>…</Text>}
        </Text>
    );
};

export const CommentComposer = ({ route, navigation }) => {
    const post = route?.params?.post ?? SAMPLE_POST;
    const [comment, setComment] = useState("");
    const inputRef = useRef(null);

    const suppressDismiss = useRef(false);

    const user = post.user ?? {};
    const timeAgo = formatRelativeTime(post.createdAt);

    const CHAR_LIMIT = 500;
    const remaining = CHAR_LIMIT - comment.length;
    const isOverLimit = remaining < 0;
    const canSubmit = comment.trim().length > 0 && !isOverLimit;

    useFocusEffect(
        useCallback(() => {
            const t = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }, [])
    );

    useEffect(() => {
        const sub = Keyboard.addListener("keyboardDidHide", () => {
            if (suppressDismiss.current) {
                suppressDismiss.current = false;
                return;
            }
            navigation?.goBack();
        });
        return () => sub.remove();
    }, [navigation]);

    const dismiss = (cb) => {
        suppressDismiss.current = true;
        Keyboard.dismiss();
        cb?.();
    };

    const handleCancel = () => dismiss(() => navigation?.goBack());

    const handleSubmit = () => {
        if (!canSubmit) return;
        const commentRequest = {
            parent_comment_id: "",
            blocks:[
                {
                    type: "text",
                    content: comment
                }
            ]
        }
        createComment(post.id, commentRequest);
        dismiss(() => {
            console.log("Submitting comment:", comment, " ", post.id);
            navigation?.goBack();
        });
    };

    return (
        <View style={styles.root}>

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleCancel}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Reply</Text>

                <TouchableOpacity
                    style={[styles.replyBtn, canSubmit && styles.replyBtnActive]}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                >
                    <Text style={[styles.replyBtnText, canSubmit && styles.replyBtnTextActive]}>
                        Reply
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
            >

                <View style={styles.postCard}>

                    <View style={styles.threadColumn}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <AvatarPlaceholder username={user.username} size={36} />
                        )}
                        <View style={styles.threadLine} />
                    </View>

                    <View style={styles.postBody}>
                        <View style={styles.postMetaRow}>
                            <Text style={styles.username} numberOfLines={1}>
                                {user.username ?? "unknown"}
                            </Text>
                            <Text style={styles.metaDot}>·</Text>
                            <Text style={styles.timeText}>{timeAgo}</Text>
                        </View>

                        <PostContentPreview postblocks={post.postblocks} />

                    </View>
                </View>

                <View style={styles.replyingToRow}>
                    <View style={styles.replyingToIndent} />
                    <Text style={styles.replyingTo}>
                        Replying to{" "}
                        <Text style={styles.replyingToHandle}>@{user.username}</Text>
                    </Text>
                </View>

                <View style={styles.inputRow}>
                    <AvatarPlaceholder username="you" size={36} />
                    <TextInput
                        ref={inputRef}
                        style={styles.textInput}
                        placeholder="Write your reply…"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={comment}
                        onChangeText={setComment}
                        maxLength={CHAR_LIMIT + 20}
                        autoFocus
                        textAlignVertical="top"
                        blurOnSubmit={false}
                    />
                </View>
            </ScrollView>

            <View style={styles.toolbar}>
                <View style={styles.toolbarLeft}>
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.toolbarIcon}>🖼️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.toolbarIcon}>😄</Text>
                    </TouchableOpacity>
                </View>

                {comment.length > 0 && (
                    <Text style={[
                        styles.charCount,
                        remaining < 20 && styles.charCountWarn,
                        isOverLimit && styles.charCountOver,
                    ]}>
                        {remaining}
                    </Text>
                )}
            </View>
        </View>
    );
};

const C = {
    bg: "#FFFFFF",
    border: "#E5E7EB",
    text: "#111827",
    muted: "#6B7280",
    subtle: "#9CA3AF",
    accent: "#2563EB",
    quoteBorder: "#D1D5DB",
    quoteBg: "#F9FAFB",
    warn: "#F59E0B",
    error: "#EF4444",
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    cancelText: {
        fontSize: 15,
        color: C.muted,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: C.text,
    },
    replyBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: C.border,
    },
    replyBtnActive: {
        backgroundColor: C.accent,
    },
    replyBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: C.subtle,
    },
    replyBtnTextActive: {
        color: "#FFFFFF",
    },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 8 },

    postCard: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 14,
        gap: 10,
    },
    threadColumn: {
        alignItems: "center",
        width: 36,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarBase: {
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitials: {
        color: "#FFF",
        fontWeight: "700",
    },
    threadLine: {
        flex: 1,
        width: 2,
        backgroundColor: C.quoteBorder,
        marginTop: 5,
        marginBottom: 0,
        borderRadius: 1,
    },
    postBody: {
        flex: 1,
        paddingBottom: 6,
    },
    postMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 6,
    },
    username: {
        fontSize: 14,
        fontWeight: "700",
        color: C.text,
        flexShrink: 1,
    },
    metaDot: {
        fontSize: 13,
        color: C.subtle,
    },
    timeText: {
        fontSize: 13,
        color: C.subtle,
    },

    previewText: {
        fontSize: 14,
        color: C.text,
        lineHeight: 20,
    },
    previewEllipsis: {
        fontSize: 14,
        color: C.subtle,
    },
    statsRow: {
        flexDirection: "row",
        gap: 14,
        marginTop: 10,
    },
    statItem: {
        fontSize: 13,
        color: C.muted,
    },

    replyingToRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 10,
    },
    replyingToIndent: {
        width: 36 + 10,
        alignItems: "center",
    },
    replyingTo: {
        fontSize: 13,
        color: C.subtle,
    },
    replyingToHandle: {
        color: C.accent,
        fontWeight: "500",
    },

    inputRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 2,
        gap: 10,
        alignItems: "flex-start",
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: C.text,
        lineHeight: 24,
        minHeight: 80,
        padding: 0,
        paddingTop: Platform.OS === "ios" ? 5 : 3,
    },

    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.border,
    },
    toolbarLeft: {
        flexDirection: "row",
        gap: 6,
    },
    toolbarIcon: {
        fontSize: 20,
        padding: 4,
    },
    charCount: {
        fontSize: 13,
        color: C.subtle,
        fontVariant: ["tabular-nums"],
    },
    charCountWarn: {
        color: C.warn,
    },
    charCountOver: {
        color: C.error,
        fontWeight: "700",
    },
});