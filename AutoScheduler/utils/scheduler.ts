import { parseISO, addMinutes, isBefore, isAfter } from "date-fns";

// Data Types
export interface Task {
  id: number;
  title: string;
  start_time: string;  // ISO String
  end_time: string;    // ISO String
  user_defined?: boolean; // If true = user input task, if false = generated work session
}

export interface Assignment {
  id: number;
  title: string;
  due_date: string;  // ISO String
}

export interface WorkHours {
  start: string;  // "09:00"
  end: string;    // "22:00"
}

// Main function: create scheduled work sessions
export function scheduleAssignments(
  userTasks: Task[],
  assignments: Assignment[],
  workHours: WorkHours
): Task[] {
  const generatedWorkSessions: Task[] = [];

  const sortedAssignments = [...assignments].sort(
    (a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime()
  );

  // Go through each assignment
  for (const assignment of sortedAssignments) {
    let workMinutesLeft = 180; // 3 hours total
    let currentDay = new Date(); // Start today

    const dueDate = parseISO(assignment.due_date);

    while (workMinutesLeft > 0 && isBefore(currentDay, dueDate)) {
      const dayStart = new Date(currentDay);
      const dayEnd = new Date(currentDay);

      // Set to user's preferred work times
      dayStart.setHours(Number(workHours.start.split(":")[0]), Number(workHours.start.split(":")[1]), 0, 0);
      dayEnd.setHours(Number(workHours.end.split(":")[0]), Number(workHours.end.split(":")[1]), 0, 0);

      const freeBlocks = findFreeBlocks(userTasks, dayStart, dayEnd);

      for (const block of freeBlocks) {
        const blockMinutes = (block.end.getTime() - block.start.getTime()) / (1000 * 60);

        if (blockMinutes >= 30) {
          const sessionMinutes = Math.min(60, blockMinutes, workMinutesLeft); // Prefer 60 mins but can be smaller
          const sessionStart = block.start;
          const sessionEnd = addMinutes(sessionStart, sessionMinutes);

          // Create new work session
          const newSession: Task = {
            id: Math.floor(Math.random() * 100000),
            title: `Work on ${assignment.title}`,
            start_time: sessionStart.toISOString(),
            end_time: sessionEnd.toISOString(),
            user_defined: false,
          };

          generatedWorkSessions.push(newSession);

          // Add the session into the user's tasks to avoid overlap
          userTasks.push(newSession);

          workMinutesLeft -= sessionMinutes;
        }

        if (workMinutesLeft <= 0) {
          break;
        }
      }

      // Go to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  return generatedWorkSessions;
}

// Helper function: Find free blocks between tasks
function findFreeBlocks(tasks: Task[], dayStart: Date, dayEnd: Date) {
  const sameDayTasks = tasks
    .filter(task => {
      const start = parseISO(task.start_time);
      return start.toDateString() === dayStart.toDateString();
    })
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

  const freeBlocks: { start: Date; end: Date }[] = [];
  let cursor = dayStart;

  for (const task of sameDayTasks) {
    const taskStart = parseISO(task.start_time);
    if (isBefore(cursor, taskStart)) {
      freeBlocks.push({ start: cursor, end: taskStart });
    }
    const taskEnd = parseISO(task.end_time);
    if (isAfter(taskEnd, cursor)) {
      cursor = taskEnd;
    }
  }

  if (isBefore(cursor, dayEnd)) {
    freeBlocks.push({ start: cursor, end: dayEnd });
  }

  return freeBlocks;
}
