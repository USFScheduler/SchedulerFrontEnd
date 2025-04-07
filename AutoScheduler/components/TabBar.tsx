import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

const tabs = [
  { name: "Day View", route: "/finalize" },
  { name: "Week View", route: "/week" },
  { name: "Add Data", route: "/schedule" },
  { name: "Empty", route: "/empty" },
] as const;

const TabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          onPress={() => {
            if (pathname !== tab.route) {
              router.push(tab.route as any);
            }
          }}
        >
          <Text
            style={[
              styles.tab,
              pathname === tab.route && styles.activeTab,
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  tab: {
    color: "#888",
    fontSize: 14,
  },
  activeTab: {
    color: "#000",
    fontWeight: "bold",
  },
});

export default TabBar;
