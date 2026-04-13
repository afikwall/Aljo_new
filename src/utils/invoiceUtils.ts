import { format, parseISO, addDays, isAfter, startOfMonth, endOfMonth } from "date-fns";

// ─── Currency Formatting ────────────────────────────────────────────────────

const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCAD(amount: number): string {
  return cadFormatter.format(amount);
}

// ─── Invoice Status Helpers ─────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export function getInvoiceStatusStyle(status?: string): {
  className: string;
  label: string;
} {
  switch (status) {
    case "draft":
      return {
        className: "bg-muted text-muted-foreground",
        label: "Draft",
      };
    case "sent":
      return {
        className: "bg-chart-1/20 text-chart-1",
        label: "Sent",
      };
    case "paid":
      return {
        className: "bg-accent/20 text-accent-foreground",
        label: "Paid",
      };
    case "overdue":
      return {
        className: "bg-destructive/20 text-destructive",
        label: "Overdue",
      };
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: status || "Unknown",
      };
  }
}

// ─── Date Formatting for Invoices ───────────────────────────────────────────

export function formatInvoiceDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatInvoicePeriod(
  periodStart?: string,
  periodEnd?: string
): string {
  if (!periodStart || !periodEnd) return "";
  try {
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  } catch {
    return `${periodStart} – ${periodEnd}`;
  }
}

export function formatShiftDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "EEE, MMM d");
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "h:mm a");
  } catch {
    return dateStr;
  }
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// ─── Invoice Calculations ───────────────────────────────────────────────────

export function calculateLineTotal(
  netHours: number,
  billingRate: number,
  multiplier: number
): number {
  return Math.round(netHours * billingRate * multiplier * 100) / 100;
}

export function calculateHST(subtotal: number, rate: number = 0.14): number {
  return Math.round(subtotal * rate * 100) / 100;
}

export function calculateInvoiceTotal(
  subtotal: number,
  hstAmount: number
): number {
  return Math.round((subtotal + hstAmount) * 100) / 100;
}

export function getDueDate(fromDate?: Date): string {
  const base = fromDate || new Date();
  return format(addDays(base, 30), "yyyy-MM-dd");
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  try {
    return isAfter(new Date(), parseISO(dueDate));
  } catch {
    return false;
  }
}

// ─── Multiplier Helpers ─────────────────────────────────────────────────────

export function getMultiplier(
  isShortNotice?: boolean,
  isHoliday?: boolean,
  shortNoticeMultiplier: number = 1.0,
  holidayMultiplier: number = 1.5
): number {
  let multiplier = 1.0;
  if (isShortNotice) {
    multiplier *= shortNoticeMultiplier;
  }
  if (isHoliday) {
    multiplier *= holidayMultiplier;
  }
  return multiplier;
}

// ─── Month Range Helpers ────────────────────────────────────────────────────

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function isInCurrentMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    const range = getCurrentMonthRange();
    return date >= range.start && date <= range.end;
  } catch {
    return false;
  }
}

// ─── Grouping Helpers ───────────────────────────────────────────────────────

export interface LineItemForDisplay {
  shiftId: string;
  timeLogId: string;
  staffProfileId: string;
  staffName: string;
  roleType: string;
  shiftDate: string;
  clockInTime: string;
  clockOutTime: string;
  grossHours: number;
  breakMinutes: number;
  netHours: number;
  billingRate: number;
  multiplier: number;
  isShortNotice: boolean;
  isHoliday: boolean;
  lineTotal: number;
  adminAdjusted: boolean;
  shortNoticeMultiplier: number;
  holidayMultiplier: number;
}

export function groupLineItemsByStaff(
  items: LineItemForDisplay[]
): Map<string, LineItemForDisplay[]> {
  const groups = new Map<string, LineItemForDisplay[]>();
  for (const item of items) {
    const key = item.staffProfileId || "unknown";
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }
  return groups;
}

export function getEstimatedBilling(
  items: LineItemForDisplay[]
): number {
  return items.reduce((sum, item) => sum + item.lineTotal, 0);
}

// ─── Day Grouping Helpers ──────────────────────────────────────────────────

export interface DayGroup {
  date: string;
  dayLabel: string;
  items: DayGroupLineItem[];
  daySubtotal: number;
}

export interface DayGroupLineItem {
  shiftId: string;
  staffProfileId?: string;
  staffName?: string;
  staffInitials?: string;
  date?: string;
  dayLabel?: string;
  startTime?: string;
  endTime?: string;
  roleType?: string;
  grossHours?: number;
  breakMinutes?: number;
  netHours: number;
  billingRate: number;
  multiplier?: number;
  isShortNotice?: boolean;
  isHoliday?: boolean;
  lineTotal: number;
  adminAdjusted?: boolean;
  shortNoticeMultiplier?: number;
  holidayMultiplier?: number;
}

/**
 * Groups line items by date, returning sorted day groups with subtotals
 */
export function groupLineItemsByDay(items: DayGroupLineItem[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const item of items) {
    const dateKey = item.date || "unknown";
    const existing = groups.get(dateKey);
    if (existing) {
      existing.items.push(item);
      existing.daySubtotal += item.lineTotal;
    } else {
      groups.set(dateKey, {
        date: dateKey,
        dayLabel: item.dayLabel || formatShiftDate(dateKey),
        items: [item],
        daySubtotal: item.lineTotal,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Gets staff initials in format "A.B." from first and last name
 */
export function getStaffInitialsFormatted(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  const first = firstName?.[0];
  const last = lastName?.[0];
  if (first && last) return `${first}.${last}.`.toUpperCase();
  if (first) return `${first}.`.toUpperCase();
  if (email) return `${email[0]}.`.toUpperCase();
  return "?";
}