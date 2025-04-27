// Updated CalendarScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { format, parseISO } from "date-fns";
import DropDownPicker from "react-native-dropdown-picker";
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
  days_of_week: string[] | null;
  type: "task";
}

type ListItem = Assignment | Task;

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ListItem[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("User not found");

      const [tasksRes, assignmentsRes] = await Promise.all([
        api.get(`/tasks_by_user?user_id=${userId}`),
        api.get(`/canvas/upcoming_assignments?user_id=${userId}`),
      ]);

      const fetchedTasks = tasksRes.data.map((t: any) => ({ ...t, type: "task" as const }));
      const fetchedAssignments = assignmentsRes.data.map((a: any, index: number) => ({
        ...a,
        id: index,
        type: "assignment" as const,
      }));

      const combined = [...fetchedTasks, ...fetchedAssignments];
      setTasks(combined);
      generateMarkedDates(combined);
    } catch (error) {
      console.error("Error fetching tasks or assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = (items: ListItem[]) => {
    const marks: { [date: string]: any } = {};
    items.forEach((item) => {
      let dateKey = "";
      if (item.type === "assignment" && item.deadline) {
        dateKey = format(parseISO(item.deadline), "yyyy-MM-dd");
      }
      if (item.type === "task" && item.start_date) {
        dateKey = format(parseISO(item.start_date), "yyyy-MM-dd");
      }
      if (dateKey) {
        marks[dateKey] = {
          marked: true,
          dots: [{ color: item.type === "assignment" ? "#3498db" : "#9b59b6" }],
        };
      }
    });
    setMarkedDates(marks);
  };

  const onMonthChange = (monthNumber: number, yearNumber: number) => {
    setMonth(monthNumber);
    setYear(yearNumber);
  };

  const renderItems = () => {
    const todayItems = tasks.filter((item) => {
      if (item.type === "assignment" && item.deadline) {
        return format(parseISO(item.deadline), "yyyy-MM-dd") === selectedDate;
      }
      if (item.type === "task" && item.start_date) {
        return format(parseISO(item.start_date), "yyyy-MM-dd") === selectedDate;
      }
      return false;
    });

    if (todayItems.length === 0) {
      return <Text style={styles.noItems}>No tasks or assignments for this day.</Text>;
    }

    return todayItems.map((item) => (
      <View key={`${item.type}-${item.id}`} style={styles.itemBox}>
        <Text style={styles.itemText}>{item.title}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: "#00bfff" },
        }}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        monthFormat={"MMMM yyyy"}
        onMonthChange={(month: { month: number; year: number }) => onMonthChange(month.month, month.year)}
        hideArrows
        theme={{
          selectedDayBackgroundColor: "#00bfff",
          todayTextColor: "#00bfff",
          dotColor: "#00bfff",
          selectedDotColor: "#ffffff",
          arrowColor: "#00bfff",
          monthTextColor: "#333",
          textMonthFontWeight: "bold",
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsHeader}>Items for {selectedDate}:</Text>
        {renderItems()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemsContainer: { marginTop: 20 },
  itemsHeader: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  noItems: { textAlign: "center", color: "#888", marginTop: 20 },
  itemBox: { padding: 10, marginVertical: 5, backgroundColor: "#f1f1f1", borderRadius: 5 },
  itemText: { fontSize: 16 },
});
