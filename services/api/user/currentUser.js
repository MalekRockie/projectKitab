import { privateApi } from "../base";
import { useCUserStore } from "../../storage/store/cUserStore";
import { useEffect, useState } from "react";



const api = privateApi;
export const useCurrentUser = () => {

    const [currentUser, setCurrentUser] = useState();
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { updateProfile, clearProfile} = useCUserStore();

    const getCurrentUser = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/p/v1/myprofile')
            console.log(response);
            const user = response.data.user;
            updateProfile({
                userId: user.id,
                username: user.username,
                bio: user.bio,
                createdAt: user.creater_at,
                updatedAt: user.updated_at,
                profilePic: "",
            });
            setCurrentUser(response.data);
            return response.data.user;
            if(!response){
                console.log("retrieve older information from the storage if it can't be fetched");
            }
        } catch (error){
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getCurrentUser();
    }, []);

    return {currentUser, loading, error, refetch: getCurrentUser};
};