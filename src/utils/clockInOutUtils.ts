import { parseISO, differenceInMinutes, differenceInHours, subMinutes, addMinutes, format } from "date-fns";

/** Threshold in minutes after shift start beyond which clock-in is blocked */
export const LATE_CLOCK_IN_THRESHOLD_MINUTES = 30;

/** Minutes before shift start when clock-in window opens */
export const CLOCK_IN_EARLY_WINDOW_MINUTES = 15;

/** Hours after shift end before auto-clock-out triggers */
export const AUTO_CLOCK_OUT_HOURS = 2;

/** Minutes after shift end beyond which clock-out is flagged as late */
export const LATE_CLOCK_OUT_THRESHOLD_MINUTES = 30;

export type ClockInWindowState =
  | "before_window"   // more than 15 min before start
  | "within_window"   // 15 min before to 30 min after start
  | "past_window";    // more than 30 min after start

export interface ClockInWindowInfo {
  state: ClockInWindowState;
  /** Minutes until the clock-in window opens (only for before_window) */
  minutesUntilWindowOpens: number;
  /** Formatted time when clock-in opens (e.g., "7:45 AM") */
  clockInOpensAt: string;
  /** Whether staff is late (within window but past shift start) */
  isLateButAllowed: boolean;
  /** Whether clock-in button should be enabled */
  canClockIn: boolean;
}

/**
 * Determines the clock-in window state for a shift.
 * Window opens 15 min before shift start and closes 30 min after.
 */
export const getClockInWindowInfo = (
  shiftStartDateTime: string,
  now: Date
): ClockInWindowInfo => {
  try {
    const shiftStart = parseISO(shiftStartDateTime);
    const windowOpens = subMinutes(shiftStart, CLOCK_IN_EARLY_WINDOW_MINUTES);
    const windowCloses = addMinutes(shiftStart, LATE_CLOCK_IN_THRESHOLD_MINUTES);
    const clockInOpensAt = format(windowOpens, "h:mm a");

    if (now < windowOpens) {
      const minutesUntil = differenceInMinutes(windowOpens, now);
      return {
        state: "before_window",
        minutesUntilWindowOpens: minutesUntil,
        clockInOpensAt,
        isLateButAllowed: false,
        canClockIn: false,
      };
    }

    if (now <= windowCloses) {
      const isLate = now > shiftStart;
      return {
        state: "within_window",
        minutesUntilWindowOpens: 0,
        clockInOpensAt,
        isLateButAllowed: isLate,
        canClockIn: true,
      };
    }

    return {
      state: "past_window",
      minutesUntilWindowOpens: 0,
      clockInOpensAt,
      isLateButAllowed: false,
      canClockIn: false,
    };
  } catch {
    return {
      state: "before_window",
      minutesUntilWindowOpens: 0,
      clockInOpensAt: "",
      isLateButAllowed: false,
      canClockIn: false,
    };
  }
};

/**
 * Checks if a shift needs auto-clock-out.
 * Returns true if current time is more than 2 hours after shift.endDateTime.
 */
export const needsAutoClockOut = (
  shiftEndDateTime: string,
  now: Date
): boolean => {
  try {
    const shiftEnd = parseISO(shiftEndDateTime);
    const hoursPastEnd = differenceInHours(now, shiftEnd);
    return hoursPastEnd >= AUTO_CLOCK_OUT_HOURS;
  } catch {
    return false;
  }
};

/**
 * Checks if a clock-out is late (more than 30 min after shift end).
 */
export const isLateClockOut = (
  shiftEndDateTime: string,
  clockOutTime: Date
): boolean => {
  try {
    const shiftEnd = parseISO(shiftEndDateTime);
    const minutesPastEnd = differenceInMinutes(clockOutTime, shiftEnd);
    return minutesPastEnd > LATE_CLOCK_OUT_THRESHOLD_MINUTES;
  } catch {
    return false;
  }
};

/**
 * Formats elapsed time as HH:MM:SS from a clock-in time string.
 */
export const formatElapsedTime = (clockInTime: string, now: Date): string => {
  try {
    const start = parseISO(clockInTime);
    const totalSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } catch {
    return "00:00:00";
  }
};

/**
 * Returns elapsed hours since clock-in (for break calculation).
 */
export const getElapsedHours = (clockInTime: string, now: Date): number => {
  try {
    const start = parseISO(clockInTime);
    const totalMinutes = differenceInMinutes(now, start);
    return totalMinutes / 60;
  } catch {
    return 0;
  }
};