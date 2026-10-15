import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import PostComponent from '../posts/postComp';
import CommentItem from '../posts/CommentItem';
import { BookmarkedComment, deleteBookmark, getBookmarks } from '../../services/api/user/bookmarks';
import { usePStore } from '../../services/storage/store/postStore';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

const PAGE_SIZE = 20;
const TypedPostComponent = PostComponent as React.ComponentType<{ postId: string | number; onRemoveBookmark?: (targetId: string | number) => Promise<boolean> }>;
const TypedCommentItem = CommentItem as React.ComponentType<{ comment: BookmarkedComment; post?: unknown; onRemoveBookmark?: () => Promise<boolean> }>;

type Row =
    | { key: string; kind: 'post'; postId: string | number; targetId: string }
    | { key: string; kind: 'comment'; comment: BookmarkedComment; targetId: string };

const BookmarkList: React.FC<{ folderId?: string }> = ({ folderId }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const page = useRef(1);
    const inFlight = useRef(false);

    const load = useCallback(async (reset: boolean) => {
        if (inFlight.current) {
            return;
        }
        inFlight.current = true;
        setLoading(true);
        setError(null);
        const targetPage = reset ? 1 : page.current + 1;

        try {
            const items = await getBookmarks({ page: targetPage, limit: PAGE_SIZE, folderId });
            const posts = items.filter(item => item.target_type === 'post' && Array.isArray(item.post?.postblocks));
            const postIds = usePStore.getState().addPostEntities(posts.map(item => item.post), { bookmarked: true });
            const postIdByBookmark = new Map(posts.map((item, index) => [item.id, postIds[index]]));

            const nextRows: Row[] = [];
            items.forEach(item => {
                if (item.target_type === 'post' && postIdByBookmark.has(item.id)) {
                    nextRows.push({ key: item.id, kind: 'post', postId: postIdByBookmark.get(item.id) as string | number, targetId: item.target_id });
                } else if (item.target_type === 'comment' && item.comment) {
                    nextRows.push({ key: item.id, kind: 'comment', comment: item.comment, targetId: item.target_id });
                }
            });

            page.current = targetPage;
            setHasMore(items.length >= PAGE_SIZE);
            setRows(current => (reset ? nextRows : [...current, ...nextRows]));
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Could not load bookmarks.');
        } finally {
            inFlight.current = false;
            setLoading(false);
        }
    }, [folderId]);

    useEffect(() => {
        load(true);
    }, [load]);

    const renderItem = ({ item }: { item: Row }) => {
        const removeBookmark = async () => {
            try {
                await deleteBookmark(item.targetId);
                setRows(current => current.filter(row => row.key !== item.key));
                return true;
            } catch {
                Alert.alert('Could not remove bookmark', 'Please try again.');
                return false;
            }
        };

        if (item.kind === 'post') {
            return <TypedPostComponent postId={item.postId} onRemoveBookmark={removeBookmark} />;
        }
        const post = usePStore.getState().getPost(item.comment.post_id) ?? undefined;
        return <TypedCommentItem comment={item.comment} post={post} onRemoveBookmark={removeBookmark} />;
    };

    const renderEmpty = () => {
        if (loading) {
            return <ActivityIndicator style={styles.empty} color={colors.accent} />;
        }
        if (error) {
            return (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>{error}</Text>
                    <Pressable onPress={() => load(true)} accessibilityRole="button">
                        <Text style={styles.retry}>Try again</Text>
                    </Pressable>
                </View>
            );
        }
        return <Text style={[styles.empty, styles.emptyText]}>Nothing bookmarked yet</Text>;
    };

    return (
        <FlatList
            data={rows}
            keyExtractor={row => row.key}
            renderItem={renderItem}
            onEndReached={() => {
                if (hasMore && !loading && !error) {
                    load(false);
                }
            }}
            onEndReachedThreshold={0.2}
            refreshControl={
                <RefreshControl
                    refreshing={loading && rows.length > 0}
                    onRefresh={() => load(true)}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={loading && rows.length > 0 ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null}
        />
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    empty: {
        minHeight: 200,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    emptyText: {
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
    footer: {
        minHeight: 56,
    },
});

export default BookmarkList;
