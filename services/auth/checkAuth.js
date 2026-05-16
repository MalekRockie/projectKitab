import { MMKVLoader } from "react-native-mmkv-storage";
import { useUTStore } from "../storage/store/tstore";
import { auth } from "../api/auth/auth";
import { getCurrentUser } from "../api/user/currentUser";
import { useCUserStore } from "../storage/store/cUserStore";

const MMKV = new MMKVLoader()
    .withEncryption()
    .initialize();

export const getStoredToken = async () => {
    const token = await MMKV.getStringAsync("authToken");
    if (token) {
        return token;
    } else return "";
}

export const getRToken = async () => {
    const rtoken = await MMKV.getStringAsync("refreshToken");
    if (rtoken) {
        return rtoken;
    } else return "";
}

export const authenticate = async (email, password) => {
    try {
        const response = await auth(email, password);
        if(response){
            getCurrentUser(useCUserStore.getState().updateProfile);
        }
    } catch (error){
        console.log(error);
    }
}