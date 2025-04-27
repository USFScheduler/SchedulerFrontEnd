import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Platform-safe storage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

type ThemeColors = {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  navBarColor: string;
  navBarBorderColor: string;
  iconColor: string;
  homeButtonBackground: string;
  placeholderColor: string;
};

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  theme: {
    backgroundColor: "#f4f4f4",
    cardColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    navBarColor: "#ffffff",
    navBarBorderColor: "#dddddd",
    iconColor: "#333333",
    homeButtonBackground: "rgba(0, 102, 204, 0.1)",
    placeholderColor: "#888888",
  },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme: ThemeColors = darkMode
    ? {
        backgroundColor: "#000000",
        cardColor: "#1a1a1a",
        textColor: "#ffffff",
        buttonColor: "#333333",
        buttonTextColor: "#ffffff",
        navBarColor: "#111111",
        navBarBorderColor: "#333333",
        iconColor: "#ffffff",
        homeButtonBackground: "#333333",
        placeholderColor: "#aaaaaa", 
      }
    : {
        backgroundColor: "#f4f4f4",
        cardColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#000000",
        buttonTextColor: "#ffffff",
        navBarColor: "#ffffff",
        navBarBorderColor: "#dddddd",
        iconColor: "#333333",
        homeButtonBackground: "rgba(0, 102, 204, 0.1)",
        placeholderColor: "#888888",
      };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await storage.getItem("themeMode");
        if (storedTheme === "dark") {
          setDarkMode(true);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      await storage.setItem("themeMode", newMode ? "dark" : "light");
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
