import { format, parseISO, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, addDays, isWithinInterval, differenceInDays } from "date-fns";

// ─── Date Range Presets ─────────────────────────────────────────────────────

export type DatePreset = "this_week" | "last_week" | "this_pay_period" | "last_pay_period" | "this_month" | "last_month" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Bi-weekly pay period anchor: Monday, January 6, 2025 */
const PAY_PERIOD_ANCHOR = new Date(2025, 0, 6);

/**
 * Get the current pay period (bi-weekly starting from a Monday).
 * Anchored to January 6, 2025. Every 14 days from that anchor is a new pay period.
 */
export function getCurrentPayPeriod(): DateRange {
  const now = new Date();
  // Get the most recent Monday (or today if Monday)
  const thisMonday = startOfWeek(now, { weekStartsOn: 1 });
  // Count weeks since anchor
  const diffMs = thisMonday.getTime() - PAY_PERIOD_ANCHOR.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  // If diffWeeks is even → current period starts at thisMonday; if odd → started last Monday
  const periodStart = diffWeeks % 2 === 0 ? thisMonday : subWeeks(thisMonday, 1);
  const periodEnd = addDays(periodStart, 13); // 14-day period
  periodEnd.setHours(23, 59, 59, 999);

  return { start: periodStart, end: periodEnd };
}

/**
 * Returns a formatted label for a pay period, e.g. "Feb 3 – Feb 16, 2026"
 */
export function getPayPeriodLabel(range: DateRange): string {
  return `${format(range.start, "MMM d")} – ${format(range.end, "MMM d, yyyy")}`;
}

/**
 * Returns the sequential pay period number (1-indexed) since the anchor date (Jan 6, 2025).
 */
export function getPayPeriodNumber(range: DateRange): number {
  const diffMs = range.start.getTime() - PAY_PERIOD_ANCHOR.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  const periodIndex = Math.floor(diffDays / 14);
  return periodIndex + 1; // 1-indexed
}

/**
 * Returns the number of days remaining in a pay period (including today as a full day).
 */
export function getPayPeriodDaysRemaining(range: DateRange): number {
  const now = new Date();
  const endOfPeriod = new Date(range.end);
  endOfPeriod.setHours(23, 59, 59, 999);
  const remaining = differenceInDays(endOfPeriod, now);
  return Math.max(0, remaining);
}

export function getDateRangeForPreset(preset: DatePreset, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();

  switch (preset) {
    case "this_week": {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last_week": {
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      lastWeekEnd.setHours(23, 59, 59, 999);
      return { start: lastWeekStart, end: lastWeekEnd };
    }
    case "this_pay_period":
      return getCurrentPayPeriod();
    case "last_pay_period": {
      const current = getCurrentPayPeriod();
      const start = subWeeks(current.start, 2);
      const end = addDays(start, 13);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "this_month": {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "custom": {
      return {
        start: customStart || startOfWeek(now, { weekStartsOn: 1 }),
        end: customEnd || endOfWeek(now, { weekStartsOn: 1 }),
      };
    }
    default:
      return getCurrentPayPeriod();
  }
}

export function formatDateRange(start: Date, end: Date): string {
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

// ─── Filtering Helpers ──────────────────────────────────────────────────────

export function isDateInRange(dateStr: string | undefined, range: DateRange): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    return isWithinInterval(date, { start: range.start, end: range.end });
  } catch {
    return false;
  }
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) return "N/A";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function downloadCSV(data: Record<string, string | number>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const strVal = String(val ?? "");
        // Escape commas and quotes
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(",")
    ),
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getCSVFilename(section: string, start: Date, end: Date): string {
  return `${section}-${format(start, "yyyy-MM-dd")}-to-${format(end, "yyyy-MM-dd")}.csv`;
}

// ─── Lookup Map Builders ────────────────────────────────────────────────────

export function buildLookupMap<T extends { id?: string }>(items: T[] | undefined): Map<string, T> {
  const map = new Map<string, T>();
  if (!items) return map;
  for (const item of items) {
    if (item.id) {
      map.set(item.id, item);
    }
  }
  return map;
}

export function buildRateKey(facilityId: string, roleType: string): string {
  return `${facilityId}__${roleType}`;
}

export function buildRateLookupMap<T extends { facilityProfileId?: string; roleType?: string }>(
  items: T[] | undefined
): Map<string, T> {
  const map = new Map<string, T>();
  if (!items) return map;
  for (const item of items) {
    if (item.facilityProfileId && item.roleType) {
      map.set(buildRateKey(item.facilityProfileId, item.roleType), item);
    }
  }
  return map;
}

// ─── Staff Name Helper ──────────────────────────────────────────────────────

export function getStaffName(staff: { firstName?: string; lastName?: string } | undefined): string {
  if (!staff) return "Unknown";
  const first = staff.firstName || "";
  const last = staff.lastName || "";
  if (!first && !last) return "Unknown";
  return `${first} ${last}`.trim();
}

export function getStaffInitials(staff: { firstName?: string; lastName?: string } | undefined): string {
  if (!staff) return "?";
  const first = staff.firstName?.[0] || "";
  const last = staff.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "?";
}