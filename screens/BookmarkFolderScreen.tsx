import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/common/ScreenHeader';
import BookmarkList from '../components/bookmarks/BookmarkList';
import { useTheme } from '../theme/useTheme';

type FolderRoute = RouteProp<{ BookmarkFolder: { folderId?: string; name: string } }, 'BookmarkFolder'>;

const BookmarkFolderScreen: React.FC = () => {
    const { params } = useRoute<FolderRoute>();
    const colors = useTheme();
    const styles = useMemo(() => StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } }), [colors]);

    return (
        <View style={styles.container}>
            <ScreenHeader title={params.name} />
            <BookmarkList folderId={params.folderId} />
        </View>
    );
};

export default BookmarkFolderScreen;
