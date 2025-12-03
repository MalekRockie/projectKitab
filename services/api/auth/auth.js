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
        console.log("Login Successful");
        console.log("Token: ", response.data.token.access_token);
        MMKV.setString("authToken", response.data.token.access_token);
        useUTStore.getState().login(response.data.token.access_token);
    }).catch(error => {
        console.error("Auth Error: ", error.response.data.error);
    });
}

export const Logout = () => {
    MMKV.removeItem("authToken");
    useUTStore.getState().logout();
    console.log("User logged out");
}