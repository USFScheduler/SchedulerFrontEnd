import TabBar from "../components/TabBar";
import React, { useState } from "react";
import axios from "axios";
import api from '../api/api';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getUserId } from "../utils/tokenStorage";
import { useTheme } from "../components/ThemeContext";

// Define the shape of an Event
type Event = {
  name: string;
  start: string;
  end: string;
  amStart: boolean;
  amEnd: boolean;
  days: string[];
};

const daysOfWeek = ["M", "T", "W", "TH", "F", "S", "SU"];

export default function ScheduleScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();

  const [events, setEvents] = useState<Event[]>([
    { name: "", start: "", end: "", amStart: true, amEnd: true, days: [] },
  ]);

  const addEvent = () => {
    setEvents([
      ...events,
      { name: "", start: "", end: "", amStart: true, amEnd: true, days: [] },
    ]);
  };

  const updateEvent = <K extends keyof Event>(index: number, field: K, value: Event[K]) => {
    const updated = [...events];
    updated[index][field] = value;
    setEvents(updated);
  };

  const toggleDay = (index: number, day: string) => {
    const updated = [...events];
    const currentDays = updated[index].days;
    updated[index].days = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setEvents(updated);
  };

  const toggleAmPm = (index: number, field: "amStart" | "amEnd") => {
    const updated = [...events];
    updated[index][field] = !updated[index][field];
    setEvents(updated);
  };

  const postEvents = async () => {
    try {
      const user_id = await getUserId();
      if (!user_id) throw new Error("User ID is missing.");

      const response = await api.post("/tasks", {
        tasks: events.map(event => ({
          title: event.name,
          start_time: event.start,
          end_time: event.end,
          am_start: event.amStart,
          am_end: event.amEnd,
          days_of_week: event.days,
          user_id: parseInt(user_id),
        })),
      });

      console.log("Schedule submitted successfully:", response.data);
      alert("Schedule submitted successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        alert(`Failed to submit schedule: ${error.response?.data?.message || error.message}`);
      } else {
        console.error("Unexpected error:", error);
        alert(error instanceof Error ? error.message : "An error occurred.");
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.backgroundColor }]}> 
        <Text style={[styles.title, { color: theme.textColor }]}>Add Your Current Schedule</Text>

        {events.map((event, index) => (
          <View key={index} style={[styles.eventBox, { backgroundColor: theme.cardColor }]}>
            <TextInput
              placeholder="Event Name"
              placeholderTextColor={theme.placeholderColor}
              style={[styles.input, { backgroundColor: theme.cardColor, color: theme.textColor, borderColor: theme.navBarBorderColor }]}
              value={event.name}
              onChangeText={(text) => updateEvent(index, "name", text)}
            />

            <View style={styles.row}>
              <TextInput
                placeholder="Start Time (HH:MM)"
                placeholderTextColor={theme.placeholderColor}
                style={[styles.inputHalf, { backgroundColor: theme.cardColor, color: theme.textColor, borderColor: theme.navBarBorderColor }]}
                value={event.start}
                onChangeText={(text) => updateEvent(index, "start", text)}
              />
              <View style={styles.amPm}>
                <Text style={{ color: theme.textColor }}>AM</Text>
                <TouchableOpacity
                  onPress={() => toggleAmPm(index, "amStart")}
                  style={[styles.checkbox, event.amStart && styles.checkedBox]}
                />
                <Text style={{ color: theme.textColor }}>PM</Text>
                <TouchableOpacity
                  onPress={() => toggleAmPm(index, "amStart")}
                  style={[styles.checkbox, !event.amStart && styles.checkedBox]}
                />
              </View>
            </View>

            <View style={styles.row}>
              <TextInput
                placeholder="End Time (HH:MM)"
                placeholderTextColor={theme.placeholderColor}
                style={[styles.inputHalf, { backgroundColor: theme.cardColor, color: theme.textColor, borderColor: theme.navBarBorderColor }]}
                value={event.end}
                onChangeText={(text) => updateEvent(index, "end", text)}
              />
              <View style={styles.amPm}>
                <Text style={{ color: theme.textColor }}>AM</Text>
                <TouchableOpacity
                  onPress={() => toggleAmPm(index, "amEnd")}
                  style={[styles.checkbox, event.amEnd && styles.checkedBox]}
                />
                <Text style={{ color: theme.textColor }}>PM</Text>
                <TouchableOpacity
                  onPress={() => toggleAmPm(index, "amEnd")}
                  style={[styles.checkbox, !event.amEnd && styles.checkedBox]}
                />
              </View>
            </View>

            <View style={styles.daysRow}>
              <Text style={{ color: theme.textColor, marginBottom: 5 }}>Days:</Text>
              <View style={styles.dayPills}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(index, day)}
                    style={[styles.day, { backgroundColor: event.days.includes(day) ? (darkMode ? "#ffffff" : "#000000") : (darkMode ? "#333333" : "#dddddd"), borderColor: theme.navBarBorderColor,}]}
                  >
                    <Text style={{ color: event.days.includes(day) ? (darkMode ? "#000000" : "#ffffff") : theme.textColor, }}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addEvent}>
          <Text style={[styles.addText, { color: theme.textColor }]}>Add Another Event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.finalizeButton, { backgroundColor: theme.buttonColor }]}
          onPress={async () => {
            await postEvents();
            router.push("/finalize");
          }}
        >
          <Text style={[styles.finalizeText, { color: theme.buttonTextColor }]}>Finalize Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  eventBox: { padding: 15, borderRadius: 8, marginBottom: 20 },
  input: { padding: 10, borderRadius: 6, borderWidth: 1, marginBottom: 10 },
  inputHalf: { padding: 10, borderRadius: 6, borderWidth: 1, flex: 1, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8 },
  amPm: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: "#000", marginHorizontal: 4 },
  checkedBox: { backgroundColor: "#000" },
  daysRow: { marginTop: 10 },
  dayPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  day: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButton: { alignItems: "center", marginVertical: 10 },
  addText: { fontSize: 16, fontWeight: "bold" },
  finalizeButton: { padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  finalizeText: { fontSize: 16 },
});
