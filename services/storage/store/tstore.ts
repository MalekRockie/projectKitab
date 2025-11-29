import { create } from 'zustand';

type UTStore = {
    userToken: string ;
    isLoggedIn: boolean;
    login: (token: string) => void;
    logout: () => void;
}

export const useUTStore = create<UTStore>((set) => ({
    userToken: "",
    isLoggedIn: false,
    login: (token: string) => {
        set({ userToken: token, isLoggedIn: true });
    },
    logout: () => {
        set({ userToken: "", isLoggedIn: false });
    }
}))