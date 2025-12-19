import axios from "axios";
import { useUTStore } from "../storage/store/tstore";
import { Logout, reAuth } from "./auth/auth";
import { getRToken } from "../auth/checkAuth";


export const publicApi = axios.create({
    baseURL: 'http://10.0.2.2:8080',
    headers: {
        'Accept': 'application/json',
    }
});


let isRefreshing = false;
let failedQueue = [];

const processQ = (error, token = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};


export const privateApi =  axios.create({
    baseURL: 'http://10.0.2.2:8080',
});

privateApi.interceptors.request.use(req => {
    req.headers['Accept'] = 'application/json';
    req.headers['Authorization'] = `Bearer ${useUTStore.getState().userToken}`;
    
    console.log('req set');
    return req;
},
    error => promise.reject(error)
);


privateApi.interceptors.response.use(
    res => res,
    
    async error => {
    console.log(error.response)
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
        if(originalRequest.url.includes('/refreshtoken')){
            Logout();
            return Promise.reject(error);
        }
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({resolve, reject});
            })
            .then(token => {
                originalRequest.headers.Authorization = 'Bearer ' + token;
                return privateApi(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // console.log("Unauthorized attempt tp refresh token");
            const response = await reAuth();
            // console.log("token refreshed: ", response);
            const newToken = useUTStore.getState().userToken;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQ(null, newToken);
            return privateApi(originalRequest);
        } catch (refreshError) {
            const rtoken = await getRToken();
            // console.log("error refreshing token: ", refreshError);
            processQ(refreshError, null);
            Logout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
});



export default publicApi;