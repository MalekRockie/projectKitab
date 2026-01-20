import { privateApi } from "../base";


const api = privateApi;
export async function getCurrentUser (updateProfile) {
        try {
            const response = await api.get('/api/p/v1/myprofile')
            const user = response.data.user;
            // console.log(response.data)
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