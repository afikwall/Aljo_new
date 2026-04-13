import type { StaffAvailabilityEntityDayOfWeekEnum } from "@/product-types";

export const DAYS_OF_WEEK: {
  key: StaffAvailabilityEntityDayOfWeekEnum;
  label: string;
  shortLabel: string;
}[] = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
  { key: "saturday", label: "Saturday", shortLabel: "Sat" },
  { key: "sunday", label: "Sunday", shortLabel: "Sun" },
];

export interface DayAvailability {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  notes: string;
  recordId?: string;
}

export type AvailabilityMap = Record<StaffAvailabilityEntityDayOfWeekEnum, DayAvailability>;

export const getDefaultAvailability = (): AvailabilityMap => {
  const defaults: Partial<AvailabilityMap> = {};
  for (const day of DAYS_OF_WEEK) {
    defaults[day.key] = {
      isAvailable: true,
      startTime: "07:00",
      endTime: "19:00",
      notes: "",
    };
  }
  return defaults as AvailabilityMap;
};

/**
 * Format a HH:MM time string for display (e.g. "07:00" → "07:00")
 */
export const formatTimeDisplay = (time: string): string => {
  return time || "--:--";
};

/**
 * Validate that end time is after start time for HH:MM format strings.
 */
export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
};