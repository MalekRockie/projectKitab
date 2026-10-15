import { privateApi } from "../base";

export type RemoteUserSettings = {
  theme: "light" | "dark" | "system";
  fontSize: number;
  mediaAutoplay: boolean;
  reduceMotion: boolean;
  updated_at: string;
  language: string;
  is_premium?: boolean;
};


export async function fetchUserSettings(): Promise<RemoteUserSettings> {
  const response = await privateApi.get("/api/p/v1/settings");
  if (!response.data?.usettings) {
    throw new Error("No settings returned from server");
  }
  return response.data.usettings;
}

export async function patchUserSettings(
  settings: Partial<Omit<RemoteUserSettings, "updated_at">>
): Promise<void> {
  await privateApi.patch("/api/p/v1/settings", settings);
}