import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";

/**
 * Generate a full calendar grid (6 weeks max) for the given month.
 * Returns an array of Date objects covering Sun–Sat rows.
 */
export const generateCalendarDays = (month: Date): Date[] => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Saturday
  return eachDayOfInterval({ start: calStart, end: calEnd });
};

/**
 * Format a Date to YYYY-MM-DD key for map lookups.
 */
export const toDateKey = (date: Date): string => format(date, "yyyy-MM-dd");

/**
 * Check if a date falls within a blocked range (inclusive).
 */
export const isDateBlocked = (
  date: Date,
  blockedRanges: Array<{ startDate?: string; endDate?: string }>
): boolean => {
  return blockedRanges.some((range) => {
    if (!range.startDate || !range.endDate) return false;
    try {
      const start = parseISO(range.startDate);
      const end = parseISO(range.endDate);
      return isWithinInterval(date, { start, end });
    } catch {
      return false;
    }
  });
};

/**
 * Get all blocked date records that overlap with a given date.
 */
export const getBlockedRecordsForDate = <
  T extends { id?: string; startDate?: string; endDate?: string }
>(
  date: Date,
  blockedRanges: T[]
): T[] => {
  return blockedRanges.filter((range) => {
    if (!range.startDate || !range.endDate) return false;
    try {
      const start = parseISO(range.startDate);
      const end = parseISO(range.endDate);
      return isWithinInterval(date, { start, end });
    } catch {
      return false;
    }
  });
};

/**
 * Format a shift start time for display on a pill.
 * e.g. "2026-02-17T07:00:00Z" → "7a" or "3p"
 */
export const formatShiftTime = (dateTimeStr: string): string => {
  try {
    const date = parseISO(dateTimeStr);
    const hours = date.getHours();
    const suffix = hours >= 12 ? "p" : "a";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}${suffix}`;
  } catch {
    return "";
  }
};

/**
 * Abbreviate a facility name for pill display.
 * "St. Mary's Hospital" → "St. Mary's"
 * "Sunrise Senior Care" → "Sunrise"
 */
export const abbreviateFacilityName = (name: string): string => {
  if (!name) return "";
  // If name is short enough, return as-is
  if (name.length <= 12) return name;
  // Try splitting by spaces and taking first 1-2 words
  const words = name.split(" ");
  if (words.length <= 1) return name.substring(0, 10);
  // Take first word, or first two if first is short (like "St.")
  if (words[0].length <= 3 && words.length > 1) {
    return `${words[0]} ${words[1]}`;
  }
  return words[0];
};

/**
 * Format a date for the day detail sheet heading.
 * e.g. "Tuesday, February 17, 2026"
 */
export const formatDayHeading = (date: Date): string => {
  return format(date, "EEEE, MMMM d, yyyy");
};

/**
 * Format a time range from two ISO datetime strings.
 * e.g. "7:00 AM – 3:00 PM"
 */
export const formatTimeRange = (
  startDateTime: string,
  endDateTime: string
): string => {
  try {
    const start = parseISO(startDateTime);
    const end = parseISO(endDateTime);
    return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  } catch {
    return "";
  }
};

export {
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  addMonths,
  subMonths,
  getDay,
  format,
};