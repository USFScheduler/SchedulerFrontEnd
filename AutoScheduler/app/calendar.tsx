import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Animated, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import { format, parseISO } from "date-fns";
import api from "../api/api";
import { getUserId } from "../utils/tokenStorage";
import TabBar from "../components/TabBar";
import { useTheme } from "../components/ThemeContext";

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
  start_time: string | null;
  end_time: string | null;
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
  const [bounceAnims, setBounceAnims] = useState<Animated.Value[]>([]);

  const { theme } = useTheme();

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

  const todayItems = tasks.filter((item) => {
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
    const getTime = (item: ListItem) => {
      if (item.type === "task" && item.start_time) {
        const [h, m] = item.start_time.split(":" as any).map(Number);
        return h * 60 + m;
      }
      return 0;
    };
    return getTime(a) - getTime(b);
  });

  useEffect(() => {
    const anims = todayItems.map(() => new Animated.Value(0));
    setBounceAnims(anims);

    Animated.stagger(100, anims.map(anim => 
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      })
    )).start();
  }, [selectedDate, tasks.length]);

  const formatItemTime = (item: ListItem) => {
    if (item.type === "task" && item.start_time) {
      const [h, m] = item.start_time.split(":" as any).map(Number);
      const ampm = (item.am_start ?? (h < 12)) ? "AM" : "PM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    return null;
  };

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    const scale = bounceAnims[index] || new Animated.Value(1);
    const dueToday = item.type === "assignment";

    return (
      <Animated.View
        style={{
          transform: [{ scale }],
          marginVertical: 6,
          padding: 12,
          borderRadius: 8,
          backgroundColor: item.type === "assignment" ? "#e8f4ff" : "#f9f7ff",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View style={styles.badgeContainer}>
          <Text style={[styles.badge, item.type === "assignment" ? styles.badgeBlue : styles.badgePurple]}>
            {item.type === "assignment" ? "Canvas" : "Task"}
          </Text>
        </View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {dueToday && item.deadline && (
          <Text style={styles.dueText}>Due today by {format(parseISO(item.deadline), "h:mm a")}</Text>
        )}
        {!dueToday && formatItemTime(item) && (
          <Text style={styles.dueText}>{formatItemTime(item)}</Text>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}> 
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ color: theme.textColor }}>Loading calendar...</Text>
        <Text style={{ color: theme.textColor }}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}> 
      <Calendar
        theme={{
          calendarBackground: theme.backgroundColor,
          dayTextColor: theme.textColor,
          monthTextColor: theme.textColor,
          textSectionTitleColor: theme.textColor,
          selectedDayBackgroundColor: theme.buttonColor,
          selectedDayTextColor: theme.buttonTextColor,
        }}
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
          ...(selectedDate ? { [selectedDate]: { selected: true, marked: true, selectedColor: theme.buttonColor } } : {})
        }}
      />

      <View style={styles.itemsContainer}>
        <Text style={[styles.itemsHeader, { color: theme.textColor }]}>Items for {selectedDate}:</Text>
        <FlatList
          data={todayItems}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemsContainer: { paddingHorizontal: 16, paddingTop: 12 },
  itemsHeader: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  badgeContainer: { position: "absolute", top: 8, right: 8 },
  badge: { fontSize: 10, fontWeight: "bold", padding: 4, borderRadius: 4, overflow: "hidden" },
  badgePurple: { backgroundColor: "#9b59b6", color: "#fff" },
  badgeBlue: { backgroundColor: "#3498db", color: "#fff" },
  itemTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  dueText: { fontSize: 13, color: "#555" },
});
