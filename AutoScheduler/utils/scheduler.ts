// ==============================
// Updated scheduler.ts
// ==============================

import { parseISO, addDays, format, isBefore, addHours } from "date-fns";

export interface Task {
  id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  days_of_week: string[] | null;
  am_start?: boolean;
  am_end?: boolean;
  user_defined?: boolean;
}

export interface Assignment {
  id: number;
  title: string;
  due_date: string;
}

export interface WorkHours {
  start: string;
  end: string;
}

let nextTaskId = 10000;

export function scheduleAssignments(
  userTasks: Task[],
  assignments: Assignment[],
  workHours: WorkHours
): Task[] {
  const workSessions: Task[] = [];
  const today = new Date();
  const sortedAssignments = assignments.sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime());

  const dayLoad: { [dateStr: string]: number } = {};
  const formatDay = (date: Date) => format(date, "yyyy-MM-dd");

  for (const assignment of sortedAssignments) {
    const dueDate = parseISO(assignment.due_date);
    if (isBefore(dueDate, today)) continue;

    const availableDays: Date[] = [];
    let cursor = new Date(today);
    while (cursor <= dueDate) {
      availableDays.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }

    for (let i = 0; i < 3; i++) {
      let bestDay: Date | null = null;
      let leastLoad = Infinity;

      for (const day of availableDays) {
        const dayStr = formatDay(day);
        const load = dayLoad[dayStr] || 0;
        if (load < leastLoad) {
          bestDay = day;
          leastLoad = load;
        }
      }

      if (bestDay) {
        const [startHourStr, startMinuteStr] = (workHours.start || "08:00").split(":");
        const startHour = parseInt(startHourStr, 10);
        const startMinute = parseInt(startMinuteStr, 10);
        
        let offsetHours = dayLoad[formatDay(bestDay)] || 0;
        let sessionScheduled = false;
        
        for (let tryHour = startHour + offsetHours; tryHour <= 20; tryHour++) { // Work up until 8PM max
          const sessionStart = new Date(bestDay);
          sessionStart.setHours(tryHour, startMinute, 0, 0);
          const sessionEnd = addHours(sessionStart, 1);
        
          const sessionStartMinutes = tryHour * 60 + startMinute;
          const sessionEndMinutes = sessionStartMinutes + 60;
        
          // Check against manual tasks
          const manualTasksOnDay = userTasks.filter(task => {
            if (!task.start_time || !task.end_time) return false;
          
            // 1. If task has a start_date, match exact date
            if (task.start_date && format(parseISO(task.start_date), "yyyy-MM-dd") === format(bestDay, "yyyy-MM-dd")) {
              return true;
            }
          
            // 2. If task has days_of_week, match recurring days
            if (task.days_of_week && task.days_of_week.length > 0) {
              const dayAbbreviations = ["SU", "M", "T", "W", "TH", "F", "S"];
              const bestDayAbbrev = dayAbbreviations[bestDay.getDay()];
              return task.days_of_week.includes(bestDayAbbrev);
            }
          
            return false;
          });
          
        
          // First check manual tasks conflicts
          const isManualTaskConflict = manualTasksOnDay.some(task => {
            if (!task.start_time || !task.end_time) return false;
            const [taskStartH, taskStartM] = task.start_time.split(":").map(Number);
            const [taskEndH, taskEndM] = task.end_time.split(":").map(Number);
            const taskStartMinutes = (task.am_start === false ? taskStartH + 12 : taskStartH) * 60 + taskStartM;
            const taskEndMinutes = (task.am_end === false ? taskEndH + 12 : taskEndH) * 60 + taskEndM;
            return sessionStartMinutes < taskEndMinutes && sessionEndMinutes > taskStartMinutes;
          });

          // 🔵 Now check work sessions already scheduled
          const isWorkSessionConflict = workSessions.some(session => {
            if (!session.start_time || !session.end_time) return false;
            const sessionStart = parseISO(session.start_time);
            const sessionEnd = parseISO(session.end_time);
            const existingStartMinutes = sessionStart.getHours() * 60 + sessionStart.getMinutes();
            const existingEndMinutes = sessionEnd.getHours() * 60 + sessionEnd.getMinutes();
            const sessionDay = format(sessionStart, "yyyy-MM-dd");
            return sessionDay === format(bestDay, "yyyy-MM-dd") &&
              sessionStartMinutes < existingEndMinutes &&
              sessionEndMinutes > existingStartMinutes;
          });

          // ✅ Now true if either conflicts
          const isConflict = isManualTaskConflict || isWorkSessionConflict;

        
          if (!isConflict) {
            workSessions.push({
              id: nextTaskId++,
              title: `Work on ${assignment.title}`,
              start_time: format(sessionStart, "yyyy-MM-dd'T'HH:mm:ss.SSSX"),
              end_time: format(sessionEnd, "yyyy-MM-dd'T'HH:mm:ss.SSSX"),
              start_date: null,
              days_of_week: null,
              user_defined: false,
            });
          
            const bestDayStr = format(bestDay, "yyyy-MM-dd");
            dayLoad[bestDayStr] = (dayLoad[bestDayStr] || 0) + 1;
            sessionScheduled = true;
            break;
          } else {
            // ❗ Conflict: move start time forward 1 hour and try again
            offsetHours++;
          }
          
        }
        
        // If can't schedule, just skip it gracefully
        
      
        const bestDayStr = formatDay(bestDay);
        dayLoad[bestDayStr] = (dayLoad[bestDayStr] || 0) + 1;
      }
    }
  }

  return workSessions;
}
