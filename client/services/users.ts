import api from "./api";
import { User } from "../types";

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/users/profile");
    return response.data;
  },

  updateProfile: async (data: { password?: string }): Promise<User> => {
    const response = await api.patch<User>("/users/profile", data);
    return response.data;
  },

  updatePushToken: async (expoPushToken: string): Promise<void> => {
    await api.patch("/users/push-token", { expoPushToken });
  },

  addCoins: async (amount: number): Promise<User> => {
    const response = await api.patch<User>("/users/coins/add", { amount });
    return response.data;
  },
};
