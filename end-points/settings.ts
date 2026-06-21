import {
  settingsSchema,
  settingsUpdateSchema,
  type Settings,
} from "@/schema/setting";
import { getStoredToken, request } from "@/end-points/http";

export const settings = {
  async getSettings(): Promise<Settings> {
    const data = await request<unknown>("/settings", {
      method: "GET",
    });

    return settingsSchema.parse(data);
  },

  async updateSettings(input: Partial<Settings>): Promise<Settings> {
    const payload = settingsUpdateSchema.parse(input);
    const data = await request<unknown>("/settings", {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });

    return settingsSchema.parse(data);
  },
};
