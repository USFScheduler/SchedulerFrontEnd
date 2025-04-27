import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "../components/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider> {/* Wrap everything inside ThemeProvider */}
      <Stack>
        <Stack.Screen name="signin" options={{ title: "Sign In" }} />
        <Stack.Screen name="register" options={{ title: "Register" }} />
        <Stack.Screen name="home" options={{ title: "Home" }} />
        <Stack.Screen name="calendar" options={{ title: "Calendar" }} />
      </Stack>
    </ThemeProvider>
  );
}
