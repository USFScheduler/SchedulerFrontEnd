import TabBar from "../components/TabBar";
import React, { useState, useEffect } from "react";
import axios from "axios";
import api from '../api/api';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { getUserId } from "../utils/tokenStorage";
import { useTheme } from "../components/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
// import { StatusBar } from 'expo-status-bar'; // ADD THIS if using Expo

// import { confirmAsync } from "../utils/confirmAsync"; // adjust path!


// Define the shape of an Event/Task
type Event = {
  id?: number;
  name: string;
  start: string;
  end: string;
  amStart: boolean;
  amEnd: boolean;
  days: string[];
};

// Backend Task interface
type BackendTask = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  am_start: boolean;
  am_end: boolean;
  days_of_week: string[];
  user_id: number;
};

const daysOfWeek = ["M", "T", "W", "TH", "F", "S", "SU"];

export default function ScheduleScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  
  // Add state for current tab/mode
  const [activeTab, setActiveTab] = useState<'view' | 'add' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [existingEvents, setExistingEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([
    { name: "", start: "", end: "", amStart: true, amEnd: true, days: [] },
  ]);

  // Fetch existing events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const user_id = await getUserId();
      if (!user_id) throw new Error("User ID is missing.");
      
      const response = await api.get(`tasks/user/${user_id}`);
      
      // Transform backend data to our frontend format
      const transformedEvents: Event[] = response.data.map((task: BackendTask) => ({
        id: task.id,
        name: task.title,
        start: task.start_time,
        end: task.end_time,
        amStart: task.am_start,
        amEnd: task.am_end,
        days: task.days_of_week,
      }));
      
      setExistingEvents(transformedEvents);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        Alert.alert("Error", `Failed to fetch schedule: ${error.response?.data?.message || error.message}`);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Error", error instanceof Error ? error.message : "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

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

  const updateSelectedEvent = <K extends keyof Event>(field: K, value: Event[K]) => {
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        [field]: value
      });
    }
  };

  const toggleDay = (index: number, day: string) => {
    const updated = [...events];
    const currentDays = updated[index].days;
    updated[index].days = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setEvents(updated);
  };

  const toggleDayForSelectedEvent = (day: string) => {
    if (selectedEvent) {
      const currentDays = selectedEvent.days;
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      
      setSelectedEvent({
        ...selectedEvent,
        days: updatedDays
      });
    }
  };

  const toggleAmPm = (index: number, field: "amStart" | "amEnd") => {
    const updated = [...events];
    updated[index][field] = !updated[index][field];
    setEvents(updated);
  };

  const toggleAmPmForSelectedEvent = (field: "amStart" | "amEnd") => {
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        [field]: !selectedEvent[field]
      });
    }
  };

  const postEvents = async () => {
    try {
      setLoading(true);
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
      Alert.alert("Success", "Schedule submitted successfully!");
      
      // Reset form and refresh list of events
      setEvents([{ name: "", start: "", end: "", amStart: true, amEnd: true, days: [] }]);
      fetchEvents();
      setActiveTab('view');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        Alert.alert("Error", `Failed to submit schedule: ${error.response?.data?.message || error.message}`);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Error", error instanceof Error ? error.message : "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateExistingEvent = async () => {
    if (!selectedEvent || !selectedEvent.id) return;
    
    try {
      setLoading(true);
      const user_id = await getUserId();
      if (!user_id) throw new Error("User ID is missing.");

      const response = await api.put(`/tasks/${selectedEvent.id}`, {
        title: selectedEvent.name,
        start_time: selectedEvent.start,
        end_time: selectedEvent.end,
        am_start: selectedEvent.amStart,
        am_end: selectedEvent.amEnd,
        days_of_week: selectedEvent.days,
        user_id: parseInt(user_id),
      });

      console.log("Event updated successfully:", response.data);
      Alert.alert("Success", "Event updated successfully!");
      
      // Refresh list of events and go back to view mode
      fetchEvents();
      setActiveTab('view');
      setSelectedEvent(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        Alert.alert("Error", `Failed to update event: ${error.response?.data?.message || error.message}`);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Error", error instanceof Error ? error.message : "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };
  const deleteEvent = async (id: number) => {
    if (!id) return;
  
    console.log("Attempting to delete event with ID:", id);
  
    // const confirmed = await confirmAsync(
    //   "Confirm Deletion",
    //   "Are you sure you want to delete this event?"
    // );
  
    // if (!confirmed) {
    //   console.log("User cancelled deletion.");
    //   return;
    // }
  
    setLoading(true);
  
    try {
      console.log("Deleting event with ID:", id);
      await api.delete(`/tasks/${id}`);
      fetchEvents();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        Alert.alert("Error", `Failed to delete event: ${error.response?.data?.message || error.message}`);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Error", error instanceof Error ? error.message : "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  const editEvent = (event: Event) => {
    setSelectedEvent(event);
    setActiveTab('edit');
  };

  const renderTabButtons = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'view' && { backgroundColor: theme.buttonColor }]} 
        onPress={() => setActiveTab('view')}
      >
        <Text style={{ color: activeTab === 'view' ? theme.buttonTextColor : theme.textColor }}>View</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'add' && { backgroundColor: theme.buttonColor }]} 
        onPress={() => setActiveTab('add')}
      >
        <Text style={{ color: activeTab === 'add' ? theme.buttonTextColor : theme.textColor }}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEventForm = (event: Event, index: number) => (
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
              style={[styles.day, { backgroundColor: event.days.includes(day) ? (darkMode ? "#ffffff" : "#000000") : (darkMode ? "#333333" : "#dddddd"), borderColor: theme.navBarBorderColor }]}
            >
              <Text style={{ color: event.days.includes(day) ? (darkMode ? "#000000" : "#ffffff") : theme.textColor }}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSelectedEventForm = () => {
    if (!selectedEvent) return null;
    
    return (
      <View style={[styles.eventBox, { backgroundColor: theme.cardColor }]}>
        <TextInput
          placeholder="Event Name"
          placeholderTextColor={theme.placeholderColor}
          style={[styles.input, { backgroundColor: theme.cardColor, color: theme.textColor, borderColor: theme.navBarBorderColor }]}
          value={selectedEvent.name}
          onChangeText={(text) => updateSelectedEvent("name", text)}
        />

        <View style={styles.row}>
          <TextInput
            placeholder="Start Time (HH:MM)"
            placeholderTextColor={theme.placeholderColor}
            style={[styles.inputHalf, { backgroundColor: theme.cardColor, color: theme.textColor, borderColor: theme.navBarBorderColor }]}
            value={selectedEvent.start}
            onChangeText={(text) => updateSelectedEvent("start", text)}
          />
          <View style={styles.amPm}>
            <Text style={{ color: theme.textColor }}>AM</Text>
            <TouchableOpacity
              onPress={() => toggleAmPmForSelectedEvent("amStart")}
              style={[styles.checkbox, selectedEvent.amStart && styles.checkedBox]}
            />
            <Text style={{ color: theme.textColor }}>PM</Text>
            <TouchableOpacity
              onPress={() => toggleAmPmForSelectedEvent("amStart")}
              style={[styles.checkbox, !selectedEvent.amStart && styles.checkedBox]}
            />
          </View>
        </View>

        <View style={styles.row}>
          <TextInput
            placeholder="End Time (HH:MM)"
            placeholderTextColor={theme.placeholderColor}
            style={[styles.inputHalf, { backgroundColor: theme.cardColor, color: theme.textColor, borderColor: theme.navBarBorderColor }]}
            value={selectedEvent.end}
            onChangeText={(text) => updateSelectedEvent("end", text)}
          />
          <View style={styles.amPm}>
            <Text style={{ color: theme.textColor }}>AM</Text>
            <TouchableOpacity
              onPress={() => toggleAmPmForSelectedEvent("amEnd")}
              style={[styles.checkbox, selectedEvent.amEnd && styles.checkedBox]}
            />
            <Text style={{ color: theme.textColor }}>PM</Text>
            <TouchableOpacity
              onPress={() => toggleAmPmForSelectedEvent("amEnd")}
              style={[styles.checkbox, !selectedEvent.amEnd && styles.checkedBox]}
            />
          </View>
        </View>

        <View style={styles.daysRow}>
          <Text style={{ color: theme.textColor, marginBottom: 5 }}>Days:</Text>
          <View style={styles.dayPills}>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => toggleDayForSelectedEvent(day)}
                style={[styles.day, { backgroundColor: selectedEvent.days.includes(day) ? (darkMode ? "#ffffff" : "#000000") : (darkMode ? "#333333" : "#dddddd"), borderColor: theme.navBarBorderColor }]}
              >
                <Text style={{ color: selectedEvent.days.includes(day) ? (darkMode ? "#000000" : "#ffffff") : theme.textColor }}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.rowButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton, { borderColor: theme.navBarBorderColor }]} 
            onPress={() => {
              setSelectedEvent(null);
              setActiveTab('view');
            }}
          >
            <Text style={{ color: theme.textColor }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, { backgroundColor: theme.buttonColor }]} 
            onPress={updateExistingEvent}
          >
            <Text style={{ color: theme.buttonTextColor }}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEventCard = (event: Event) => (
    <View key={event.id} style={[styles.eventBox, { backgroundColor: theme.cardColor }]}>
      <View style={styles.eventHeader}>
        <Text style={[styles.eventTitle, { color: theme.textColor }]}>{event.name}</Text>
        <View style={styles.eventActions}>
          <TouchableOpacity onPress={() => editEvent(event)} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={theme.textColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              console.log("Delete button pressed for event:", event);
              if (event.id) {
                console.log("Attempting to delete event with ID:", event.id);
                deleteEvent(event.id);
              } else {
                console.log("Cannot delete - event ID is undefined");
                Alert.alert("Error", "Cannot delete event - ID is missing");
              }
            }} 
            style={styles.actionButton}
          >
            <Ionicons name="trash" size={20} color={theme.textColor} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.eventDetail}>
        <Text style={[styles.eventDetailLabel, { color: theme.placeholderColor }]}>Time:</Text>
        <Text style={{ color: theme.textColor }}>
          {event.start} {event.amStart ? 'AM' : 'PM'} - {event.end} {event.amEnd ? 'AM' : 'PM'}
        </Text>
      </View>
      
      <View style={styles.eventDetail}>
        <Text style={[styles.eventDetailLabel, { color: theme.placeholderColor }]}>Days:</Text>
        <View style={styles.dayPillsSmall}>
          {daysOfWeek.map((day) => (
            <View
              key={day}
              style={[
                styles.daySmall, 
                { 
                  backgroundColor: event.days.includes(day) 
                    ? (darkMode ? "#ffffff" : "#000000") 
                    : "transparent",
                  borderColor: theme.navBarBorderColor 
                }
              ]}
            >
              <Text 
                style={{ 
                  color: event.days.includes(day) 
                    ? (darkMode ? "#000000" : "#ffffff") 
                    : theme.placeholderColor,
                  fontSize: 12
                }}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAddTab = () => (
    <>
      <Text style={[styles.title, { color: theme.textColor }]}>Add Schedule Items</Text>
      {events.map((event, index) => renderEventForm(event, index))}
      
      <TouchableOpacity style={styles.addButton} onPress={addEvent}>
        <Ionicons name="add-circle-outline" size={20} color={theme.textColor} />
        <Text style={[styles.addText, { color: theme.textColor }]}>Add Another Event</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.finalizeButton, { backgroundColor: theme.buttonColor }]}
        onPress={postEvents}
      >
        <Text style={[styles.finalizeText, { color: theme.buttonTextColor }]}>Save Schedule</Text>
      </TouchableOpacity>
    </>
  );

  const renderViewTab = () => (
    <>
      <Text style={[styles.title, { color: theme.textColor }]}>Your Schedule</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.buttonColor} />
          <Text style={{ color: theme.textColor, marginTop: 10 }}>Loading schedule...</Text>
        </View>
      ) : existingEvents.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: theme.navBarBorderColor }]}>
          <Text style={{ color: theme.textColor, textAlign: 'center' }}>
            No events in your schedule yet.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.buttonColor }]}
            onPress={() => setActiveTab('add')}
          >
            <Text style={{ color: theme.buttonTextColor }}>Add Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        existingEvents.map(event => renderEventCard(event))
      )}

      {existingEvents.length > 0 && (
        <TouchableOpacity
          style={[styles.addButtonSmall, { backgroundColor: theme.buttonColor }]}
          onPress={() => setActiveTab('add')}
        >
          <Ionicons name="add" size={20} color={theme.buttonTextColor} />
          <Text style={{ color: theme.buttonTextColor }}>Add New Event</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderEditTab = () => (
    <>
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={() => {
          setSelectedEvent(null);
          setActiveTab('view');
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]}>Edit Event</Text>
      </View>
      {renderSelectedEventForm()}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      {activeTab !== 'edit' && renderTabButtons()}
      
      <ScrollView 
        contentContainerStyle={[styles.container, { backgroundColor: theme.backgroundColor }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchEvents}
            colors={[theme.buttonColor]}
          />
        }
      > 
        {activeTab === 'view' && renderViewTab()}
        {activeTab === 'add' && renderAddTab()}
        {activeTab === 'edit' && renderEditTab()}
    </ScrollView>
      
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={theme.buttonColor} />
        </View>
      )}
      
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    paddingBottom: 100,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 20 
  },
  eventBox: { 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 20 
  },
  input: { 
    padding: 10, 
    borderRadius: 6, 
    borderWidth: 1, 
    marginBottom: 10 
  },
  inputHalf: { 
    padding: 10, 
    borderRadius: 6, 
    borderWidth: 1, 
    flex: 1, 
    marginBottom: 10 
  },
  row: { 
    flexDirection: "row", 
    gap: 10, 
    alignItems: "center", 
    marginBottom: 8 
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15
  },
  button: {
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5
  },
  cancelButton: {
    borderWidth: 1
  },
  saveButton: {},
  amPm: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6 
  },
  checkbox: { 
    width: 18, 
    height: 18, 
    borderWidth: 1, 
    borderColor: "#000", 
    marginHorizontal: 4 
  },
  checkedBox: { 
    backgroundColor: "#000" 
  },
  daysRow: { 
    marginTop: 10 
  },
  dayPills: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8, 
    marginTop: 6 
  },
  day: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1
  },
  dayPillsSmall: {
    flexDirection: "row",
    gap: 4
  },
  daySmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1
  },
  addButton: { 
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "center",
    marginVertical: 10,
    gap: 5
  },
  addButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 10,
    gap: 5
  },
  addText: { 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  finalizeButton: { 
    padding: 15, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 20 
  },
  finalizeText: { 
    fontSize: 16,
    fontWeight: "bold"
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd"
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginHorizontal: 5
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1
  },
  eventActions: {
    flexDirection: "row",
    gap: 10
  },
  actionButton: {
    padding: 5
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  eventDetailLabel: {
    fontWeight: "bold",
    marginRight: 8,
    width: 50
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  emptyContainer: {
    padding: 30,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    alignItems: "center"
  },
  emptyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  backButton: {
    marginRight: 10
  }
});