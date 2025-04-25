import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const storage = {
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key: string): Promise<string | null> => {
    return Platform.OS === "web"
      ? localStorage.getItem(key)
      : await SecureStore.getItemAsync(key);
  },
  deleteItem: async (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await storage.setItem("access_token", accessToken);
  await storage.setItem("refresh_token", refreshToken);
};

export const getAccessToken = async () => {
  return await storage.getItem("access_token");
};

export const getRefreshToken = async () => {
  return await storage.getItem("refresh_token");
};

export const clearTokens = async () => {
  await storage.deleteItem("access_token");
  await storage.deleteItem("refresh_token");
};

export const saveUserId = async (userId: number) => {
  await storage.setItem("user_id", userId.toString());
};

export const getUserId = async (): Promise<string | null> => {
  return await storage.getItem("user_id");
};
