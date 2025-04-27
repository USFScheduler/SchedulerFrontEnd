import axios from 'axios';
import { Platform } from 'react-native'; // 👈 add this
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenStorage';

const isMobile = Platform.OS !== 'web'; // true if on iOS or Android Expo Go
const LOCAL_IP = '192.168.1.11'; // <-- change to your actual computer IP
const baseURL = isMobile 
  ? `http://${LOCAL_IP}:3000/api/v1`
  : 'http://localhost:3000/api/v1'; // 👈 dynamically switch

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});
// Automatically attach access token to each request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically refresh token on 401 error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${baseURL.replace('/api/v1', '')}/api/v1/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = res.data;
        await saveTokens(access_token, refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);  
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
