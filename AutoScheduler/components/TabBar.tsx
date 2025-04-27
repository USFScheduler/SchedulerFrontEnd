import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, List, Home, Settings, Pencil } from 'lucide-react-native';

const AppNavBar: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.navbar}>
      {/* Calendar */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/calendar')}>
        <Calendar size={24} />
        <Text style={styles.navButtonText}>Calendar</Text>
      </TouchableOpacity>

      {/* List */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/finalize')}>
        <List size={24} />
        <Text style={styles.navButtonText}>List</Text>
      </TouchableOpacity>

      {/* spacer */}
      <View style={{ flex: 1 }} />

      {/* Home */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/home')}>
        <View style={styles.homeButtonCircle}>
          <Home size={28} color="#333" />
        </View>
        <Text style={styles.homeButtonText}>Home</Text>
      </TouchableOpacity>

      {/* spacer */}
      <View style={{ flex: 1 }} />

      {/* Edit Tasks */}
      <TouchableOpacity style={styles.navButton} onPress={() => router.push('/schedule')}>
        <Pencil size={24} />
        <Text style={styles.navButtonText}>Tasks</Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity style={styles.navButton} onPress={() => {}}>
        <Settings size={24} />
        <Text style={styles.navButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  navButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  homeButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  homeButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  }
});

export default AppNavBar;
