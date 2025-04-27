import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../api/api';
import { format, addDays, parseISO, isValid, isSameDay } from 'date-fns';
import { getUserId } from "../utils/tokenStorage";
import TabBar from '../components/TabBar';
import { useTheme } from "../components/ThemeContext";

interface Assignment {
  id: number;
  title: string;
  course_name: string;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  priority?: string | null;
  type: 'assignment';
}

interface Task {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[] | null;
  am_start?: boolean;
  am_end?: boolean;
  priority?: string | null;
  user_id?: number;
  type: 'task';
  calculatedDueDate?: Date;
}

interface ListItemProps {
  item: Assignment | Task;
}

const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const abbreviationMap = { M: 'Mon', T: 'Tue', W: 'Wed', TH: 'Thu', F: 'Fri', S: 'Sat', SU: 'Sun' };

const ShowCombinedItems: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [combinedItems, setCombinedItems] = useState<(Assignment | Task)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const retrievedUserId = await getUserId();
      if (!retrievedUserId) {
        setError('User ID not found');
        return;
      }

      const [assignmentsData, tasksData] = await Promise.all([
        fetchUpcomingCanvasAssignments(retrievedUserId),
        fetchTasks(retrievedUserId)
      ]);

      setAssignments(assignmentsData);
      setTasks(tasksData);

      updateCombinedItems(assignmentsData, tasksData);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextOccurrence = (task: Task): Task => {
    if (!task.days_of_week || task.days_of_week.length === 0) return task;
  
    const today = new Date();
    const todayIndex = today.getDay();
    const normalizedDays = task.days_of_week
      .map((day) => abbreviationMap[day.trim().toUpperCase() as keyof typeof abbreviationMap])
      .filter(Boolean);
  
    let nextOccurrence: Date = today;
    const todayDayName = Object.keys(dayMap).find(key => dayMap[key as keyof typeof dayMap] === todayIndex) as keyof typeof dayMap;

    if (!normalizedDays.includes(todayDayName)) {
      let daysToAdd = 7;
      for (const day of normalizedDays) {
        const dayIndex = dayMap[day as keyof typeof dayMap];
        let diff = dayIndex - todayIndex;
        if (diff <= 0) diff += 7;
        if (diff < daysToAdd) {
          daysToAdd = diff;
        }
      }
      nextOccurrence = addDays(today, daysToAdd);
    }
  
    return { ...task, calculatedDueDate: nextOccurrence };
  };

  const fetchTasks = async (userId: string) => {
    try {
      const response = await api.get<Task[]>(`/tasks_by_user?user_id=${userId}`);
      if (response.status !== 200) throw new Error('Failed to fetch tasks');

      const typedTasks = response.data.map(task => ({
        ...task,
        type: 'task' as const
      }));

      return typedTasks.map(calculateNextOccurrence);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      return [];
    }
  };

  const fetchUpcomingCanvasAssignments = async (userId: string) => {
    try {
      const response = await api.get<Assignment[]>(`/canvas/upcoming_assignments?user_id=${userId}`);
      if (response.status !== 200) throw new Error('Failed to fetch assignments');

      return response.data.map((assignment, index) => ({
        ...assignment,
        id: index,
        type: 'assignment' as const
      }));
    } catch (err) {
      console.error('Error fetching assignments:', err);
      return [];
    }
  };

  const updateCombinedItems = (assignments: Assignment[], tasks: Task[]) => {
    const combined = [...assignments, ...tasks];
    const sorted = combined.sort((a, b) => {
      const dateA = a.type === 'assignment' ? (a.deadline ? new Date(a.deadline).getTime() : Infinity) : (a.calculatedDueDate ? a.calculatedDueDate.getTime() : Infinity);
      const dateB = b.type === 'assignment' ? (b.deadline ? new Date(b.deadline).getTime() : Infinity) : (b.calculatedDueDate ? b.calculatedDueDate.getTime() : Infinity);
      return dateA - dateB;
    });
    setCombinedItems(sorted);
  };

  const formatDueDate = (item: Assignment | Task) => {
    if (item.type === 'assignment' && item.deadline) {
      try {
        return format(new Date(item.deadline), 'MMM dd, yyyy h:mm a');
      } catch (e) {
        return 'Invalid date';
      }
    }
    if (item.type === 'task' && item.calculatedDueDate) {
      return format(item.calculatedDueDate, 'MMM dd, yyyy');
    }
    return 'No due date';
  };

  const renderListItem = ({ item }: ListItemProps) => {
    const isAssignment = item.type === 'assignment';
    const backgroundColor = theme.cardColor;
    const borderColor = isAssignment ? "#3498db" : "#9b59b6";

    const formatTaskTime = (
      start: string | null,
      amStart: boolean | undefined,
      end: string | null,
      amEnd: boolean | undefined
    ) => {
      if (start && end) {
        const startPeriod = amStart ? 'AM' : 'PM';
        const endPeriod = amEnd ? 'AM' : 'PM';
        return `${start} ${startPeriod} - ${end} ${endPeriod}`;
      }
      return 'Time: Unknown';
    };

    return (
      <TouchableOpacity style={[styles.listItem, { backgroundColor, borderLeftColor: borderColor }]}>
        <View style={[styles.badge, { backgroundColor: borderColor }]}>
          <Text style={styles.badgeText}>{isAssignment ? 'Canvas' : 'Task'}</Text>
        </View>

        <Text style={[styles.itemTitle, { color: theme.textColor }]}>{item.title}</Text>

        <Text style={[styles.itemSubText, { color: isAssignment ? "#e67e22" : theme.textColor }]}>
          {isAssignment
            ? `Due: ${formatDueDate(item)}`
            : item.days_of_week && item.days_of_week.length > 0
              ? `Occurs: ${item.days_of_week.join(', ')}`
              : formatDueDate(item)}
        </Text>

        {item.type === 'task' && (
          <Text style={[styles.itemSubText, { color: theme.textColor }]}>
            {formatTaskTime(item.start_time, item.am_start, item.end_time, item.am_end)}
          </Text>
        )}

        {item.type === 'assignment' && (
          <Text style={[styles.itemSubText, { color: theme.textColor }]}>
            {item.priority ? `Priority: ${item.priority}` : "Priority: N/A"}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor }}>
        <ActivityIndicator size="large" color="#00bfff" />
        <Text style={{ color: theme.textColor, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor }}>
        <Text style={{ color: "red", fontSize: 16, marginBottom: 12 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={[styles.header, { color: theme.textColor }]}>Upcoming Tasks & Assignments</Text>
        {combinedItems.length === 0 ? (
          <Text style={[styles.itemSubText, { color: theme.textColor }]}>No upcoming items</Text>
        ) : (
          <FlatList
            data={combinedItems}
            renderItem={renderListItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* TabBar placed OUTSIDE content to stay fixed */}
      <TabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  listItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  itemTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  itemSubText: { fontSize: 14, marginBottom: 4 },
});

export default ShowCombinedItems;
