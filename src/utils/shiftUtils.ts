import { format, parseISO, differenceInHours, differenceInMinutes } from "date-fns";

export const formatShiftDateTime = (startDateTime?: string, endDateTime?: string): string => {
  if (!startDateTime || !endDateTime) return "";
  try {
    const start = parseISO(startDateTime);
    const end = parseISO(endDateTime);
    return `${format(start, "EEE, MMM d")} • ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  } catch {
    return "";
  }
};

export const formatShiftDate = (dateTime?: string): string => {
  if (!dateTime) return "";
  try {
    return format(parseISO(dateTime), "EEE, MMM d, yyyy");
  } catch {
    return "";
  }
};

export const formatShiftTime = (dateTime?: string): string => {
  if (!dateTime) return "";
  try {
    return format(parseISO(dateTime), "h:mm a");
  } catch {
    return "";
  }
};

export const getShiftDurationHours = (startDateTime?: string, endDateTime?: string): number => {
  if (!startDateTime || !endDateTime) return 0;
  try {
    const start = parseISO(startDateTime);
    const end = parseISO(endDateTime);
    const totalMinutes = differenceInMinutes(end, start);
    return Math.round((totalMinutes / 60) * 10) / 10;
  } catch {
    return 0;
  }
};

export const getStatusBadgeColor = (status?: string): string => {
  switch (status) {
    case "open": return "bg-chart-1/20 text-chart-1";
    case "assigned": return "bg-chart-4/20 text-chart-4";
    case "claimed": return "bg-accent/20 text-accent-foreground";
    case "in_progress": return "bg-chart-2/20 text-chart-2";
    case "completed": return "bg-muted text-muted-foreground";
    case "cancelled": return "bg-destructive/20 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getRoleBadgeColor = (role?: string): string => {
  switch (role) {
    case "RN": return "bg-chart-1/20 text-chart-1";
    case "LPN": return "bg-chart-2/20 text-chart-2";
    case "CCA": return "bg-chart-3/20 text-chart-3";
    case "CITR": return "bg-chart-4/20 text-chart-4";
    default: return "bg-muted text-muted-foreground";
  }
};

export const formatStatusLabel = (status?: string): string => {
  switch (status) {
    case "open": return "Open";
    case "assigned": return "Assigned";
    case "claimed": return "Claimed";
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    default: return status || "Unknown";
  }
};

export const isShiftEditable = (status?: string): boolean => {
  return status === "open" || status === "claimed";
};

export const getDateInputValue = (dateTime?: string): string => {
  if (!dateTime) return "";
  try {
    return format(parseISO(dateTime), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export const getTimeInputValue = (dateTime?: string): string => {
  if (!dateTime) return "";
  try {
    return format(parseISO(dateTime), "HH:mm");
  } catch {
    return "";
  }
};

export const combineDateAndTime = (dateStr: string, timeStr: string): string => {
  if (!dateStr || !timeStr) return "";
  return `${dateStr}T${timeStr}:00`;
};

/**
 * Calculates unpaid break deduction in minutes based on shift duration.
 * Rules:
 *   >= 12 hours → 45 min break
 *   >= 8 hours  → 30 min break
 *   >= 4 hours  → 15 min break
 *   < 4 hours   → 0 min break
 *
 * Breaks are unpaid and auto-deducted from total hours.
 */
export const calculateBreak = (shiftDurationHours: number): number => {
  if (shiftDurationHours >= 12) return 45;
  if (shiftDurationHours >= 8) return 30;
  if (shiftDurationHours >= 4) return 15;
  return 0;
};

/**
 * Calculates the gross duration in hours between two ISO timestamps.
 * Returns fractional hours (e.g. 8.5 for 8h30m).
 */
export const getGrossDurationHours = (clockIn: string, clockOut: string): number => {
  try {
    const start = parseISO(clockIn);
    const end = parseISO(clockOut);
    const totalMinutes = differenceInMinutes(end, start);
    return totalMinutes / 60;
  } catch {
    return 0;
  }
};

/**
 * Calculates net hours worked after subtracting the unpaid break.
 * Returns the result rounded to 2 decimal places.
 */
export const calculateNetHours = (clockIn: string, clockOut: string): { grossHours: number; breakMinutes: number; netHours: number } => {
  const grossHours = getGrossDurationHours(clockIn, clockOut);
  const breakMinutes = calculateBreak(grossHours);
  const netHours = Math.round((grossHours - breakMinutes / 60) * 100) / 100;
  return { grossHours, breakMinutes, netHours };
};