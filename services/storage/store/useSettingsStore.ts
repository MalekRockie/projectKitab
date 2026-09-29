import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemePreference = "light" | "dark" | "system";

type UserSettings = {
    theme: ThemePreference;
    fontSize: number;
    mediaAutoplay: boolean;
    reduceMotion: boolean;
    updated_at: string; // ISO string - Date instances don't survive JSON persistence
    language: string;
};

type UserSettingsStore = UserSettings & {
    updateSettings: (newSettings: Partial<Omit<UserSettings, "updatedAt">>) => void;
    clearSettings: () => void;
    hydrateFromRemote: (remote: UserSettings) => void;
};

const DEFAULT_SETTINGS: Omit<UserSettings, "updated_at"> = {
    theme: "system",
    fontSize: 16,
    mediaAutoplay: false,
    reduceMotion: false,
    language: "",
};

// Deliberately ancient - NOT "now". This value only ever means "this
// device has no real settings yet." If it were "now", a fresh install's
// fake-fresh timestamp would beat almost any genuine (older) server
// timestamp, and hydrateFromRemote would reject real server data forever.
const NEVER_SYNCED = new Date(0).toISOString();

export const useUserSettingsStore = create<UserSettingsStore>()(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,
            updated_at: NEVER_SYNCED,

            updateSettings: (newSettings) => {
                console.log("updated!!");
                set({
                    ...newSettings,
                    updated_at: new Date().toISOString(),
                });
            },

            clearSettings: () => {
                console.log("cleared!!");
                // A deliberate local action taken right now, unlike the
                // epoch marker above - this SHOULD win against older
                // remote data, so it gets a real current timestamp.
                set({
                    ...DEFAULT_SETTINGS,
                    updated_at: new Date().toISOString(),
                });
            },

            hydrateFromRemote: (remote) => {
                set((state) => {
                    const remoteTime = new Date(remote.updated_at).getTime();
                    const localTime = new Date(state.updated_at).getTime();

                    if (Number.isNaN(remoteTime)) {
                        // If you see this warning, remote.updatedAt isn't a
                        // parseable date string - check the actual key name
                        // your API returns (e.g. updated_at vs updatedAt).
                        console.warn(
                            "hydrateFromRemote: remote.updatedAt didn't parse:",
                            remote.updated_at
                        );
                        return state;
                    }

                    return remoteTime > localTime ? remote : state;
                });
            },
        }),
        {
            name: "currentSettings",
            storage: createJSONStorage(() => AsyncStorage),
            version: 1, // bump this + add a `migrate` fn whenever UserSettings shape changes
            partialize: (state) => ({
                theme: state.theme,
                fontSize: state.fontSize,
                mediaAutoplay: state.mediaAutoplay,
                reduceMotion: state.reduceMotion,
                updatedAt: state.updated_at,
                language: state.language,
            }),
        }
    )
);