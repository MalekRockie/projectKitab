import { useCallback, useEffect, useState } from 'react';
import { getPostComments } from '../services/api/feed/post/post';

export const COMMENT_SORT_OPTIONS = [
    { name: 'Most Recent', value: 'recent' },
    { name: 'Top Comments', value: 'top' },
];

// Loads a post's comments for the selected sort order and keeps the stored
// comment count in sync with the server's total.
export default function usePostComments(post, updatePost) {
    const [comments, setComments] = useState();
    const [sort, setSort] = useState(COMMENT_SORT_OPTIONS[1]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchComments = useCallback(async (option) => {
        if (!post) {return;}
        try {
            const response = await getPostComments(post.id, option.value);
            setComments(response.comments);
            if (response.total_count !== post.commentCount) {
                updatePost(post.id, { commentCount: response.total_count });
            }
        } catch (error) {
            console.warn('Could not load comments', error);
        }
    }, [post, updatePost]);

    useEffect(() => {
        fetchComments(sort);
    }, [fetchComments, sort]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await fetchComments(sort);
        setRefreshing(false);
    }, [fetchComments, sort]);

    return { comments, sort, setSort, refreshing, refresh };
}
