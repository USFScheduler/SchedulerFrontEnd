import AsyncStorage from "@react-native-async-storage/async-storage";
import { scheduleAssignments, Task, Assignment, WorkHours } from "./scheduler";
import { getWorkHours } from "./tokenStorage";
import { parseISO, addDays, format, isBefore, isSameDay } from "date-fns";


// MasterSchedule type: all tasks stored together
export interface MasterSchedule {
  solidTasks: Task[];      // User manually inputted tasks
  assignments: Assignment[]; // Canvas pulled assignments
  workSessions: Task[];    // Auto-generated work sessions
}

// Save master schedule locally
export async function saveMasterSchedule(schedule: MasterSchedule) {
  await AsyncStorage.setItem("MasterSchedule", JSON.stringify(schedule));
}

// Load master schedule locally
export async function loadMasterSchedule(): Promise<MasterSchedule | null> {
  const data = await AsyncStorage.getItem("MasterSchedule");
  if (data) {
    return JSON.parse(data);
  }
  return null;
}

// Clear (optional for resets)
export async function clearMasterSchedule() {
  await AsyncStorage.removeItem("MasterSchedule");
}

// Main function to build new schedule
export async function generateMasterSchedule(
  solidTasks: Task[],
  assignments: Assignment[]
) {
  const workHours = await getWorkHours(); // User's work time preferences
  if (!workHours) {
    throw new Error("Work hours not set");
  }

  // First schedule work sessions intelligently
  const workSessions = scheduleAssignments([...solidTasks], assignments, workHours);

  const master: MasterSchedule = {
    solidTasks,
    assignments,
    workSessions,
  };

  // Save result
  await saveMasterSchedule(master);
}
