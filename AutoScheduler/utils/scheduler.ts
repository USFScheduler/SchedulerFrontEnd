import { parseISO, addMinutes, isBefore, isAfter, format } from "date-fns";

// Type Definitions
export interface Event {
  id: number;
  title: string;
  start: string; // ISO String
  end: string;   // ISO String
}

export interface Assignment {
  id: number;
  title: string;
  dueDate: string; // ISO String
}

export interface WorkHours {
  start: string; // e.g., "09:00"
  end: string;   // e.g., "22:00"
}

// Helper: Convert "09:00" to today's Date object
function todayAt(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

// Step 1: Find available gaps
export function findAvailableGaps(events: Event[], workHours: WorkHours, date: Date) {
  const startOfWork = new Date(date);
  startOfWork.setHours(Number(workHours.start.split(":")[0]), Number(workHours.start.split(":")[1]), 0, 0);
  const endOfWork = new Date(date);
  endOfWork.setHours(Number(workHours.end.split(":")[0]), Number(workHours.end.split(":")[1]), 0, 0);

  // Filter only events for the same date
  const dayEvents = events
    .filter(e => {
      const eventStart = parseISO(e.start);
      return eventStart.toDateString() === date.toDateString();
    })
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

  const gaps: { start: Date; end: Date }[] = [];
  let current = startOfWork;

  for (const event of dayEvents) {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);

    if (isBefore(current, eventStart)) {
      gaps.push({ start: current, end: eventStart });
    }
    current = isAfter(current, eventEnd) ? current : eventEnd;
  }

  if (isBefore(current, endOfWork)) {
    gaps.push({ start: current, end: endOfWork });
  }

  return gaps;
}

// Step 2: Schedule sessions
export function scheduleAssignment(assignment: Assignment, events: Event[], workHours: WorkHours) {
  const sessions: { title: string; start: Date; end: Date }[] = [];
  const dueDate = parseISO(assignment.dueDate);

  // Try starting today
  const today = new Date();
  let dateCursor = today;

  // If due today, prioritize today
  if (dueDate.toDateString() === today.toDateString()) {
    dateCursor = today;
  }

  let minutesRemaining = 180; // 3 hours = 180 minutes
  const minSession = 30; // minimum block size (minutes)

  while (minutesRemaining > 0 && isBefore(dateCursor, addMinutes(dueDate, 1))) {
    const gaps = findAvailableGaps(events, workHours, dateCursor);

    for (const gap of gaps) {
      const gapMinutes = (gap.end.getTime() - gap.start.getTime()) / (1000 * 60);

      if (gapMinutes >= minSession) {
        const sessionLength = Math.min(60, gapMinutes, minutesRemaining); // Prefer 1hr but can be smaller
        const sessionStart = new Date(gap.start);
        const sessionEnd = addMinutes(sessionStart, sessionLength);

        sessions.push({
          title: `${assignment.title} - Work Session`,
          start: sessionStart,
          end: sessionEnd,
        });

        // Add this as an event (block future gaps)
        events.push({
          id: Math.floor(Math.random() * 100000), // temp ID
          title: `${assignment.title} - Work Session`,
          start: sessionStart.toISOString(),
          end: sessionEnd.toISOString(),
        });

        minutesRemaining -= sessionLength;
        if (minutesRemaining <= 0) break;
      }
    }

    // Move to next day
    dateCursor = addMinutes(dateCursor, 1440); // +24 hours
  }

  return sessions;
}

// OPTIONAL: Pretty print for testing
export function formatSessions(sessions: { title: string; start: Date; end: Date }[]) {
  return sessions.map(s => ({
    title: s.title,
    start: format(s.start, "yyyy-MM-dd HH:mm"),
    end: format(s.end, "yyyy-MM-dd HH:mm"),
  }));
}
