import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../api/api';
import { format, addDays, startOfWeek, parseISO, isValid, set } from 'date-fns';
import { getUserId } from "../utils/tokenStorage";
import TabBar from '../components/TabBar'; // Adjust path if needed

// Define interfaces for our data structures
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


// Combined type for our list items
type ListItem = Assignment | Task;

interface ListItemProps {
  item: ListItem;
}

// Map day abbreviations to day indices (0 = Sunday, 1 = Monday, etc.)
const dayMap: Record<string, number> = {
  'Sun': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6
};

const ShowCombinedItems: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [combinedItems, setCombinedItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const retrievedUserId = await getUserId();
      if (!retrievedUserId) {
        setError('User ID not found');
        return;
      }
      setUserId(retrievedUserId);
  
      const [assignmentsData, tasksData] = await Promise.all([
        fetchUpcomingCanvasAssignments(),
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
    if (!task.days_of_week) return task; // was daysOfWeek before
  
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
  
    // Use correct `days_of_week`
    const days = task.days_of_week.map(day => day.trim());
  
    let nextOccurrence: Date | null = null;
    let daysToAdd = 7;
  
    for (const day of days) {
      const dayIndex = dayMap[day];
      if (dayIndex === undefined) continue;
  
      let daysDiff = dayIndex - today.getDay();
      if (daysDiff <= 0) daysDiff += 7;
  
      if (daysDiff < daysToAdd) {
        daysToAdd = daysDiff;
      }
    }
  
    nextOccurrence = addDays(today, daysToAdd);
  
    return {
      ...task,
      calculatedDueDate: nextOccurrence
    };
  };
  
  
  const fetchTasks = async (retrievedUserId: string): Promise<Task[]> => {
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
  

  const fetchUpcomingCanvasAssignments = async (): Promise<Assignment[]> => {
    try {
      const response = await api.get<Assignment[]>('/canvas/upcoming_assignments');
  
      if (response.status !== 200) {
        throw new Error('Failed to fetch assignments');
      }
      
      const typedAssignments = response.data.map((assignment, index) => ({
        ...assignment,
        id: index,  // <-- create ID
        type: 'assignment' as const
      }));
  
      console.log('Assignments fetched:', typedAssignments);
  
      return typedAssignments;
    } catch (err) {
      console.error('Error fetching assignments:', err);
      return [];
    }
  };
  
  // Update combined items whenever either tasks or assignments change
  const updateCombinedItems = (currentAssignments: Assignment[], currentTasks: Task[]): void => {
    // Combine both lists
    const combined: ListItem[] = [...currentAssignments, ...currentTasks];
    
    // Sort by due date (for assignments) or calculated due date (for tasks)
    const sorted = combined.sort((a, b) => {
      // Get the relevant date for each item
      const dateA = a.type === 'assignment' 
        ? (a.deadline ? new Date(a.deadline).getTime() : Infinity) 
        : (a.calculatedDueDate ? a.calculatedDueDate.getTime() : Infinity);
        
      const dateB = b.type === 'assignment' 
        ? (b.deadline ? new Date(b.deadline).getTime() : Infinity) 
        : (b.calculatedDueDate ? b.calculatedDueDate.getTime() : Infinity);
      
      return dateA - dateB;
    });
    
    setCombinedItems(sorted);
    setLoading(false);
  };
  
  const formatDueDate = (item: ListItem): string => {
    if (item.type === 'assignment') {
      if (!item.deadline) return 'No due date';  // was item.due_at
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
    const itemStyles = item.type === 'assignment' 
      ? [styles.listItem, styles.assignmentItem] 
      : [styles.listItem, styles.taskItem];
  
    return (
      <TouchableOpacity style={itemStyles}>
        {/* Type badge */}
        <View style={item.type === 'assignment' ? styles.assignmentBadge : styles.taskBadge}>
          <Text style={styles.badgeText}>
            {item.type === 'assignment' ? 'Canvas' : 'Task'}
          </Text>
        </View>
  
        {/* Item title */}
        <Text style={styles.itemTitle}>
          {item.title}
        </Text>
  
        {/* Due date or recurring info */}
        <Text style={item.type === 'assignment' ? styles.assignmentDueDate : styles.taskDueDate}>
          {item.type === 'assignment'
            ? `Due: ${formatDueDate(item)}`
            : item.days_of_week && item.days_of_week.length > 0
              ? `Occurs: ${item.days_of_week.join(', ')}`
              : formatDateRange(item)
          }
        </Text>
  
        {/* For tasks with calculated next occurrence */}
        {item.type === 'task' && item.calculatedDueDate && (
          <Text style={styles.nextOccurrence}>
            Next: {format(item.calculatedDueDate, 'EEE, MMM dd')}
          </Text>
        )}
  
        {/* Additional details based on type */}
        {item.type === 'assignment' && (
          <Text style={styles.points}>
            {item.priority ? `Priority: ${item.priority}` : 'Priority: N/A'}
          </Text>
        )}
  
        {item.type === 'task' && item.start_time && item.end_time ? (
          <Text style={styles.taskTime}>
            Time: {item.start_time} - {item.end_time}
          </Text>
        ) : item.type === 'task' && (
          <Text style={styles.taskTime}>
            Time: Unknown
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
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchData}
        >
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
            contentContainerStyle={{ paddingBottom: 80 }} // Add padding to avoid hiding last item behind TabBar
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