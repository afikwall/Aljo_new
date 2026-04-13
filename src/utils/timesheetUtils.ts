import { format, parseISO } from "date-fns";
import type { DateRange } from "@/utils/reportUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "approved" | "paid";

export type TimesheetTabValue = "pending" | "approved" | "paid" | "all";

export interface TimesheetWithRelations {
  id: string;
  staffProfileId?: string;
  facilityProfileId?: string;
  shiftProfileId?: string;
  timeLogProfileId?: string;
  totalHours?: number;
  hourlyRate?: number;
  multiplier?: number;
  grossPay?: number;
  paymentStatus?: PaymentStatus;
  periodStart?: string;
  periodEnd?: string;
  paidAt?: string;
  approvedAt?: string;
  approvedByEmail?: string;
  adjustmentNote?: string;
  // Resolved display fields
  staffName: string;
  staffInitials: string;
  staffRole: string;
  facilityName: string;
  shiftDate: string;
  earlyPayRequestId?: string;
}

export interface StaffOutstandingData {
  staffProfileId: string;
  staffName: string;
  staffInitials: string;
  staffRole: string;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  totalOutstanding: number;
}

export interface StaffTimesheetGroup {
  staffProfileId: string;
  staffName: string;
  staffInitials: string;
  staffRole: string;
  timesheets: TimesheetWithRelations[];
  subtotalGrossPay: number;
}

// ─── Status Badge Styling ───────────────────────────────────────────────────

export function getPaymentStatusStyle(status?: string): {
  className: string;
  label: string;
} {
  switch (status) {
    case "pending":
      return {
        className: "bg-chart-3/20 text-chart-3",
        label: "Pending",
      };
    case "approved":
      return {
        className: "bg-chart-1/20 text-chart-1",
        label: "Approved",
      };
    case "paid":
      return {
        className: "bg-accent/20 text-accent",
        label: "Paid",
      };
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: status || "Unknown",
      };
  }
}

// ─── Summary Calculations ───────────────────────────────────────────────────

export function calculateSummary(
  timesheets: TimesheetWithRelations[],
  status: PaymentStatus,
  dateRange?: DateRange
): { count: number; total: number } {
  const filtered = timesheets.filter((ts) => {
    if (ts.paymentStatus !== status) return false;

    // For "paid" status with dateRange, filter by period
    if (status === "paid" && dateRange) {
      if (!ts.periodStart || !ts.periodEnd) return false;
      try {
        const periodStart = parseISO(ts.periodStart);
        const periodEnd = parseISO(ts.periodEnd);
        return periodStart >= dateRange.start && periodEnd <= dateRange.end;
      } catch {
        return false;
      }
    }

    return true;
  });

  return {
    count: filtered.length,
    total: filtered.reduce((sum, ts) => sum + (ts.grossPay || 0), 0),
  };
}

// ─── Filtering ──────────────────────────────────────────────────────────────

export function filterTimesheetsByTab(
  timesheets: TimesheetWithRelations[],
  tab: TimesheetTabValue
): TimesheetWithRelations[] {
  if (tab === "all") return timesheets;
  return timesheets.filter((ts) => ts.paymentStatus === tab);
}

export function filterTimesheetsByStaff(
  timesheets: TimesheetWithRelations[],
  staffProfileId: string | null
): TimesheetWithRelations[] {
  if (!staffProfileId) return timesheets;
  return timesheets.filter((ts) => ts.staffProfileId === staffProfileId);
}

export function filterTimesheetsByPeriod(
  timesheets: TimesheetWithRelations[],
  dateRange: DateRange
): TimesheetWithRelations[] {
  return timesheets.filter((ts) => {
    if (!ts.periodStart) return false;
    try {
      const periodStart = parseISO(ts.periodStart);
      return periodStart >= dateRange.start && periodStart <= dateRange.end;
    } catch {
      return false;
    }
  });
}

// ─── Grouping ───────────────────────────────────────────────────────────────

export function groupTimesheetsByStaff(
  timesheets: TimesheetWithRelations[]
): StaffTimesheetGroup[] {
  const groups = new Map<string, StaffTimesheetGroup>();

  for (const ts of timesheets) {
    const key = ts.staffProfileId || "unknown";
    const existing = groups.get(key);

    if (existing) {
      existing.timesheets.push(ts);
      existing.subtotalGrossPay += ts.grossPay || 0;
    } else {
      groups.set(key, {
        staffProfileId: key,
        staffName: ts.staffName,
        staffInitials: ts.staffInitials,
        staffRole: ts.staffRole,
        timesheets: [ts],
        subtotalGrossPay: ts.grossPay || 0,
      });
    }
  }

  // Sort groups by staff name
  return Array.from(groups.values()).sort((a, b) =>
    a.staffName.localeCompare(b.staffName)
  );
}

// ─── Outstanding Balances ───────────────────────────────────────────────────

export function calculateOutstandingBalances(
  timesheets: TimesheetWithRelations[]
): StaffOutstandingData[] {
  const staffMap = new Map<string, StaffOutstandingData>();

  for (const ts of timesheets) {
    if (ts.paymentStatus !== "pending" && ts.paymentStatus !== "approved") continue;

    const key = ts.staffProfileId || "unknown";
    let data = staffMap.get(key);

    if (!data) {
      data = {
        staffProfileId: key,
        staffName: ts.staffName,
        staffInitials: ts.staffInitials,
        staffRole: ts.staffRole,
        pendingCount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
        totalOutstanding: 0,
      };
      staffMap.set(key, data);
    }

    const amount = ts.grossPay || 0;
    if (ts.paymentStatus === "pending") {
      data.pendingCount++;
      data.pendingAmount += amount;
    } else {
      data.approvedCount++;
      data.approvedAmount += amount;
    }
    data.totalOutstanding += amount;
  }

  // Sort by total outstanding descending
  return Array.from(staffMap.values()).sort(
    (a, b) => b.totalOutstanding - a.totalOutstanding
  );
}

// ─── Formatting ─────────────────────────────────────────────────────────────

export function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatShiftDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "EEE, MMM d");
  } catch {
    return "N/A";
  }
}

export function formatShiftDateFull(dateStr?: string): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return "N/A";
  }
}

export function calculateGrossPay(
  totalHours: number,
  hourlyRate: number,
  multiplier: number
): number {
  return Math.round(totalHours * hourlyRate * multiplier * 100) / 100;
}

// ─── Date Range Filtering ───────────────────────────────────────────────────

export function filterTimesheetsByDateRange(
  timesheets: TimesheetWithRelations[],
  fromDate: string | null,
  toDate: string | null
): TimesheetWithRelations[] {
  if (!fromDate && !toDate) return timesheets;
  return timesheets.filter((ts) => {
    if (!ts.shiftDate) return false;
    const date = ts.shiftDate.slice(0, 10);
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  });
}

// ─── Staff Unique List ──────────────────────────────────────────────────────

export function getUniqueStaffFromTimesheets(
  timesheets: TimesheetWithRelations[]
): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const ts of timesheets) {
    if (ts.staffProfileId && !seen.has(ts.staffProfileId)) {
      seen.set(ts.staffProfileId, ts.staffName);
    }
  }
  return Array.from(seen.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}