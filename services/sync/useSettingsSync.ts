import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useUserSettingsStore } from "../storage/store/useSettingsStore"; 
import { syncSettingsFromServer } from "./syncSettings";

/**
 * Mount this ONCE near the root of the app (e.g. in App.tsx), not per-screen.
 * Triggers a (throttled, deduped) sync on cold start and whenever the app
 * comes back to the foreground.
 */
export function useSettingsSync() {
    const appState = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        // Wait for the local persisted copy to finish loading before the first
        // sync. Otherwise `state.updatedAt` is still the fresh in-memory default
        // (right now) rather than the real last-known local value, and the
        // remote copy will almost always look "older" by comparison and get
        // skipped even when it shouldn't be.
        if (useUserSettingsStore.persist.hasHydrated()) {
        syncSettingsFromServer();
        } else {
        useUserSettingsStore.persist.onFinishHydration(() => {
            syncSettingsFromServer();
        });
        }

    const subscription = AppState.addEventListener("change", (next) => {
        if (appState.current.match(/inactive|background/) && next === "active") {
                syncSettingsFromServer(); // app just came back to the foreground
            }
            appState.current = next;
        });

        return () => subscription.remove();
    }, []);
}