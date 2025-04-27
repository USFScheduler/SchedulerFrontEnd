import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { getUserInfo, clearTokens } from "../utils/tokenStorage";
import { useTheme } from "../components/ThemeContext";
import AppNavBar from "../components/TabBar"; 

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

  const router = useRouter();
  const { darkMode, toggleDarkMode, theme } = useTheme();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const info = await getUserInfo();
      if (info) {
        setUserInfo(info);
      } else {
        console.warn("No user info found.");
      }
    };
    fetchUserInfo();
  }, []);

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill out both password fields.");
      return;
    }

    Alert.alert("Success", "Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setShowPasswordFields(false);
  };

  const handleSignOut = async () => {
    await clearTokens();
    router.replace("/signin");
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerShown: true,
          headerBackVisible: true,
        }}
      />
      
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* User Info Card */}
        {userInfo && (
          <View style={[styles.userCard, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.userInfoTitle, { color: theme.textColor }]}>Account Info</Text>
            <Text style={[styles.userInfoText, { color: theme.textColor }]}>Name: {userInfo.name}</Text>
            <Text style={[styles.userInfoText, { color: theme.textColor }]}>Email: {userInfo.email}</Text>
          </View>
        )}

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.cardColor }]}>
          <Text style={[styles.label, { color: theme.textColor }]}>Enable Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>

        {/* Dark Mode */}
        <View style={[styles.section, { backgroundColor: theme.cardColor }]}>
          <Text style={[styles.label, { color: theme.textColor }]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>

        {/* Change Password */}
        <View style={[styles.passwordCard, { backgroundColor: theme.cardColor }]}>
          <TouchableOpacity onPress={() => setShowPasswordFields(!showPasswordFields)}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>
              Change Password {showPasswordFields ? "" : ""}
            </Text>
          </TouchableOpacity>

          {showPasswordFields && (
            <>
              <TextInput
                placeholder="Current Password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={[
                  styles.input,
                  { backgroundColor: darkMode ? "#2a2a2a" : "white", color: theme.textColor },
                ]}
                placeholderTextColor={darkMode ? "#aaa" : "#999"}
              />
              <TextInput
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={[
                  styles.input,
                  { backgroundColor: darkMode ? "#2a2a2a" : "white", color: theme.textColor },
                ]}
                placeholderTextColor={darkMode ? "#aaa" : "#999"}
              />

              <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonColor }]} onPress={handlePasswordChange}>
                <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Change Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: theme.buttonColor }]} onPress={handleSignOut}>
          <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ✅ Nav Bar at Bottom */}
      <AppNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  userInfoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
  },
  passwordCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "normal",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontWeight: "bold",
  },
  signOutButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
});
