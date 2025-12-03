import axios from "axios";
import { useUTStore } from "../storage/store/tstore";
import { Logout } from "./auth/auth";


export const publicApi = axios.create({
    baseURL: 'http://10.0.2.2:8080',
    headers: {
        'Accept': 'application/json',
    }
})

export const privateApi =  axios.create({
    baseURL: 'http://10.0.2.2:8080',
});

privateApi.interceptors.request.use(req => {
    req.headers['Accept'] = 'application/json';
    req.headers['Authorization'] = `Bearer ${useUTStore.getState().userToken}`;
    console.log('req set');
    return req;
},(error) =>{
    console.log(error.response)
});

privateApi.interceptors.response.use(res => {
    console.log('response set');
    return res;
},(error) =>{
    console.log(error.response)
});



export default publicApi;