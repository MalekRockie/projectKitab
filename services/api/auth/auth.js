import { publicApi } from "../base";
import { useUTStore } from "../../storage/store/tstore";
import { MMKVLoader } from "react-native-mmkv-storage";

const api = publicApi;
const MMKV = new MMKVLoader()
    .withEncryption()
    .initialize();

export const auth = async (eml, pswrd) => {
    await api.post('/api/v1/login', {
        email: eml,
        password: pswrd
    }).then(response => {
        MMKV.setString("authToken", response.data.token.access_token);
        MMKV.setString("refreshToken", response.data.token.refresh_token);
        useUTStore.getState().login(response.data.token.access_token);
    }).catch(error => {
        console.error("Auth Error: ", error.response.data.error);
    });
}

export const reAuth = async () => {
    const rtoken = await MMKV.getStringAsync("refreshToken");
    console.log("attempting to refresh");
    try {
        const response = await api.post('/api/v1/refreshtoken', {
            refresh_token: rtoken
        });
        console.log("Refresh Successful");
        useUTStore.getState().login(response.data.access_token);
        MMKV.setString("authToken", response.data.access_token);
        MMKV.setString("refreshToken", response.data.refresh_token);
        console.log("Refresh Token: ", MMKV.getString("refreshToken"));
        return "response.data.token";
    } catch(error) {
        console.error("ReAuth Error: ", error.response.data.error);
    }
}



export const Logout = () => {
    MMKV.removeItem("authToken");
    useUTStore.getState().logout();
    console.log("User logged out");
}