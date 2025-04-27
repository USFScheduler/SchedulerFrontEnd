// app/home.tsx

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import api from "../api/api";
import { getUserId, getUsername } from "../utils/tokenStorage";
import { format, isToday, parseISO } from "date-fns";
import TabBar from "../components/TabBar"; // or AppNavBar if newer

interface Task {
  id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  days_of_week: string[] | null;
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [username, setUsername] = useState<string>("User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const userId = await getUserId();
      const name = await getUsername();

      if (name) {
        setUsername(name);
      }

      if (!userId) throw new Error("User ID not found");

      const response = await api.get(`/tasks_by_user?user_id=${userId}`);

      if (response.status === 200) {
        const allTasks: Task[] = response.data;
        setTasks(allTasks);
        filterTodayTasks(allTasks);
      } else {
        console.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTodayTasks = (allTasks: Task[]) => {
    const today = new Date();
    const todayDayAbbrev = ["Sun", "M", "T", "W", "TH", "F", "S"][today.getDay()];

    const filtered = allTasks.filter(task => {
      if (task.start_date) {
        const startDate = parseISO(task.start_date);
        if (isToday(startDate)) {
          return true;
        }
      }
      if (task.days_of_week && task.days_of_week.includes(todayDayAbbrev)) {
        return true;
      }
      return false;
    });

    const sorted = filtered.sort((a, b) => {
      if (!a.start_time || !b.start_time) return 0;
      return a.start_time.localeCompare(b.start_time);
    });

    setTodayTasks(sorted);
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      {item.start_time && item.end_time && (
        <Text style={styles.taskTime}>
          {item.start_time} - {item.end_time}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading your day...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome, {username}!</Text>
      <Text style={styles.subheading}>Here's your day ahead:</Text>

      {todayTasks.length === 0 ? (
        <Text style={styles.noTasks}>You have no tasks for today 🎉</Text>
      ) : (
        <FlatList
          data={todayTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 100 }} // prevent overlapping nav bar
        />
      )}

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  greeting: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  subheading: { fontSize: 18, color: "#555", marginBottom: 20 },
  taskCard: {
    backgroundColor: "#fafafa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  taskTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4, color: "#333" },
  taskTime: { fontSize: 14, color: "#777" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  noTasks: { fontSize: 16, color: "#999", textAlign: "center", marginTop: 30 },
});
