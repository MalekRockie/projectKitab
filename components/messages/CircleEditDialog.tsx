import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { CircleDetails, CircleUpdate } from '../../services/api/messages/circles';

type CircleEditDialogProps = {
    visible: boolean;
    details: CircleDetails | null;
    onClose: () => void;
    onSubmit: (update: CircleUpdate) => Promise<void>;
    onDelete: () => Promise<void>;
};

const isValidUrl = (value: string) => !value || /^https?:\/\/\S+$/i.test(value);

// Owner-only editor for a circle's name, icon, banner and animated-icon flag.
export default function CircleEditDialog({ visible, details, onClose, onSubmit, onDelete }: CircleEditDialogProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [name, setName] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [animated, setAnimated] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && details) {
            setName(details.name);
            setIconUrl(details.icon_url ?? '');
            setBannerUrl(details.banner_url ?? '');
            setAnimated(details.is_animated_icon);
            setError(null);
        }
    }, [details, visible]);

    const trimmedName = name.trim();
    const urlsValid = isValidUrl(iconUrl.trim()) && isValidUrl(bannerUrl.trim());
    const canSave = Boolean(details) && Boolean(trimmedName) && urlsValid && !saving;

    const submit = async () => {
        if (!details || !canSave) {return;}
        const update: CircleUpdate = {};
        if (trimmedName !== details.name) {update.name = trimmedName;}
        if ((iconUrl.trim() || null) !== details.icon_url) {update.icon_url = iconUrl.trim() || null;}
        if ((bannerUrl.trim() || null) !== details.banner_url) {update.banner_url = bannerUrl.trim() || null;}
        if (animated !== details.is_animated_icon) {update.is_animated_icon = animated;}
        if (!Object.keys(update).length) {
            onClose();
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSubmit(update);
            onClose();
        } catch (failure) {
            console.warn('Could not update circle', failure);
            setError('Could not save your changes. Only the owner can edit a circle — check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const close = () => {
        if (!saving) {onClose();}
    };

    const confirmDelete = () => {
        if (!details) {return;}
        Alert.alert(
            `Delete ${details.name}?`,
            'This permanently removes the circle for every member. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setSaving(true);
                        setError(null);
                        try {
                            await onDelete();
                            onClose();
                        } catch (failure) {
                            console.warn('Could not delete circle', failure);
                            setError('Could not delete the circle. Only the owner can delete it — try again.');
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
                <View style={styles.dialog}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleIcon}><Icon name="tune" size={21} color={colors.accent} /></View>
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>Edit circle</Text>
                            <Text style={styles.description}>Update how your circle looks to members.</Text>
                        </View>
                        <Pressable disabled={saving} onPress={close} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
                            <Icon name="close" size={20} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>NAME</Text>
                        <TextInput value={name} onChangeText={setName} placeholder="Circle name" placeholderTextColor={colors.textSecondary} style={styles.input} maxLength={80} />
                        <Text style={styles.label}>ICON URL</Text>
                        <TextInput value={iconUrl} onChangeText={setIconUrl} placeholder="https://…" placeholderTextColor={colors.textSecondary} style={[styles.input, !isValidUrl(iconUrl.trim()) && styles.inputInvalid]} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
                        <Text style={styles.label}>BANNER URL</Text>
                        <TextInput value={bannerUrl} onChangeText={setBannerUrl} placeholder="https://…" placeholderTextColor={colors.textSecondary} style={[styles.input, !isValidUrl(bannerUrl.trim()) && styles.inputInvalid]} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
                        <View style={styles.switchRow}>
                            <View style={styles.titleBlock}>
                                <Text style={styles.switchTitle}>Animated icon</Text>
                                <Text style={styles.description}>Turn on if the icon is a GIF or animation.</Text>
                            </View>
                            <Switch value={animated} onValueChange={setAnimated} trackColor={{ false: colors.switchTrackOff, true: colors.accent }} />
                        </View>
                        {details?.is_owner ? (
                            <Pressable disabled={saving} onPress={confirmDelete} style={styles.deleteButton} accessibilityRole="button">
                                <Icon name="delete-outline" size={18} color={colors.danger} />
                                <Text style={styles.deleteText}>Delete circle</Text>
                            </Pressable>
                        ) : null}
                    </ScrollView>
                    {!urlsValid ? <Text style={styles.error}>Image links must start with http:// or https://</Text> : null}
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <View style={styles.actions}>
                        <Pressable disabled={saving} onPress={close} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable disabled={!canSave} onPress={submit} style={[styles.submitButton, !canSave && styles.submitDisabled]}>
                            <Text style={styles.submitText}>{saving ? 'Saving…' : 'Save changes'}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.48)' },
    dialog: { width: '100%', maxWidth: 400, maxHeight: '90%', padding: 20, borderRadius: 20, backgroundColor: colors.background, elevation: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    titleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center' },
    titleBlock: { flex: 1 },
    title: { color: colors.text, fontSize: 18, fontWeight: '700' },
    description: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
    closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    label: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
    input: { minHeight: 46, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, fontSize: 15 },
    inputInvalid: { borderColor: colors.danger },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
    switchTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
    error: { color: colors.danger, fontSize: 12, marginTop: 9 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: 20, borderRadius: 12, backgroundColor: colors.dangerBg },
    deleteText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 18 },
    cancelButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 13 },
    cancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    submitButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 11, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
    submitDisabled: { opacity: 0.55 },
    submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
