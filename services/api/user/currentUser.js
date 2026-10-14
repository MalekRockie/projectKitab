import { privateApi } from "../base";


const api = privateApi;

/** @typedef {{ page?: number, limit?: number, hasMedia?: boolean, mediaType?: string, includeComments?: boolean, includeReplies?: boolean, commentsLimit?: number, repliesLimit?: number }} MyPostsOptions */

export async function getCurrentUser (updateProfile) {
        try {
            const response = await api.get('/api/p/v1/myprofile')
            const user = response.data.user;
            console.log(response.data)
            if(response.data){
                updateProfile({
                    userId: user.id,
                    username: user.username,
                    bio: user.bio,
                    createdAt: user.creater_at,
                    updatedAt: user.updated_at,
                    profilePic: "",
                });
                return response.data.user;
            }
        } catch (error){
            console.log(error);
            return null;
        };
    };

export async function getAccount () {
    try {
        const response = await api.get('/api/p/v1/account')
        const user = response.data.user;
        console.log(user)
        if(response.data){
            return response.data.user;
        }
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