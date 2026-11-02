import { getBlockType } from '../../utils/postBlocks';

export function getPostShareInfo(post) {
    const originalCandidate = post?.repost_of
        ?? post?.repostOf
        ?? post?.shared_post
        ?? post?.sharedPost
        ?? post?.original_post
        ?? post?.originalPost
        ?? post?.quoted_post
        ?? post?.quotedPost
        ?? post?.quote_post
        ?? post?.reposted_post
        ?? post?.quote?.post
        ?? post?.quote
        ?? post?.repost?.original_post
        ?? post?.repost?.post
        ?? post?.repost;
    const originalPost = originalCandidate && typeof originalCandidate === 'object'
        ? (originalCandidate.post ?? originalCandidate)
        : null;
    const sharedPostId = post?.shared_post_id ?? post?.sharedPostId ?? null;
    const hasOwnContent = (post?.postblocks ?? post?.blocks ?? [])
        .some(block => ['text', 'image', 'video'].includes(getBlockType(block)));
    const hasSharedPost = Boolean(originalPost || sharedPostId);
    const isQuotePost = Boolean(hasSharedPost && (
        post?.is_quote
        || post?.isQuote
        || hasOwnContent
    ));

    return {
        originalPost,
        sharedPostId,
        isQuotePost,
        isPlainRepost: Boolean(hasSharedPost && !isQuotePost),
        reposter: post?.reposted_by?.username
            ?? post?.reposted_by?.display_name
            ?? post?.reposted_by_username
            ?? post?.user?.username
            ?? post?.username
            ?? 'Someone',
    };
}

export function normalizePostForDetail(post) {
    const source = post?.post ?? post;
    return {
        ...source,
        createdAt: source.createdAt ?? source.created_at,
        likesCount: source.likesCount ?? source.likes_count ?? 0,
        commentCount: source.commentCount ?? source.comments_count ?? 0,
        isLiked: source.isLiked ?? source.is_liked ?? false,
        isBookmarked: source.isBookmarked ?? source.is_bookmarked ?? false,
        user: source.user ?? {
            id: source.user_id,
            username: source.username,
            avatar: source.user_avatar ?? source.avatar_url,
        },
        user_avatar: source.user_avatar ?? source.avatar_url ?? source.user?.avatar ?? source.user?.avatar_url,
        postblocks: source.postblocks ?? source.blocks ?? [],
    };
}
