import { privateApi } from '../../base';

export async function repostPost(postId) {
    const response = await privateApi.post(`/api/p/v1/posts/${encodeURIComponent(postId)}/repost`);
    return response.data;
}

export async function createQuoteRepost(post, text) {
    const postId = post?.id;
    if (!postId) {
        throw new Error('Cannot quote repost a post without an ID.');
    }

    const content = text.trim();
    if (!content) {
        throw new Error('Add a comment before creating a quote repost.');
    }

    const response = await privateApi.post('/api/p/v1/makepost', {
        shared_post_id: String(postId),
        postblocks: [{ block_type: 'text', content, display_order: 1 }],
        privacy_level: post.privacyLevel ?? post.privacy_level ?? 'public',
        layout_mode: post.layout_mode ?? 'inline',
    });

    return response.data;
}
