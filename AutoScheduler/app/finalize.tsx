import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../api/api';
import { format, addDays, parseISO, isValid, isSameDay } from 'date-fns';
import { getUserId } from "../utils/tokenStorage";
import TabBar from '../components/TabBar';

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
  const [userId, setUserId] = useState('');

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
      setUserId(retrievedUserId);

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
      .map((day) => {
        const trimmedDay = day.trim().toUpperCase(); // normalize casing
        return abbreviationMap[trimmedDay as keyof typeof abbreviationMap];
      })
      .filter(Boolean);
  
  
    let nextOccurrence: Date;
    const todayDayName = Object.keys(dayMap).find((key) => dayMap[key as keyof typeof dayMap] === todayIndex) as keyof typeof dayMap | undefined;
  
    if (todayDayName && normalizedDays.includes(todayDayName)) {
      nextOccurrence = today;
    } else {
      let daysToAdd = 7;
      for (const day of normalizedDays) {
        const dayIndex = dayMap[day as keyof typeof dayMap];
        if (dayIndex === undefined) continue;
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
  

  const fetchTasks = async (retrievedUserId: string) => {
    try {
      const response = await api.get<Task[]>(`/tasks_by_user?user_id=${retrievedUserId}`);
      if (response.status !== 200) {
        throw new Error('Failed to fetch tasks');
      }

      const typedTasks = response.data.map(task => ({
        ...task,
        type: 'task' as const
      }));

      const processedTasks = typedTasks.map(calculateNextOccurrence);

      console.log('Tasks fetched:', processedTasks);

      return processedTasks;
    } catch (err) {
      console.error('Error fetching tasks:', err);
      return [];
    }
  };

  const fetchUpcomingCanvasAssignments = async (retrievedUserId: string) => {
    try {
      const response = await api.get<Assignment[]>(`/canvas/upcoming_assignments?user_id=${retrievedUserId}`);
      if (response.status !== 200) {
        throw new Error('Failed to fetch assignments');
      }

      const typedAssignments = response.data.map((assignment, index) => ({
        ...assignment,
        id: index,
        type: 'assignment' as const
      }));

      console.log('Assignments fetched:', typedAssignments);

      return typedAssignments;
    } catch (err) {
      console.error('Error fetching assignments:', err);
      return [];
    }
  };

  const updateCombinedItems = (currentAssignments: Assignment[], currentTasks: Task[]) => {
    const combined: (Assignment | Task)[] = [...currentAssignments, ...currentTasks];
    const sorted = combined.sort((a, b) => {
      const dateA = a.type === 'assignment' ? (a.deadline ? new Date(a.deadline).getTime() : Infinity) : (a.calculatedDueDate ? a.calculatedDueDate.getTime() : Infinity);
      const dateB = b.type === 'assignment' ? (b.deadline ? new Date(b.deadline).getTime() : Infinity) : (b.calculatedDueDate ? b.calculatedDueDate.getTime() : Infinity);
      return dateA - dateB;
    });
    setCombinedItems(sorted);
    setLoading(false);
  };

  const formatDueDate = (item: Assignment | Task): string => {
    if (item.type === 'assignment') {
      if (!item.deadline) return 'No due date';
      try {
        return format(new Date(item.deadline), 'MMM dd, yyyy h:mm a');
      } catch (e) {
        return 'Invalid date';
      }
    } else {
      if (item.calculatedDueDate) {
        return format(item.calculatedDueDate, 'MMM dd, yyyy');
      }
      return 'Recurring task';
    }
  };

  const formatDateRange = (item: Task): string => {
    try {
      if (item.start_date && item.end_date) {
        const startDate = parseISO(item.start_date);
        const endDate = parseISO(item.end_date);
        if (isValid(startDate) && isValid(endDate)) {
          return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`;
        }
      }
      if (item.days_of_week) {
        return `Every ${item.days_of_week.join(', ')}`;
      }
      return 'No date range specified';
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date range';
    }
  };

  const renderListItem = ({ item }: ListItemProps): React.ReactElement => {
    const itemStyles = item.type === 'assignment' ? [styles.listItem, styles.assignmentItem] : [styles.listItem, styles.taskItem];
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
      } else {
        return 'Time: Unknown';
      }
    };
    

    return (
      <TouchableOpacity style={itemStyles}>
        <View style={item.type === 'assignment' ? styles.assignmentBadge : styles.taskBadge}>
          <Text style={styles.badgeText}>{item.type === 'assignment' ? 'Canvas' : 'Task'}</Text>
        </View>

        <Text style={styles.itemTitle}>{item.title}</Text>

        <Text style={item.type === 'assignment' ? styles.assignmentDueDate : styles.taskDueDate}>
          {item.type === 'assignment'
            ? `Due: ${formatDueDate(item)}`
            : item.days_of_week && item.days_of_week.length > 0
              ? `Occurs: ${item.days_of_week.join(', ')}`
              : formatDateRange(item)}
        </Text>

        {item.type === 'task' && item.calculatedDueDate && (
          <Text style={styles.nextOccurrence}>
            {isSameDay(item.calculatedDueDate, new Date())
              ? 'Next: Today'
              : `Next: ${format(item.calculatedDueDate, 'EEE, MMM dd')}`}
          </Text>
        )}

        {item.type === 'assignment' && (
          <Text style={styles.points}>{item.priority ? `Priority: ${item.priority}` : 'Priority: N/A'}</Text>
        )}

        {item.type === 'task' && (
          <Text style={styles.taskTime}>
            {formatTaskTime(item.start_time, item.am_start, item.end_time, item.am_end)}
          </Text>
        )}

      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Upcoming Tasks & Assignments</Text>
        {combinedItems.length === 0 ? (
          <Text style={styles.noItems}>No upcoming items</Text>
        ) : (
          <FlatList
            data={combinedItems}
            renderItem={renderListItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>
      <TabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  listItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    paddingTop: 24,
  },
  assignmentItem: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  taskItem: {
    backgroundColor: '#f9f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  assignmentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  taskBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#9b59b6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  assignmentDueDate: {
    fontSize: 14,
    color: '#e67e22',
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 14,
    color: '#9b59b6',
    marginBottom: 4,
  },
  nextOccurrence: {
    fontSize: 14,
    color: '#2ecc71',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  taskTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  points: {
    fontSize: 14,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noItems: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default ShowCombinedItems;