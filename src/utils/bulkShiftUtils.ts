import { format, addDays, parseISO, isBefore, isAfter, isSameDay } from "date-fns";

/**
 * Day-of-week constants matching JS Date.getDay() values.
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sun", fullLabel: "Sunday" },
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
] as const;

export type DayOfWeekValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BulkShiftPreviewItem {
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** Day of week name (e.g. "Monday") */
  dayName: string;
  /** Shift start ISO datetime */
  startDateTime: string;
  /** Shift end ISO datetime */
  endDateTime: string;
  /** Whether this date falls on a weekend */
  isWeekend: boolean;
}

export interface BulkShiftFormData {
  facilityProfileId: string;
  requiredRole: "RN" | "LPN" | "CCA" | "CITR";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysOfWeek: DayOfWeekValue[];
  shiftStartTime: string; // HH:MM
  shiftEndTime: string; // HH:MM
  headcount: number;
  notes?: string;
  requiresOrientation?: boolean;
  orientationNotes?: string;
}

export interface BulkShiftValidation {
  valid: boolean;
  message: string;
}

/**
 * Generates a list of dates within a date range that match the specified days of week.
 * Used to preview which shifts will be created before bulk posting.
 */
export const generateShiftDates = (
  startDate: string,
  endDate: string,
  daysOfWeek: DayOfWeekValue[]
): Date[] => {
  if (!startDate || !endDate || daysOfWeek.length === 0) return [];

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isAfter(start, end)) return [];

  const dates: Date[] = [];
  let current = start;

  while (isBefore(current, end) || isSameDay(current, end)) {
    const dayNum = current.getDay() as DayOfWeekValue;
    if (daysOfWeek.includes(dayNum)) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return dates;
};

/**
 * Generates preview items for all shifts that would be created from a bulk post.
 * Each preview item includes formatted date, day name, and full start/end datetimes.
 */
export const generateBulkShiftPreview = (
  startDate: string,
  endDate: string,
  daysOfWeek: DayOfWeekValue[],
  shiftStartTime: string,
  shiftEndTime: string
): BulkShiftPreviewItem[] => {
  const dates = generateShiftDates(startDate, endDate, daysOfWeek);

  return dates.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();
    const dayOption = DAY_OF_WEEK_OPTIONS.find((d) => d.value === dayOfWeek);

    const [startH, startM] = shiftStartTime.split(":").map(Number);
    const [endH, endM] = shiftEndTime.split(":").map(Number);

    const startDt = new Date(date);
    startDt.setHours(startH, startM, 0, 0);

    const endDt = new Date(date);
    endDt.setHours(endH, endM, 0, 0);

    return {
      date: dateStr,
      dayName: dayOption?.fullLabel ?? "Unknown",
      startDateTime: startDt.toISOString(),
      endDateTime: endDt.toISOString(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    };
  });
};

/**
 * Validates the bulk shift form data before submission.
 * Checks all required fields, date range validity, and time ordering.
 */
export const validateBulkShiftForm = (
  data: Partial<BulkShiftFormData>
): BulkShiftValidation => {
  if (!data.facilityProfileId) {
    return { valid: false, message: "Facility is required" };
  }

  if (!data.requiredRole) {
    return { valid: false, message: "Required role must be selected" };
  }

  if (!data.startDate) {
    return { valid: false, message: "Start date is required" };
  }

  if (!data.endDate) {
    return { valid: false, message: "End date is required" };
  }

  const start = parseISO(data.startDate);
  const end = parseISO(data.endDate);

  if (isAfter(start, end)) {
    return { valid: false, message: "End date must be on or after start date" };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (isBefore(start, now)) {
    return { valid: false, message: "Start date must be today or in the future" };
  }

  if (!data.daysOfWeek || data.daysOfWeek.length === 0) {
    return { valid: false, message: "At least one day of week must be selected" };
  }

  if (!data.shiftStartTime) {
    return { valid: false, message: "Shift start time is required" };
  }

  if (!data.shiftEndTime) {
    return { valid: false, message: "Shift end time is required" };
  }

  const [startH, startM] = data.shiftStartTime.split(":").map(Number);
  const [endH, endM] = data.shiftEndTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return { valid: false, message: "Shift end time must be after start time" };
  }

  if (data.headcount !== undefined && (data.headcount < 1 || data.headcount > 20)) {
    return { valid: false, message: "Headcount must be between 1 and 20" };
  }

  // Verify at least one date would be generated
  const dates = generateShiftDates(data.startDate, data.endDate, data.daysOfWeek);
  if (dates.length === 0) {
    return {
      valid: false,
      message: "No shifts would be created for the selected date range and days of week",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Builds the input payload for the BulkPostShiftsAction from form data.
 */
export const buildBulkPostInput = (data: BulkShiftFormData) => ({
  facilityProfileId: data.facilityProfileId,
  requiredRole: data.requiredRole,
  startDate: data.startDate,
  endDate: data.endDate,
  daysOfWeek: data.daysOfWeek as number[],
  shiftStartTime: data.shiftStartTime,
  shiftEndTime: data.shiftEndTime,
  headcount: data.headcount || 1,
  notes: data.notes?.trim() || undefined,
  ...(data.requiresOrientation ? { requiresOrientation: true } : {}),
  ...(data.requiresOrientation && data.orientationNotes?.trim()
    ? { orientationNotes: data.orientationNotes.trim() }
    : {}),
});

/**
 * Formats a summary string for the bulk shift preview.
 * e.g. "6 shifts from Mar 2 to Mar 13 (Mon, Wed, Fri)"
 */
export const formatBulkShiftSummary = (
  previewItems: BulkShiftPreviewItem[],
  daysOfWeek: DayOfWeekValue[]
): string => {
  if (previewItems.length === 0) return "No shifts to create";

  const firstDate = parseISO(previewItems[0].date);
  const lastDate = parseISO(previewItems[previewItems.length - 1].date);

  const dayLabels = daysOfWeek
    .sort((a, b) => a - b)
    .map((d) => DAY_OF_WEEK_OPTIONS.find((opt) => opt.value === d)?.label ?? "")
    .filter(Boolean);

  const count = previewItems.length;
  const dateRange = `${format(firstDate, "MMM d")} to ${format(lastDate, "MMM d")}`;
  const days = dayLabels.join(", ");

  return `${count} shift${count !== 1 ? "s" : ""} from ${dateRange} (${days})`;
};

/**
 * Calculates the shift duration in hours from start and end time strings.
 */
export const calculateShiftDuration = (
  startTime: string,
  endTime: string
): number => {
  if (!startTime || !endTime) return 0;
  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;
  if (endMinutes <= startMinutes) return 0;
  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
};

/**
 * Progress tracking state for bulk shift creation.
 */
export interface BulkShiftProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  errors: string[];
}

/**
 * Creates initial progress state for tracking bulk shift creation.
 */
export const createInitialProgress = (total: number): BulkShiftProgress => ({
  total,
  completed: 0,
  failed: 0,
  inProgress: true,
  errors: [],
});

/**
 * Calculates the progress percentage.
 */
export const getProgressPercentage = (progress: BulkShiftProgress): number => {
  if (progress.total === 0) return 0;
  return Math.round(((progress.completed + progress.failed) / progress.total) * 100);
};

/**
 * Returns a human-readable status message for bulk creation progress.
 */
export const getProgressMessage = (progress: BulkShiftProgress): string => {
  if (!progress.inProgress && progress.completed > 0 && progress.failed === 0) {
    return `Successfully created ${progress.completed} shift${progress.completed !== 1 ? "s" : ""}`;
  }

  if (!progress.inProgress && progress.failed > 0) {
    return `Created ${progress.completed} shift${progress.completed !== 1 ? "s" : ""}, ${progress.failed} failed`;
  }

  if (progress.inProgress) {
    const processed = progress.completed + progress.failed;
    return `Creating shifts... ${processed} of ${progress.total}`;
  }

  return "";
};