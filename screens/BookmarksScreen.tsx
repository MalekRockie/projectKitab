import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/common/ScreenHeader';
import SettingRow from '../components/settings/SettingRow';
import BookmarkList from '../components/bookmarks/BookmarkList';
import { getAccount } from '../services/api/user/currentUser';
import { BookmarkFolder, getBookmarkFolders } from '../services/api/user/bookmarks';
import { useTheme } from '../theme/useTheme';
import { ThemeColors } from '../theme/colors';

type PageState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'standard' }
    | { status: 'premium'; folders: BookmarkFolder[] };

const BookmarksScreen: React.FC = () => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const navigation = useNavigation();
    const [state, setState] = useState<PageState>({ status: 'loading' });

    const load = useCallback(async () => {
        setState({ status: 'loading' });
        try {
            const account = await getAccount();
            if (!account) {
                throw new Error('Could not load account.');
            }
            if (!account.is_premium) {
                setState({ status: 'standard' });
                return;
            }
            setState({ status: 'premium', folders: await getBookmarkFolders() });
        } catch (error) {
            setState({ status: 'error', message: error instanceof Error ? error.message : 'Could not load bookmarks.' });
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const renderBody = () => {
        if (state.status === 'loading') {
            return <ActivityIndicator style={styles.center} color={colors.accent} />;
        }
        if (state.status === 'error') {
            return (
                <View style={styles.center}>
                    <Text style={styles.message}>{state.message}</Text>
                    <Pressable onPress={load} accessibilityRole="button">
                        <Text style={styles.retry}>Try again</Text>
                    </Pressable>
                </View>
            );
        }
        if (state.status === 'standard') {
            return <BookmarkList />;
        }
        return (
            <FlatList
                data={state.folders}
                keyExtractor={folder => folder.id}
                contentContainerStyle={styles.folderList}
                ListHeaderComponent={(
                    <>
                        <SettingRow
                            icon="bookmark-outline"
                            label="All bookmarks"
                            onPress={() => navigation.navigate('BookmarkFolder' as never, { name: 'All bookmarks' } as never)}
                        />
                        {state.folders.length > 0 && <View style={styles.divider} />}
                    </>
                )}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                ListEmptyComponent={<Text style={[styles.center, styles.message]}>No folders yet</Text>}
                renderItem={({ item }) => (
                    <SettingRow
                        icon="folder-outline"
                        label={item.name}
                        onPress={() => navigation.navigate('BookmarkFolder' as never, { folderId: item.id, name: item.name } as never)}
                    />
                )}
            />
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Bookmarks" />
            {renderBody()}
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        minHeight: 200,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    message: {
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: 15,
        marginBottom: 10,
    },
    retry: {
        color: colors.accent,
        fontSize: 14,
        fontWeight: '600',
    },
    folderList: {
        marginHorizontal: 16,
        borderRadius: 10,
        overflow: 'hidden',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: 60,
    },
});

export default BookmarksScreen;
