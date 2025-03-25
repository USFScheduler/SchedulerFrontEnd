import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

// 🔧 Define the shape of an Event
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Your Current Schedule</Text>

      {events.map((event, index) => (
        <View key={index} style={styles.eventBox}>
          <TextInput
            placeholder="Event Name"
            style={styles.input}
            value={event.name}
            onChangeText={(text) => updateEvent(index, "name", text)}
          />

          <View style={styles.row}>
            <TextInput
              placeholder="Start Time (HH:MM)"
              style={styles.inputHalf}
              value={event.start}
              onChangeText={(text) => updateEvent(index, "start", text)}
            />
            <View style={styles.amPm}>
              <Text>AM</Text>
              <TouchableOpacity
                onPress={() => toggleAmPm(index, "amStart")}
                style={[
                  styles.checkbox,
                  event.amStart && styles.checkedBox,
                ]}
              />
              <Text>PM</Text>
              <TouchableOpacity
                onPress={() => toggleAmPm(index, "amStart")}
                style={[
                  styles.checkbox,
                  !event.amStart && styles.checkedBox,
                ]}
              />
            </View>
          </View>

          <View style={styles.row}>
            <TextInput
              placeholder="End Time (HH:MM)"
              style={styles.inputHalf}
              value={event.end}
              onChangeText={(text) => updateEvent(index, "end", text)}
            />
            <View style={styles.amPm}>
              <Text>AM</Text>
              <TouchableOpacity
                onPress={() => toggleAmPm(index, "amEnd")}
                style={[
                  styles.checkbox,
                  event.amEnd && styles.checkedBox,
                ]}
              />
              <Text>PM</Text>
              <TouchableOpacity
                onPress={() => toggleAmPm(index, "amEnd")}
                style={[
                  styles.checkbox,
                  !event.amEnd && styles.checkedBox,
                ]}
              />
            </View>
          </View>

          <View style={styles.daysRow}>
            <Text style={{ marginBottom: 5 }}>Days:</Text>
            <View style={styles.dayPills}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(index, day)}
                  style={[
                    styles.day,
                    event.days.includes(day) && styles.daySelected,
                  ]}
                >
                  <Text
                    style={
                      event.days.includes(day) ? styles.dayTextSelected : {}
                    }
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addEvent}>
        <Text style={styles.addText}>Add Another Event</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.finalizeButton}
        onPress={() => router.push("/finalize")} // make sure finalize.tsx exists
      >
        <Text style={styles.finalizeText}>Finalize Schedule</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  eventBox: {
    backgroundColor: "#f4f4f4",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
  },
  inputHalf: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  amPm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#000",
    marginHorizontal: 4,
  },
  checkedBox: {
    backgroundColor: "#000",
  },
  daysRow: {
    marginTop: 10,
  },
  dayPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  day: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ddd",
  },
  daySelected: {
    backgroundColor: "#000",
  },
  dayTextSelected: {
    color: "#fff",
  },
  addButton: {
    alignItems: "center",
    marginVertical: 10,
  },
  addText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  finalizeButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  finalizeText: {
    color: "#fff",
    fontSize: 16,
  },
});
