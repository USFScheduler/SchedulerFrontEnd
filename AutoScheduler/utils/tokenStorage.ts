import * as SecureStore from 'expo-secure-store';

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('access_token', accessToken);
  await SecureStore.setItemAsync('refresh_token', refreshToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('access_token');
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('refresh_token');
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};
