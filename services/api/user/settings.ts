import { privateApi } from "../base";

export type RemoteUserSettings = {
  theme: "light" | "dark" | "system";
  fontSize: number;
  mediaAutoplay: boolean;
  reduceMotion: boolean;
  updated_at: string;
  language: string;
};


export async function fetchUserSettings(): Promise<RemoteUserSettings> {
  const response = await privateApi.get("/api/p/v1/settings");
  console.log(response.data.usettings);
  if (!response.data?.usettings) {
    throw new Error("No settings returned from server");
  }
  return response.data.usettings;
}