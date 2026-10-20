import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { CircleFolder } from '../../services/api/messages/circles';

type CircleManagerProps = {
    visible: boolean;
    folders: CircleFolder[];
    onClose: () => void;
    onRenameFolder: (folderId: string, name: string) => Promise<void>;
    onDeleteFolder: (folderId: string) => Promise<void>;
};

export default function CircleManager({ visible, folders, onClose, onRenameFolder, onDeleteFolder }: CircleManagerProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [editingFolder, setEditingFolder] = useState<CircleFolder | null>(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAction = async (action: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await action();
        } catch (failure) {
            console.warn('Could not update circle folder', failure);
            setError('That change could not be saved. Check your connection and try again.');
        } finally {
            setBusy(false);
        }
    };

    const submitRename = () => {
        if (!editingFolder || !name.trim() || busy) {return;}
        runAction(async () => {
            await onRenameFolder(editingFolder.id, name.trim());
            setEditingFolder(null);
            setName('');
        });
    };

    const confirmDelete = (folder: CircleFolder) => {
        Alert.alert('Delete folder?', `Circles in ${folder.name} will stay in your circle list.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { runAction(() => onDeleteFolder(folder.id)); } },
        ]);
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.screen}>
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Manage folders</Text>
                        <Text style={styles.subtitle}>Folders are created by dropping one circle onto another.</Text>
                    </View>
                    <Pressable onPress={onClose} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Close folder manager">
                        <Icon name="close" size={23} color={colors.text} />
                    </Pressable>
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {editingFolder ? (
                    <View style={styles.form}>
                        <Text style={styles.formTitle}>Rename folder</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Folder name"
                            placeholderTextColor={colors.textSecondary}
                            style={styles.input}
                            maxLength={80}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={submitRename}
                        />
                        <View style={styles.formActions}>
                            <Pressable disabled={busy} onPress={() => setEditingFolder(null)} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable disabled={busy || !name.trim()} onPress={submitRename} style={styles.saveButton}>
                                <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save name'}</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : null}
                <ScrollView contentContainerStyle={styles.list}>
                    {!folders.length ? <Text style={styles.emptyText}>No folders yet. Drop a circle onto another circle to make one.</Text> : null}
                    {folders.map(folder => (
                        <View key={folder.id} style={styles.folderRow}>
                            <Icon name="folder" size={21} color={colors.accent} />
                            <Text numberOfLines={1} style={styles.folderName}>{folder.name}</Text>
                            <Pressable disabled={busy} onPress={() => {
                                setName(folder.name);
                                setEditingFolder(folder);
                                setError(null);
                            }} style={styles.rowButton} accessibilityRole="button" accessibilityLabel={`Rename ${folder.name}`}>
                                <Icon name="edit" size={19} color={colors.textSecondary} />
                            </Pressable>
                            <Pressable disabled={busy} onPress={() => confirmDelete(folder)} style={styles.rowButton} accessibilityRole="button" accessibilityLabel={`Delete ${folder.name}`}>
                                <Icon name="delete-outline" size={20} color={colors.danger} />
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    headerText: { flex: 1 },
    title: { color: colors.text, fontSize: 21, fontWeight: '700' },
    subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4, paddingRight: 6 },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    error: { color: colors.danger, fontSize: 13, paddingHorizontal: 20, paddingTop: 12 },
    form: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, gap: 12 },
    formTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    input: { minHeight: 46, borderRadius: 9, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 15 },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    cancelButton: { minHeight: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14 },
    cancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    saveButton: { minHeight: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: colors.accent },
    saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28, gap: 8 },
    emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, padding: 8 },
    folderRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surface },
    folderName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
    rowButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
});
