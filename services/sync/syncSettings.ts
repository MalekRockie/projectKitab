import { useUserSettingsStore } from "../storage/store/useSettingsStore";
import { fetchUserSettings } from "../api/user/settings";

const MIN_SYNC_INTERVAL_MS = 30_000; // don't re-check more than once per 30s

let lastSyncedAt = 0;
let inFlight: Promise<void> | null = null;

/**
 * Fetches settings from the server and reconciles with local state via
 * updatedAt (last-write-wins, handled inside hydrateFromRemote).
 *
 * Safe to call from multiple places (app launch, foreground resume, a
 * screen's focus effect) without callers needing to coordinate:
 * - Concurrent calls piggyback on whichever fetch is already in flight.
 * - Calls within MIN_SYNC_INTERVAL_MS of the last attempt are skipped,
 *   unless `force` is true (e.g. a manual pull-to-refresh).
 */
export function syncSettingsFromServer(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() - lastSyncedAt < MIN_SYNC_INTERVAL_MS) {
    return Promise.resolve();
  }

  lastSyncedAt = Date.now();
  inFlight = (async () => {
    try {
      const remote = await fetchUserSettings();
      useUserSettingsStore.getState().hydrateFromRemote(remote);
    } catch (err) {
      // Fetch failing is fine - the persisted local copy is still valid
      console.warn("Settings sync failed", err);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}