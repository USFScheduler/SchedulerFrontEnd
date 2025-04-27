// Updated CalendarScreen.tsx (full updated)
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { format, parseISO, isToday } from "date-fns";
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
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  days_of_week: string[] | null;
  am_start?: boolean;
  am_end?: boolean;
  type: "task";
}

type ListItem = Assignment | Task;

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ListItem[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

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
      const fetchedAssignments = assignmentsRes.data.map((a: any, idx: number) => ({
        ...a,
        id: idx,
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
    const marks: { [date: string]: { dots: { color: string }[] } } = {};
    const today = new Date();

    items.forEach((item) => {
      let datesToMark: string[] = [];

      if (item.type === "assignment" && item.deadline) {
        datesToMark.push(format(parseISO(item.deadline), "yyyy-MM-dd"));
      }

      if (item.type === "task") {
        if (item.start_date) {
          datesToMark.push(format(parseISO(item.start_date), "yyyy-MM-dd"));
        }
        if (item.days_of_week && item.days_of_week.length > 0) {
          for (let i = 0; i < 30; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const abbrev = getDayAbbreviation(futureDate);
            if (item.days_of_week.includes(abbrev)) {
              const dateKey = format(futureDate, "yyyy-MM-dd");
              datesToMark.push(dateKey);
            }
          }
        }
      }

      datesToMark = [...new Set(datesToMark)];

      datesToMark.forEach((dateKey) => {
        if (!marks[dateKey]) marks[dateKey] = { dots: [] };
        const color = item.type === "assignment" ? "#3498db" : "#9b59b6";
        if (!marks[dateKey].dots.find(dot => dot.color === color)) {
          marks[dateKey].dots.push({ color });
        }
      });
    });

    setMarkedDates(marks);
  };

  const getDayAbbreviation = (date: Date) => {
    const days = ["SU", "M", "T", "W", "TH", "F", "S"];
    return days[date.getDay()];
  };

  const formatItemTimeRange = (item: ListItem) => {
    if (item.type === "task" && item.start_time && item.end_time) {
      const [startHour, startMinute] = item.start_time.split(":" as any).map(Number);
      const [endHour, endMinute] = item.end_time.split(":" as any).map(Number);
      const formatHour = (h: number) => (h % 12 === 0 ? 12 : h % 12);
      const ampmStart = item.am_start ? "AM" : "PM";
      const ampmEnd = item.am_end ? "AM" : "PM";

      if (ampmStart === ampmEnd) {
        return `${formatHour(startHour)}:${startMinute.toString().padStart(2, '0')} - ${formatHour(endHour)}:${endMinute.toString().padStart(2, '0')} ${ampmStart}`;
      } else {
        return `${formatHour(startHour)}:${startMinute.toString().padStart(2, '0')} ${ampmStart} - ${formatHour(endHour)}:${endMinute.toString().padStart(2, '0')} ${ampmEnd}`;
      }
    }
    if (item.type === "assignment" && item.deadline) {
      const dueDate = parseISO(item.deadline);
      const hour = dueDate.getHours();
      const minute = dueDate.getMinutes();
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      return `Due today by ${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    }
    return null;
  };

  const renderItems = () => {
    const dayItems = tasks.filter((item) => {
      if (item.type === "assignment" && item.deadline) {
        return format(parseISO(item.deadline), "yyyy-MM-dd") === selectedDate;
      }
      if (item.type === "task") {
        if (item.start_date && format(parseISO(item.start_date), "yyyy-MM-dd") === selectedDate) {
          return true;
        }
        if (item.days_of_week && item.days_of_week.includes(getDayAbbreviation(new Date(selectedDate)))) {
          return true;
        }
      }
      return false;
    }).sort((a, b) => {
      const aDate = a.type === "assignment" ? parseISO(a.deadline || '') : parseISO(a.start_date || '');
      const bDate = b.type === "assignment" ? parseISO(b.deadline || '') : parseISO(b.start_date || '');
      return aDate.getTime() - bDate.getTime();
    });

    if (dayItems.length === 0) {
      return <Text style={styles.noItems}>No tasks or assignments for this day.</Text>;
    }

    return dayItems.map((item) => (
      <View
        key={`${item.type}-${item.id}`}
        style={[
          styles.itemBox,
          item.type === "assignment" ? styles.assignmentBox : styles.taskBox,
        ]}
      >
        <View style={styles.badgeContainer}>
          <Text style={[styles.badge, item.type === "assignment" ? styles.badgeBlue : styles.badgePurple]}>
            {item.type === "assignment" ? "Canvas" : "Task"}
          </Text>
        </View>

        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemTime}>{formatItemTimeRange(item)}</Text>
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
          [selectedDate]: { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: "#00bfff" },
        }}
        markingType="multi-dot"
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        monthFormat="MMMM yyyy"
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
  itemBox: { padding: 12, marginVertical: 6, borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  assignmentBox: { backgroundColor: "#e8f4ff" },
  taskBox: { backgroundColor: "#f9f7ff" },
  badgeContainer: { position: "absolute", top: 8, right: 8 },
  badge: { fontSize: 10, fontWeight: "bold", padding: 4, borderRadius: 4, overflow: "hidden" },
  badgePurple: { backgroundColor: "#9b59b6", color: "#fff" },
  badgeBlue: { backgroundColor: "#3498db", color: "#fff" },
  itemTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginTop: 4 },
  itemTime: { fontSize: 13, color: "#555", marginTop: 4 },
});