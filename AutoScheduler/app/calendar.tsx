import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Calendar } from "react-native-calendars";
import api from "../api/api";
import { getUserId } from "../utils/tokenStorage";
import TabBar from "../components/TabBar";
import { useTheme } from "../components/ThemeContext"; // <-- Added

interface Task {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[] | null;
  user_id?: number;
}

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { theme } = useTheme(); // <-- Grab theme

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("User not found");
      const response = await api.get(`/tasks_by_user?user_id=${userId}`);

      if (response.status === 200) {
        const fetchedTasks = response.data;
        setTasks(fetchedTasks);
        generateMarkedDates(fetchedTasks);
      } else {
        console.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = (tasks: Task[]) => {
    const marks: any = {};

    tasks.forEach(task => {
      if (!task.start_date) return;

      const start = new Date(task.start_date);
      const end = task.end_date ? new Date(task.end_date) : start;

      if (task.days_of_week && task.days_of_week.length > 0) {
        const dayMap: Record<string, number> = {
          "Sun": 0,
          "M": 1,
          "T": 2,
          "W": 3,
          "TH": 4,
          "F": 5,
          "S": 6,
        };

        let current = new Date(start);

        while (current <= end) {
          const dayNum = current.getDay();
          const match = task.days_of_week.some(day => dayMap[day] === dayNum);

          if (match) {
            const dateKey = current.toISOString().split("T")[0];
            if (!marks[dateKey]) {
              marks[dateKey] = { marked: true, dots: [{ color: "blue" }] };
            }
          }

          current.setDate(current.getDate() + 1);
        }
      } else {
        const dateKey = start.toISOString().split("T")[0];
        if (!marks[dateKey]) {
          marks[dateKey] = { marked: true, dots: [{ color: "blue" }] };
        }
      }
    });

    setMarkedDates(marks);
  };

  const getTasksForDate = (date: string): Task[] => {
    return tasks.filter(task => task.start_date && task.start_date.startsWith(date));
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}> {/* dark mode bg */}
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ color: theme.textColor }}>Loading calendar...</Text>
      </View>
    );
  }

  const tasksForSelectedDate = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}> {/* dark mode bg */}
      <Calendar
        theme={{
          calendarBackground: theme.backgroundColor,
          dayTextColor: theme.textColor,
          monthTextColor: theme.textColor,
          textSectionTitleColor: theme.textColor,
          selectedDayBackgroundColor: theme.buttonColor,
          selectedDayTextColor: theme.buttonTextColor,
        }}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          ...(selectedDate ? { [selectedDate]: { selected: true, marked: true, selectedColor: theme.buttonColor } } : {})
        }}
      />

      {selectedDate ? (
        <View style={styles.taskList}>
          <Text style={[styles.tasksHeader, { color: theme.textColor }]}>Tasks for {selectedDate}:</Text>
          {tasksForSelectedDate.length > 0 ? (
            <FlatList
              data={tasksForSelectedDate}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.taskItem}>
                  <Text style={[styles.taskTitle, { color: theme.textColor }]}>{item.title}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={[styles.noTasks, { color: theme.textColor }]}>No tasks for this day.</Text>
          )}
        </View>
      ) : (
        <Text style={[styles.noDateSelected, { color: theme.textColor }]}>Select a date to view tasks</Text>
      )}

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskList: {
    padding: 16,
    flex: 1,
  },
  tasksHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  taskItem: {
    paddingVertical: 8,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  taskTitle: {
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noTasks: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  noDateSelected: {
    textAlign: "center",
    marginTop: 10,
  },
});
