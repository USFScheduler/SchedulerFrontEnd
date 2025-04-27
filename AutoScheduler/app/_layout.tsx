import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
    }}
    >
      <Stack.Screen name="signin" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
      <Stack.Screen name="home" options={{ title: "Home" }} />
      <Stack.Screen name="calendar" options={{ title: "Calendar" }} />  
    </Stack>

  );
}
