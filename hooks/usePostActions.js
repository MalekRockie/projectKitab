import { useCallback, useState } from 'react';
import { bookmarkTarget, togglePostLike } from '../services/api/feed/post/post';

// Optimistic like/bookmark handlers with rollback on failure.
export default function usePostActions(post, updatePost) {
    const [isLiked, setIsLiked] = useState(post?.isLiked);
    const [isBookmarked, setIsBookmarked] = useState(post?.isBookmarked ?? false);

    const toggleLike = useCallback(async () => {
        const previous = isLiked;
        setIsLiked(!previous);
        try {
            await togglePostLike(post.id, post.likesCount, updatePost);
        } catch (error) {
            console.log(error);
            setIsLiked(previous);
        }
    }, [isLiked, post, updatePost]);

    const toggleBookmark = useCallback(async () => {
        const next = !isBookmarked;
        setIsBookmarked(next);
        updatePost(post.id, { isBookmarked: next });
        const ok = await bookmarkTarget('post', post.id);
        if (!ok) {
            setIsBookmarked(!next);
            updatePost(post.id, { isBookmarked: !next });
        }
    }, [isBookmarked, post, updatePost]);

    return { isLiked, isBookmarked, toggleLike, toggleBookmark };
}
