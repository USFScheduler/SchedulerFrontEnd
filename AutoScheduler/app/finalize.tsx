// src/components/CanvasAssignments.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { format } from 'date-fns';

// Define interfaces for our data structure
interface Assignment {
  id: number;
  name: string;
  title?: string;
  due_at: string | null;
  points_possible: number | null;
  course_name: string;
}

interface AssignmentItemProps {
  item: Assignment;
}

const CanvasAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUpcomingAssignments();
  }, []);
  
  const fetchUpcomingAssignments = async (): Promise<void> => {
    try {
      setLoading(true);
      // Replace with your API endpoint
      const response = await axios.get<Assignment[]>('http://localhost:3000/api/v1/canvas/upcoming_assignments');

      if (response.status !== 200) {
        throw new Error('Failed to fetch assignments');
      }

      
      // Sort assignments by due date
      const sortedAssignments = response.data.sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });
      
      setAssignments(sortedAssignments);
      setLoading(false);
    } catch (err) {
      setError('Failed to load assignments');
      setLoading(false);
      console.error('Error fetching assignments:', err);
    }
  };
  
  const formatDueDate = (dateString: string | null): string => {
    if (!dateString) return 'No due date';
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };
  
  const renderAssignmentItem = ({ item }: AssignmentItemProps): React.ReactElement => (
    <TouchableOpacity style={styles.assignmentItem}>
      <Text style={styles.courseName}>{item.course_name || 'Unknown Course'}</Text>
      <Text style={styles.assignmentName}>{item.name || item.title}</Text>
      <Text style={styles.dueDate}>Due: {formatDueDate(item.due_at)}</Text>
      <Text style={styles.points}>Points: {item.points_possible?.toString() || 'N/A'}</Text>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text>Loading assignments...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchUpcomingAssignments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upcoming Assignments</Text>
      {assignments.length === 0 ? (
        <Text style={styles.noAssignments}>No upcoming assignments</Text>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentItem}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  assignmentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  courseName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assignmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  dueDate: {
    fontSize: 14,
    color: '#e67e22',
    marginBottom: 4,
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
  noAssignments: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default CanvasAssignments;