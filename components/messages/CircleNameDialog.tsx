import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

type CircleNameDialogProps = {
    visible: boolean;
    kind: 'circle' | 'folder';
    description?: string;
    busy?: boolean;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
};

export default function CircleNameDialog({
    visible, kind, description: descriptionOverride, busy = false, onClose, onSubmit,
}: CircleNameDialogProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isBusy = busy || saving;

    useEffect(() => {
        if (visible) {
            setName('');
            setError(null);
        }
    }, [kind, visible]);

    const submit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName || isBusy) {return;}
        setSaving(true);
        setError(null);
        try {
            await onSubmit(trimmedName);
            onClose();
        } catch (failure) {
            console.warn(`Could not create ${kind}`, failure);
            setError(`Could not create the ${kind}. Check your connection and try again.`);
        } finally {
            setSaving(false);
        }
    };

    const title = kind === 'circle' ? 'Create a circle' : 'Create a folder';
    const description = descriptionOverride ?? (kind === 'circle'
        ? 'Give your new circle a name.'
        : 'Name the folder for these circles.');
    const close = () => {
        if (!isBusy) {
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleIcon}>
                            <Icon name={kind === 'circle' ? 'groups' : 'folder'} size={21} color={colors.accent} />
                        </View>
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.description}>{description}</Text>
                        </View>
                        <Pressable disabled={isBusy} onPress={close} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
                            <Icon name="close" size={20} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.input}
                        maxLength={80}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={submit}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <View style={styles.actions}>
                        <Pressable disabled={isBusy} onPress={close} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            disabled={isBusy || !name.trim()}
                            onPress={submit}
                            style={[styles.submitButton, (!name.trim() || isBusy) && styles.submitDisabled]}
                        >
                            <Text style={styles.submitText}>{isBusy ? 'Creating…' : kind === 'circle' ? 'Create circle' : 'Create folder'}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.48)' },
    dialog: { width: '100%', maxWidth: 380, padding: 20, borderRadius: 20, backgroundColor: colors.background, elevation: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    titleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center' },
    titleBlock: { flex: 1 },
    title: { color: colors.text, fontSize: 18, fontWeight: '700' },
    description: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
    closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    input: { minHeight: 50, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
    error: { color: colors.danger, fontSize: 12, marginTop: 9 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 20 },
    cancelButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 13 },
    cancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    submitButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 11, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
    submitDisabled: { opacity: 0.55 },
    submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
