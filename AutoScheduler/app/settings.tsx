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
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getUserInfo, clearTokens, saveWorkHours, getWorkHours } from "../utils/tokenStorage";
import AppNavBar from "../components/TabBar";
import { useTheme } from "../components/ThemeContext";

import { generateMasterSchedule } from "../utils/masterSchedule";
import { getUserId } from "../utils/tokenStorage";
import api from "../api/api";


export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [workStartTime, setWorkStartTime] = useState<Date>(new Date(0, 0, 0, 9, 0));
  const [workEndTime, setWorkEndTime] = useState<Date>(new Date(0, 0, 0, 22, 0));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const router = useRouter();
  const { darkMode, toggleDarkMode, theme } = useTheme();

  useEffect(() => {
    const fetchUserInfoAndHours = async () => {
      const info = await getUserInfo();
      if (info) setUserInfo(info);

      const savedHours = await getWorkHours();
      if (savedHours) {
        const { start, end } = savedHours;
        setWorkStartTime(parseTimeStringToDate(start));
        setWorkEndTime(parseTimeStringToDate(end));
      }
    };

    fetchUserInfoAndHours();
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

  const handleSaveWorkHours = async () => {
    try {
      const start = formatDateToTimeString(workStartTime);
      const end = formatDateToTimeString(workEndTime);
      await saveWorkHours(start, end);
  
      // NEW: Regenerate the Master Schedule after saving work times
      const userId = await getUserId();
      if (!userId) throw new Error("No user ID found!");
  
      const [tasksRes, assignmentsRes] = await Promise.all([
        api.get(`tasks/user/${userId}`),
        api.get(`/canvas/upcoming_assignments?user_id=${userId}`),
      ]);
  
      const solidTasks = tasksRes.data.map((t: any) => ({
        id: t.id,
        title: t.title,
        start_time: t.start_time,
        end_time: t.end_time,
        start_date: t.start_date,
        days_of_week: t.days_of_week,
        am_start: t.am_start,
        am_end: t.am_end,
        type: "task" as const,
      }));
  
      const assignments = assignmentsRes.data.map((a: any) => ({
        id: a.id,
        title: a.title,
        due_date: a.deadline,
      }));
  
      await generateMasterSchedule(solidTasks, assignments);
      console.log("✅ MasterSchedule regenerated after work hours update");
  
      Alert.alert("Saved", "Work time preferences saved and schedule updated!");
    } catch (error) {
      console.error("❌ Error updating schedule after work hours change:", error);
      Alert.alert("Error", "Something went wrong updating the schedule.");
    }
  };
  

  const formatDateToTimeString = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const parseTimeStringToDate = (time: string): Date => {
    const [hour, minute] = time.split(":").map(Number);
    return new Date(0, 0, 0, hour, minute);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerShown: false,
          headerBackVisible: true,
        }}
      />

      <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
        <ScrollView contentContainerStyle={styles.container}>

          {/* User Info */}
          {userInfo && (
            <View style={[styles.userCard, { backgroundColor: theme.cardColor }]}>
              <Text style={[styles.userInfoTitle, { color: theme.textColor }]}>Account Info</Text>
              <Text style={[styles.userInfoText, { color: theme.textColor }]}>Name: {userInfo.name}</Text>
              <Text style={[styles.userInfoText, { color: theme.textColor }]}>Email: {userInfo.email}</Text>
            </View>
          )}

          {/* Work Time Preferences */}
          <View style={[styles.userCard, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.userInfoTitle, { color: theme.textColor }]}>Work Time Preferences</Text>

            {/* Start Time */}
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.textColor }]}>Start Time</Text>
              {Platform.OS === "web" ? (
                <input
                  type="time"
                  value={formatDateToTimeString(workStartTime)}
                  onChange={(e) => setWorkStartTime(parseTimeStringToDate(e.target.value))}
                  style={{ backgroundColor: "transparent", color: theme.textColor, border: "none" }}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                  <Text style={[styles.timeValue, { color: theme.textColor }]}>
                    {formatDateToTimeString(workStartTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {showStartPicker && (
              <DateTimePicker
                value={workStartTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setWorkStartTime(selectedDate);
                }}
              />
            )}

            {/* End Time */}
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.textColor }]}>End Time</Text>
              {Platform.OS === "web" ? (
                <input
                  type="time"
                  value={formatDateToTimeString(workEndTime)}
                  onChange={(e) => setWorkEndTime(parseTimeStringToDate(e.target.value))}
                  style={{ backgroundColor: "transparent", color: theme.textColor, border: "none" }}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                  <Text style={[styles.timeValue, { color: theme.textColor }]}>
                    {formatDateToTimeString(workEndTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {showEndPicker && (
              <DateTimePicker
                value={workEndTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setWorkEndTime(selectedDate);
                }}
              />
            )}

            {/* Save Work Time */}
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.buttonColor }]} onPress={handleSaveWorkHours}>
              <Text style={[styles.saveButtonText, { color: theme.buttonTextColor }]}>Save Work Time</Text>
            </TouchableOpacity>
          </View>

          {/* Notifications Toggle */}
          <View style={[styles.section, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.label, { color: theme.textColor }]}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>

          {/* Dark Mode Toggle */}
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
                  style={[styles.input, { backgroundColor: darkMode ? "#2a2a2a" : "white", color: theme.textColor }]}
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                />
                <TextInput
                  placeholder="New Password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={[styles.input, { backgroundColor: darkMode ? "#2a2a2a" : "white", color: theme.textColor }]}
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

        {/* Bottom Nav Bar */}
        <AppNavBar />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  userCard: { borderRadius: 12, padding: 20, marginBottom: 20 },
  userInfoTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  userInfoText: { fontSize: 16, marginBottom: 5 },
  section: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: 15, marginBottom: 15 },
  label: { fontSize: 16 },
  passwordCard: { borderRadius: 12, padding: 20, marginTop: 10 },
  cardTitle: { fontSize: 16, fontWeight: "normal" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginTop: 10 },
  button: { padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { fontWeight: "bold" },
  signOutButton: { padding: 15, borderRadius: 8, alignItems: "center", marginTop: 30 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timeLabel: { fontSize: 16 },
  timeValue: { fontSize: 16, fontWeight: "bold" },
  saveButton: { padding: 12, borderRadius: 8, marginTop: 10, alignItems: "center" },
  saveButtonText: { fontWeight: "bold" },
});
