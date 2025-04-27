import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { parseISO, isSameDay, format } from "date-fns";
import api from "../api/api";
import { getUserId } from "../utils/tokenStorage";

interface Assignment {
  id: number;
  title: string;
  deadline: string | null;
  type: "assignment";
}

interface Task {
  id: number;
  title: string;
  start_date: string | null;
  type: "task";
}

type ListItem = Assignment | Task;

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      if (!userId) throw new Error("User ID not found");

      const [tasksRes, assignmentsRes] = await Promise.all([
        api.get(`/tasks_by_user?user_id=${userId}`),
        api.get(`/canvas/upcoming_assignments?user_id=${userId}`)
      ]);

      const fetchedTasks = tasksRes.data.map((t: any) => ({ ...t, type: "task" as const }));
      const fetchedAssignments = assignmentsRes.data.map((a: any, index: number) => ({ ...a, id: index, type: "assignment" as const }));

      setTasks(fetchedTasks);
      setAssignments(fetchedAssignments);

      // 💥 Important: Now we set the dots
      const allItems = [...fetchedTasks, ...fetchedAssignments];
      const marks = generateMarkedDates(allItems);
      setMarkedDates(marks);

    } catch (error) {
      console.error("Error fetching tasks or assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = (items: ListItem[]) => {
    const marks: { [date: string]: any } = {};

    items.forEach(item => {
      let dateKey: string | null = null;

      if (item.type === "assignment" && item.deadline) {
        dateKey = format(parseISO(item.deadline), "yyyy-MM-dd");
      } else if (item.type === "task" && item.start_date) {
        dateKey = format(parseISO(item.start_date), "yyyy-MM-dd");
      }

      if (dateKey) {
        if (!marks[dateKey]) {
          marks[dateKey] = { marked: true, dots: [{ color: "#007bff" }] };
        }
      }
    });

    return marks;
  };

  const getItemsForDate = (date: string): ListItem[] => {
    const tasksToday = tasks.filter(t => t.start_date && isSameDay(parseISO(t.start_date), parseISO(date)));
    const assignmentsToday = assignments.filter(a => a.deadline && isSameDay(parseISO(a.deadline), parseISO(date)));
    return [...tasksToday, ...assignmentsToday];
  };

  const renderItems = () => {
    const items = getItemsForDate(selectedDate);

    if (items.length === 0) {
      return <Text style={styles.noItems}>No tasks or assignments for this day.</Text>;
    }

    return items.map((item) => (
      <View key={`${item.type}-${item.id}`} style={styles.itemContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.type === "assignment" && (
          <Text style={styles.itemType}>Canvas Assignment</Text>
        )}
        {item.type === "task" && (
          <Text style={styles.itemType}>User Task</Text>
        )}
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...(markedDates[selectedDate] || {}),
            selected: true,
            selectedColor: "#0066cc",
          },
        }}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
      />


      <View style={styles.itemsContainer}>
        <Text style={styles.itemsHeader}>Items for {selectedDate}:</Text>
        {renderItems()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemsContainer: { marginTop: 16, paddingHorizontal: 16 },
  itemsHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  itemContainer: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  itemTitle: { fontSize: 16 },
  itemType: { fontSize: 14, color: "#666" },
  noItems: { fontSize: 16, color: "#aaa", textAlign: "center", marginTop: 20 },
});
