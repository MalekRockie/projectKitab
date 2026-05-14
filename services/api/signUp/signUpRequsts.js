import { getformatDateWithH } from "../../../utils/date";
import { useUTStore } from "../../storage/store/tstore";
import { MMKVLoader } from "react-native-mmkv-storage";
import publicApi from "../base";
import { useCUserStore} from "../../storage/store/cUserStore";
const MMKV = new MMKVLoader()
        .withEncryption()
        .initialize();

export async function checkEmailAvailability(email){
        const response = await publicApi.post(`/api/v1/users/checkEmailAvailablity`, email);
        return response.data.Available
}

export async function checkUsernameAvailability(username) {
        const response = await publicApi.post(`api/v1/users/checkUsernameAvailability`, username);
        return response.data;
}

export async function registrationRequest(newUser){
        await publicApi.post(`/api/v1/users/register`, {
                username: newUser.username,
                email: newUser.email,
                password: newUser.password,
                date_of_birth: getformatDateWithH(newUser.dateOfBirth)
        }).then(response => {
                useCUserStore.getState().updateProfile({
                        userId: response.data.user.id,
                        username: response.data.user.username,
                        createdAt: response.data.user.created_at,
                        updatedAt: response.data.user.created_at,
                        onboardingCompleted: response.data.user.onboarding_completed
                });
                MMKV.setString("authToken", response.data.token.access_token);
                MMKV.setString("refreshToken", response.data.token.refresh_token);
                useUTStore.getState().login(response.data.token.access_token);
        }).catch(error => {
                console.log("Auth Error: ", error.response.data.error)
        });
}