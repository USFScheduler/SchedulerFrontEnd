import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import api from "../api/api";
import { getUserId, getUserInfo } from "../utils/tokenStorage";
import { parseISO, isToday, format, compareAsc } from "date-fns";
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
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  days_of_week: string[] | null;
  am_start?: boolean;
  am_end?: boolean;
  type: "task";
}

type ListItem = Assignment | Task;

const HOUR_BLOCK_HEIGHT = 80;

export default function HomeScreen() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [username, setUsername] = useState<string>("User");
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(new Date());
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useTheme();

  const [dayStartHour, setDayStartHour] = useState(6);
  const [dayEndHour, setDayEndHour] = useState(23);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setCurrentHour(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const userId = await getUserId();
      const userInfo = await getUserInfo();
      if (userInfo) setUsername(userInfo.name);
      if (!userId) throw new Error("User ID not found");

      const [tasksRes, assignmentsRes] = await Promise.all([
        api.get(`/tasks_by_user?user_id=${userId}`),
        api.get(`/canvas/upcoming_assignments?user_id=${userId}`),
      ]);

      const tasksData: Task[] = tasksRes.data.map((t: any) => ({ ...t, type: "task" as const }));
      const assignmentsData: Assignment[] = assignmentsRes.data.map((a: any, idx: number) => ({
        ...a,
        id: idx,
        type: "assignment" as const,
      }));

      const todayAbbrev = ["SU", "M", "T", "W", "TH", "F", "S"][new Date().getDay()];

      const todayTasks = tasksData.filter(t => {
        if (t.start_date && isToday(parseISO(t.start_date))) return true;
        if (t.days_of_week && t.days_of_week.includes(todayAbbrev)) return true;
        return false;
      });

      const todayAssignments = assignmentsData.filter(a => a.deadline && isToday(parseISO(a.deadline)));

      const combined = [...todayTasks, ...todayAssignments].sort((a, b) => {
        const dateA = getListItemDate(a);
        const dateB = getListItemDate(b);
        return compareAsc(dateA, dateB);
      });

      adjustDayRange(combined);
      setItems(combined);

      setTimeout(() => scrollToCurrentTime(), 500);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getListItemDate = (item: ListItem): Date => {
    const today = new Date();
    if (item.type === "assignment" && item.deadline) {
      return parseISO(item.deadline);
    }
    if (item.type === "task" && item.start_time) {
      let [hour, minute] = item.start_time.split(":").map(Number);
      if (item.am_start === false && hour < 12) hour += 12;
      if (item.am_start === true && hour === 12) hour = 0;
      today.setHours(hour, minute, 0, 0);
      return today;
    }
    return today;
  };

  const adjustDayRange = (items: ListItem[]) => {
    let earliest = 6;
    let latest = 23;
    items.forEach(item => {
      const date = getListItemDate(item);
      const hour = date.getHours();
      if (hour < earliest) earliest = hour;
      if (hour > latest) latest = hour;
    });
    setDayStartHour(Math.min(earliest, 6));
    setDayEndHour(Math.max(latest, 23));
  };

  const calculateCurrentTimePosition = () => {
    const now = currentHour;
    const minutesSinceStart = (now.getHours() - dayStartHour) * 60 + now.getMinutes();
    const totalMinutesVisible = (dayEndHour - dayStartHour + 1) * 60;
    const position = (minutesSinceStart / totalMinutesVisible) * ((dayEndHour - dayStartHour + 1) * HOUR_BLOCK_HEIGHT);
    return Math.max(position, 0);
  };

  const scrollToCurrentTime = () => {
    const position = calculateCurrentTimePosition();
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: position - 100,
        animated: true,
      });
    }
  };

  const formatItemTimeRange = (item: ListItem) => {
    if (item.type === "task" && item.start_time && item.end_time) {
      const [startHour, startMinute] = item.start_time.split(":").map(Number);
      const [endHour, endMinute] = item.end_time.split(":").map(Number);

      const startPeriod = item.am_start ? "AM" : "PM";
      const endPeriod = item.am_end ? "AM" : "PM";

      const formatHour = (h: number) => (h % 12 === 0 ? 12 : h % 12);

      if (startPeriod === endPeriod) {
        return `${formatHour(startHour)}:${startMinute.toString().padStart(2, '0')} - ${formatHour(endHour)}:${endMinute.toString().padStart(2, '0')} ${startPeriod}`;
      } else {
        return `${formatHour(startHour)}:${startMinute.toString().padStart(2, '0')} ${startPeriod} - ${formatHour(endHour)}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
      }
    }
    return null;
  };

  const renderItemsAtHour = (hour: number) => {
    const itemsAtHour = items.filter(item => getListItemDate(item).getHours() === hour);
    return itemsAtHour.length > 0
      ? itemsAtHour.map(item => (
          <View
            key={`${item.type}-${item.id}`}
            style={[
              styles.taskCard,
              { backgroundColor: theme.cardColor }
            ]}
          >
            <View style={styles.badgeContainer}>
              <Text style={[styles.badge, item.type === "assignment" ? styles.badgeBlue : styles.badgePurple]}>
                {item.type === "assignment" ? "Canvas" : "Task"}
              </Text>
            </View>
            <Text style={[styles.taskTitle, { color: theme.textColor }]}>{item.title}</Text>
            {item.type === "task" && (
              <Text style={[styles.taskTime, { color: theme.textColor }]}>{formatItemTimeRange(item)}</Text>
            )}
          </View>
        ))
      : null;
  };

  const renderHourBlock = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const isDark = theme.backgroundColor === "#000000";
  
    return (
      <View key={hour} style={[styles.hourContainer, { borderBottomColor: isDark ? "#ffffff" : "#000000" }]}>
        <View style={styles.hourContent}>
          <Text style={[styles.hourLabel, { color: theme.textColor }]}>{`${displayHour}:00 ${ampm}`}</Text>
          <View style={[styles.hourLine, { backgroundColor: isDark ? "#555" : "#ccc" }]} />
        </View>
      </View>
    );
  };
  
  

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.textColor} />
        <Text style={{ color: theme.textColor }}>Loading your day...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      {/* Top Section: greeting + subheading */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={[styles.greeting, { color: theme.textColor }]}>Welcome, {username}!</Text>
        <Text style={[styles.subheading, { color: theme.textColor }]}>Here's your day ahead:</Text>
      </View>
  
      {/* Middle Section: the scrollable schedule */}
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 }} style={{ flex: 1 }}>
        <View style={{ position: "relative", minHeight: (dayEndHour - dayStartHour + 1) * HOUR_BLOCK_HEIGHT }}>
          <View style={[styles.currentTimeMarker, { top: calculateCurrentTimePosition() }]} />
          {Array.from({ length: dayEndHour - dayStartHour + 1 }).map((_, index) => {
            const hour = dayStartHour + index;
            return (
              <View key={hour} style={styles.hourContainer}>
                {renderHourBlock(hour)}
                {renderItemsAtHour(hour)}
              </View>
            );
          })}
        </View>
      </ScrollView>
  
      {/* Bottom Section: TabBar */}
      <TabBar />
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  greeting: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  subheading: { fontSize: 18, marginBottom: 16 },
  hourContainer: { 
    minHeight: 80, 
    borderBottomWidth: 1, 
  },
  hourContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  hourLabel: {
    width: 80,
    fontSize: 14,
  },
  hourLine: {
    flex: 1,
    height: 1,
    marginLeft: 10, // small gap between text and line
  },
  taskCard: { 
    padding: 12, 
    borderRadius: 8, 
    marginVertical: 4, 
    marginLeft: 90, 
    marginRight: 10, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  badgeContainer: { position: "absolute", top: 8, right: 8 },
  badge: { fontSize: 10, fontWeight: "bold", padding: 4, borderRadius: 4, overflow: "hidden" },
  badgePurple: { backgroundColor: "#9b59b6", color: "#fff" },
  badgeBlue: { backgroundColor: "#3498db", color: "#fff" },
  taskTitle: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  taskTime: { fontSize: 13, marginTop: 4 },
  currentTimeMarker: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: "red" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

