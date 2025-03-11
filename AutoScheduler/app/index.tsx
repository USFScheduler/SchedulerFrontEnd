import { useEffect, useState } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (navigationState?.key && !isReady) {
      setIsReady(true);
      router.replace("/signin"); // Navigate only when the router is ready
    }
  }, [navigationState, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return null; // No UI, just redirects once ready
}
