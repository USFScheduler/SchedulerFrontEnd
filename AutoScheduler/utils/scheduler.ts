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
        const offsetHours = dayLoad[formatDay(bestDay)] || 0;
      
        const startDateTime = new Date(bestDay);
        startDateTime.setHours(startHour + offsetHours, startMinute, 0, 0);
      
        const endDateTime = addHours(startDateTime, 1);
      
        workSessions.push({
          id: nextTaskId++,
          title: `Work on ${assignment.title}`,
          start_time: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss.SSSX"),
          end_time: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss.SSSX"),
          start_date: null,
          days_of_week: null,
          user_defined: false,
        });
      
        const bestDayStr = formatDay(bestDay);
        dayLoad[bestDayStr] = (dayLoad[bestDayStr] || 0) + 1;
      }
    }
  }

  return workSessions;
}
