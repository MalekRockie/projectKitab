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