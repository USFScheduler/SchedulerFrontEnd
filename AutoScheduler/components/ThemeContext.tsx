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

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: {
    backgroundColor: string;
    cardColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
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
  },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Define your theme object based on darkMode
  const theme = darkMode
    ? {
        backgroundColor: "#000000",
        cardColor: "#1e1e1e",
        textColor: "#ffffff",
        buttonColor: "#333333",
        buttonTextColor: "#ffffff",
      }
    : {
        backgroundColor: "#f4f4f4",
        cardColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#000000",
        buttonTextColor: "#ffffff",
      };

  // Load dark mode preference
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
