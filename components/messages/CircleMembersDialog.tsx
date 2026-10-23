import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { CircleMember, getCircleMembers, updateCircleMemberNickname } from '../../services/api/messages/circles';
import { getCircleColor } from './CircleRail';

const PAGE_SIZE = 50;

type CircleMembersDialogProps = {
    visible: boolean;
    circleId: string;
    circleName: string;
    currentUserId: string | null;
    isCircleOwner: boolean;
    onClose: () => void;
};

const memberTitle = (member: CircleMember) => member.nickname || member.display_name || member.username;

// Paginated member list. Nicknames can be edited by the circle owner or by the member themselves.
export default function CircleMembersDialog({ visible, circleId, circleName, currentUserId, isCircleOwner, onClose }: CircleMembersDialogProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [members, setMembers] = useState<CircleMember[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const loadPage = useCallback(async (nextPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCircleMembers(circleId, nextPage, PAGE_SIZE);
            setMembers(previous => nextPage === 1 ? result.members : [...previous, ...result.members]);
            setPage(nextPage);
            setHasMore(result.members.length >= result.limit);
        } catch (failure) {
            console.warn('Could not load circle members', failure);
            setError('Could not load members. Try again.');
        } finally {
            setLoading(false);
        }
    }, [circleId]);

    useEffect(() => {
        if (visible && circleId) {
            setMembers([]);
            setEditingId(null);
            loadPage(1);
        }
    }, [visible, circleId, loadPage]);

    const startEdit = (member: CircleMember) => {
        setEditingId(member.user_id);
        setDraft(member.nickname ?? '');
        setError(null);
    };

    const saveNickname = async (member: CircleMember) => {
        const nickname = draft.trim();
        setSaving(true);
        setError(null);
        try {
            await updateCircleMemberNickname(circleId, member.user_id === currentUserId ? '@me' : member.user_id, nickname);
            setMembers(previous => previous.map(item => item.user_id === member.user_id ? { ...item, nickname: nickname || null } : item));
            setEditingId(null);
        } catch (failure) {
            console.warn('Could not update nickname', failure);
            setError('Could not update the nickname. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderMember = ({ item }: { item: CircleMember }) => {
        const title = memberTitle(item);
        const canEdit = isCircleOwner || item.user_id === currentUserId;
        const editing = editingId === item.user_id;
        return (
            <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: getCircleColor(item.user_id) }]}>
                    <Text style={styles.avatarText}>{title.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.rowBody}>
                    {editing ? (
                        <TextInput
                            autoFocus
                            value={draft}
                            onChangeText={setDraft}
                            placeholder="Nickname"
                            placeholderTextColor={colors.textSecondary}
                            style={styles.input}
                            maxLength={32}
                            returnKeyType="done"
                            onSubmitEditing={() => saveNickname(item)}
                        />
                    ) : (
                        <>
                            <View style={styles.nameRow}>
                                <Text numberOfLines={1} style={styles.memberName}>{title}</Text>
                                {item.is_owner ? <View style={styles.ownerBadge}><Icon name="star" size={11} color={colors.accent} /><Text style={styles.ownerText}>Owner</Text></View> : null}
                            </View>
                            <Text numberOfLines={1} style={styles.memberSub}>@{item.username}</Text>
                        </>
                    )}
                </View>
                {editing ? (
                    <View style={styles.editActions}>
                        <Pressable disabled={saving} onPress={() => setEditingId(null)} style={styles.iconButton} accessibilityLabel="Cancel"><Icon name="close" size={19} color={colors.textSecondary} /></Pressable>
                        <Pressable disabled={saving} onPress={() => saveNickname(item)} style={styles.iconButton} accessibilityLabel="Save nickname"><Icon name="check" size={20} color={colors.accent} /></Pressable>
                    </View>
                ) : canEdit ? (
                    <Pressable onPress={() => startEdit(item)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={`Edit nickname for ${title}`}>
                        <Icon name="edit" size={17} color={colors.textSecondary} />
                    </Pressable>
                ) : null}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
                <View style={styles.dialog}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleIcon}><Icon name="groups" size={22} color={colors.accent} /></View>
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>Members</Text>
                            <Text numberOfLines={1} style={styles.description}>{circleName}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Close"><Icon name="close" size={20} color={colors.textSecondary} /></Pressable>
                    </View>
                    <FlatList
                        data={members}
                        keyExtractor={item => item.user_id}
                        renderItem={renderMember}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            <View>
                                {loading ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}
                                {error ? <Text style={styles.error}>{error}</Text> : null}
                                {!loading && hasMore ? (
                                    <Pressable onPress={() => loadPage(page + 1)} style={styles.moreButton}><Text style={styles.moreText}>Load more</Text></Pressable>
                                ) : null}
                            </View>
                        }
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.48)' },
    dialog: { width: '100%', maxWidth: 420, maxHeight: '80%', padding: 18, borderRadius: 20, backgroundColor: colors.background, elevation: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    titleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center' },
    titleBlock: { flex: 1 },
    title: { color: colors.text, fontSize: 18, fontWeight: '700' },
    description: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    rowBody: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    memberName: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
    memberSub: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
    ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.iconBg },
    ownerText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
    input: { minHeight: 40, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider, borderRadius: 10, backgroundColor: colors.surface, color: colors.text, fontSize: 14 },
    editActions: { flexDirection: 'row' },
    spinner: { marginVertical: 14 },
    error: { color: colors.danger, fontSize: 12, marginVertical: 10, textAlign: 'center' },
    moreButton: { alignItems: 'center', paddingVertical: 12 },
    moreText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
