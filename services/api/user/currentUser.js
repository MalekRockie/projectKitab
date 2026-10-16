import { privateApi } from "../base";


const api = privateApi;

/** @typedef {{ page?: number, limit?: number, hasMedia?: boolean, mediaType?: string, includeComments?: boolean, includeReplies?: boolean, commentsLimit?: number, repliesLimit?: number }} MyPostsOptions */

export async function getCurrentUser (updateProfile) {
    const user = await getAccount();
    if (!user) return null;

    updateProfile({
        userId: user.id,
        username: user.username,
        displayName: user.display_name ?? '',
        bio: user.bio ?? '',
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        profilePic: '',
        onboardingCompleted: user.onboarding_completed ?? false,
    });
    return user;
    };

export async function getPublicProfile(userId) {
    try {
        const response = await api.get(`/api/p/v1/getUserProfile/${encodeURIComponent(userId)}`);
        return response.data.profile ?? null;
    } catch (error) {
        console.log('Could not load public profile', error);
        return null;
    }
}

export async function getAccount () {
    try {
        const response = await api.get('/api/p/v1/account')
        return response.data?.user ?? null;
    } catch (error){
        console.log(error);
        return null;
    }
}

/** @param {MyPostsOptions} [options] */
export async function getMyPosts(options = {}) {
    const {
        page = 1,
        limit = 20,
        hasMedia,
        mediaType,
        includeComments = false,
        includeReplies = false,
        commentsLimit,
        repliesLimit,
    } = options;
    const params = { page, limit };
    if (hasMedia !== undefined) params.has_media = hasMedia;
    if (mediaType) params.media_type = mediaType;
    if (includeComments) params.include_comments = true;
    if (includeReplies) params.include_replies = true;
    if (commentsLimit !== undefined) params.comments_limit = commentsLimit;
    if (repliesLimit !== undefined) params.replies_limit = repliesLimit;

    const response = await api.get('/api/p/v1/users/me/posts', { params });
    return response.data;
}