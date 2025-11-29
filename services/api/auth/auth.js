import base from "../base";
import { useUTStore } from "../../storage/store/tstore";

const api = base;

export const auth = async (eml, pswrd) => {
    await api.post('/api/v1/login', {
        email: eml,
        password: pswrd
    }).then(response => {
        useUTStore.getState().login(response.data.token);
    }).catch(error => {
        console.error("Auth Error: ", error.response.data.error);
    });
}