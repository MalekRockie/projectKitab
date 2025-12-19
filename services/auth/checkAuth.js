import { MMKVLoader } from "react-native-mmkv-storage";
import { useUTStore } from "../storage/store/tstore";

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