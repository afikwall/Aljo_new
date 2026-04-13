import type { ShiftPillVariant } from "@/components/ShiftPill";

/**
 * A processed shift event ready for display on the calendar.
 */
export interface CalendarShiftEvent {
  applicationId: string;
  shiftId: string;
  facilityName: string;
  startDateTime: string;
  endDateTime: string;
  requiredRole: string;
  applicationStatus: string;
  shiftStatus: string;
  variant: ShiftPillVariant;
}

/**
 * A holiday entry for display on the calendar.
 */
export interface CalendarHoliday {
  date: string;
  name: string;
  multiplier?: number;
}

/**
 * A blocked date record for display/management.
 */
export interface CalendarBlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}