import { privateApi } from "../../base";

const api = privateApi;


export async function togglePostLike(postId, likesCount, updatePost) {
    try {
        const response = await api.post(`/api/p/v1/likepost/${postId}`);
        console.log("response: ", response.data.liked);
        updatePost(postId,  {
            isLiked: response.data.liked,
            likesCount: response.data.liked ? likesCount+1 : likesCount-1
        });
        return response.data;
    } catch (error) {
        // console.log("Error: ", error);
        return null;
    }
}

export async function createComment(postId, comment) {
    try{
        console.log("postId ", postId);
        console.log("comment ", comment);
        const response = await api.post(`/api/p/v1/createcomment/${postId}`, comment);
        console.log("responseL ", response.data);
    } catch (error) {
        console.log("An error occured: ", error);
        return null;
    }
}
export async function getPostComments(postID, sortOption) {
    try{
        console.log(sortOption);
        const response = await api.get(`/api/p/v1/posts/${postID}/comments`);
        return response.data;
    } catch (error) {
        console.log("error occured", error);
        return null;
    }
}