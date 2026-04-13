import { parseISO, differenceInDays, differenceInHours, differenceInMinutes, format, subMinutes } from "date-fns";

export interface CountdownResult {
  text: string;
  isStartingSoon: boolean;
  isToday: boolean;
}

export const getShiftCountdown = (startDateTime: string, now: Date): CountdownResult => {
  try {
    const start = parseISO(startDateTime);
    const totalMinutes = differenceInMinutes(start, now);

    if (totalMinutes <= 0) {
      return { text: "Starting soon!", isStartingSoon: true, isToday: true };
    }

    if (totalMinutes <= 60) {
      return { text: "Starting soon!", isStartingSoon: true, isToday: true };
    }

    const days = differenceInDays(start, now);
    const hours = differenceInHours(start, now) % 24;

    if (days > 0) {
      return {
        text: `Starts in ${days} day${days > 1 ? "s" : ""}, ${hours} hour${hours !== 1 ? "s" : ""}`,
        isStartingSoon: false,
        isToday: false,
      };
    }

    const mins = totalMinutes % 60;
    const totalHours = differenceInHours(start, now);
    if (totalHours > 1) {
      return {
        text: `Today at ${format(start, "h:mm a")}`,
        isStartingSoon: false,
        isToday: true,
      };
    }

    return { text: "Starting soon!", isStartingSoon: true, isToday: true };
  } catch {
    return { text: "", isStartingSoon: false, isToday: false };
  }
};

export const getClockInAvailableTime = (startDateTime: string): string => {
  try {
    const start = parseISO(startDateTime);
    const clockInTime = subMinutes(start, 15);
    return format(clockInTime, "h:mm a");
  } catch {
    return "";
  }
};

export type ApplicationStatusType = "none" | "pending" | "approved" | "rejected" | "withdrawn" | "withdrawal_pending";

export const getApplicationStatus = (
  shiftId: string,
  applicationMap: Map<string, { status: string; appliedAt?: string; id?: string }>
): { status: ApplicationStatusType; appliedAt?: string; applicationId?: string } => {
  const app = applicationMap.get(shiftId);
  if (!app) return { status: "none" };

  const status = app.status as ApplicationStatusType;
  if (status === "withdrawn" || status === "withdrawal_pending") {
    return { status, appliedAt: app.appliedAt, applicationId: app.id };
  }
  return { status, appliedAt: app.appliedAt, applicationId: app.id };
};