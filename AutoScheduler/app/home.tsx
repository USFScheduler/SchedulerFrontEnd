import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import api from "../api/api";
import { getUserId, getUsername } from "../utils/tokenStorage";
import { parseISO, isToday, format, getHours, compareAsc } from "date-fns";
import TabBar from "../components/TabBar";

interface Assignment {
  id: number;
  title: string;
  deadline: string | null;
  type: 'assignment';
}

interface Task {
  id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  days_of_week: string[] | null;
  type: 'task';
}

type ListItem = Assignment | Task;

const screenHeight = Dimensions.get("window").height;
const HOUR_BLOCK_HEIGHT = 80; // Height per hour block

export default function HomeScreen() {
  const [tasks, setTasks] = useState<ListItem[]>([]);
  const [username, setUsername] = useState<string>("User");
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(new Date());
  const scrollViewRef = useRef<ScrollView>(null);

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
      const name = await getUsername();
      if (name) setUsername(name);
      if (!userId) throw new Error("User ID not found");

      const [tasksRes, assignmentsRes] = await Promise.all([
        api.get(`/tasks_by_user?user_id=${userId}`),
        api.get(`/canvas/upcoming_assignments`)
      ]);

      const tasksData: Task[] = tasksRes.data.map((t: any) => ({ ...t, type: 'task' as const }));
      const assignmentsData: Assignment[] = assignmentsRes.data.map((a: any) => ({ ...a, type: 'assignment' as const }));

      const todayItems = filterTodayItems(tasksData, assignmentsData);
      adjustDayRange(todayItems);
      setTasks(todayItems);
      
      setTimeout(() => {
        scrollToCurrentTime();
      }, 500);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTodayItems = (tasks: Task[], assignments: Assignment[]): ListItem[] => {
    const today = new Date();
    const todayDayAbbrev = ["Sun", "M", "T", "W", "TH", "F", "S"][today.getDay()];

    const todayTasks = tasks.filter(task => {
      if (task.start_date) {
        const startDate = parseISO(task.start_date);
        if (isToday(startDate)) return true;
      }
      if (task.days_of_week && task.days_of_week.includes(todayDayAbbrev)) {
        return true;
      }
      return false;
    });

    const todayAssignments = assignments.filter(assign => {
      if (assign.deadline) {
        const dueDate = parseISO(assign.deadline);
        return isToday(dueDate);
      }
      return false;
    });

    const combined = [...todayTasks, ...todayAssignments];

    // Sort by earliest time
    return combined.sort((a, b) => {
      const timeA = getListItemTime(a);
      const timeB = getListItemTime(b);
      return compareAsc(timeA, timeB);
    });
  };

  const getListItemTime = (item: ListItem): Date => {
    if (item.type === "assignment" && item.deadline) {
      return parseISO(item.deadline);
    }
    if (item.type === "task" && item.start_time) {
      const today = new Date();
      const [hour, minute] = item.start_time.split(":").map(Number);
      today.setHours(hour, minute, 0, 0);
      return today;
    }
    return new Date(); // fallback now
  };

  const adjustDayRange = (items: ListItem[]) => {
    let earliest = 6;
    let latest = 23;
    items.forEach(item => {
      const date = getListItemTime(item);
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

  const renderHourBlock = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return (
      <View key={hour} style={styles.hourBlock}>
        <Text style={styles.hourLabel}>{`${displayHour}:00 ${ampm}`}</Text>
        <View style={styles.hourLine} />
      </View>
    );
  };

  const renderItemsAtHour = (hour: number) => {
    return tasks
      .filter(item => {
        const itemHour = getListItemTime(item).getHours();
        return itemHour === hour;
      })
      .map(item => (
        <View
          key={`${item.type}-${item.id}`}
          style={[
            styles.taskCard,
            item.type === "assignment" ? styles.assignmentCard : styles.taskCardColor,
          ]}
        >
          <View style={styles.badgeContainer}>
            <Text style={[
              styles.badge,
              item.type === "assignment" ? styles.badgeBlue : styles.badgePurple
            ]}>
              {item.type === "assignment" ? "Canvas" : "Task"}
            </Text>
          </View>
          <Text style={styles.taskTitle}>{item.title}</Text>
        </View>
      ));
  };

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

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ position: "relative", minHeight: (dayEndHour - dayStartHour + 1) * HOUR_BLOCK_HEIGHT }}>
          {/* Current Time Marker */}
          <View
            style={[
              styles.currentTimeMarker,
              { top: calculateCurrentTimePosition() },
            ]}
          />

          {/* Hour Blocks */}
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

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  greeting: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  subheading: { fontSize: 18, color: "#555", marginBottom: 16 },
  hourContainer: { minHeight: HOUR_BLOCK_HEIGHT, borderBottomWidth: 1, borderBottomColor: "#eee" },
  hourBlock: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  hourLabel: { width: 80, fontSize: 14, color: "#666" },
  hourLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
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
    elevation: 2,
    backgroundColor: "#f4f8ff", // default
  },
  taskCardColor: { backgroundColor: "#f9f7ff" }, // for user tasks
  assignmentCard: { backgroundColor: "#e8f4ff" }, // for canvas assignments
  badgeContainer: { position: "absolute", top: 8, right: 8 },
  badge: { fontSize: 10, fontWeight: "bold", padding: 4, borderRadius: 4, overflow: "hidden" },
  badgePurple: { backgroundColor: "#9b59b6", color: "#fff" },
  badgeBlue: { backgroundColor: "#3498db", color: "#fff" },
  taskTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginTop: 4 },
  currentTimeMarker: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "red",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
