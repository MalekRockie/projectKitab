import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';


type UserProfile = {
    userId: string;
    username: string;
    bio: string;
    createdAt: Date;
    updatedAt: Date;
    profilePic: string;
}

type CurrentUserStore = UserProfile & {
    updateProfile: (newUserInfo: Partial<UserProfile>) => void;
    clearProfile: () => void;
}

const initialState: UserProfile = {
    userId: "",
    username: "",
    bio: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    profilePic: "",
};

export const useCUserStore = create<CurrentUserStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            updateProfile: (newUserInfo: Partial<UserProfile>) => {
                set(state => ({
                    ...state,
                    ...newUserInfo,
                    
                }));
                
            },
            clearProfile: () => {
                set(initialState);
            },
        }),
        {
            name: 'currentUser',
            storage: createJSONStorage(() => AsyncStorage),
        },    
    ),
)