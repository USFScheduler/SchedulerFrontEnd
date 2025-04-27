import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, List, Home, Settings, Pencil } from "lucide-react-native";
import { useTheme } from "../components/ThemeContext"; 

const AppNavBar: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme(); 

  return (
    <View style={[styles.navbar, { backgroundColor: theme.navBarColor, borderTopColor: theme.navBarBorderColor }]}>
      {/* Calendar */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/calendar')}>
        <Calendar size={24} color={theme.iconColor} />
        <Text style={[styles.navButtonText, { color: theme.textColor }]}>Calendar</Text>
      </TouchableOpacity>

      {/* List */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/finalize')}>
        <List size={24} color={theme.iconColor} />
        <Text style={[styles.navButtonText, { color: theme.textColor }]}>List</Text>
      </TouchableOpacity>

      {/* spacer */}
      <View style={{ flex: 1 }} />

      {/* Home */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/home')}>
        <View style={[styles.homeButtonCircle, { backgroundColor: theme.homeButtonBackground }]}>
          <Home size={28} color={theme.iconColor} />
        </View>
        <Text style={[styles.homeButtonText, { color: theme.textColor }]}>Home</Text>
      </TouchableOpacity>

      {/* spacer */}
      <View style={{ flex: 1 }} />

      {/* Tasks */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/schedule')}>
        <Pencil size={24} color={theme.iconColor} />
        <Text style={[styles.navButtonText, { color: theme.textColor }]}>Tasks</Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings')}>
        <Settings size={24} color={theme.iconColor} />
        <Text style={[styles.navButtonText, { color: theme.textColor }]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  navButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  homeButton: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  homeButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  homeButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default AppNavBar;
