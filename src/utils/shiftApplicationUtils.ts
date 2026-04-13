import { format, parseISO, differenceInHours, formatDistanceToNow } from "date-fns";

export const ROLE_BADGE_COLORS: Record<string, string> = {
  RN: "bg-chart-1/20 text-chart-1",
  LPN: "bg-chart-2/20 text-chart-2",
  CCA: "bg-chart-3/20 text-chart-3",
  CITR: "bg-chart-4/20 text-chart-4",
};

export const COMPLIANCE_BADGE_COLORS: Record<string, { className: string; label: string }> = {
  compliant: { className: "bg-accent/20 text-accent", label: "Compliant" },
  pending: { className: "bg-chart-3/20 text-chart-3", label: "Pending" },
  expired: { className: "bg-destructive/20 text-destructive", label: "Expired" },
  blocked: { className: "bg-destructive/20 text-destructive", label: "Blocked" },
};

export const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: "bg-chart-3/20 text-chart-3",
  approved: "bg-accent/20 text-accent",
  rejected: "bg-destructive/20 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  withdrawal_pending: "bg-chart-3/20 text-chart-3",
};

export function formatShiftDateTime(startDateTime?: string, endDateTime?: string): string {
  if (!startDateTime) return "—";
  try {
    const start = parseISO(startDateTime);
    const startFormatted = format(start, "EEE, MMM d • h:mm a");
    if (endDateTime) {
      const end = parseISO(endDateTime);
      return `${startFormatted} – ${format(end, "h:mm a")}`;
    }
    return startFormatted;
  } catch {
    return "—";
  }
}

export function formatShiftDate(startDateTime?: string): string {
  if (!startDateTime) return "—";
  try {
    return format(parseISO(startDateTime), "EEE, MMM d");
  } catch {
    return "—";
  }
}

export function getShiftDuration(startDateTime?: string, endDateTime?: string): string {
  if (!startDateTime || !endDateTime) return "—";
  try {
    const hours = differenceInHours(parseISO(endDateTime), parseISO(startDateTime));
    return `${hours} hours`;
  } catch {
    return "—";
  }
}

export function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function getStaffDisplayName(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }
  return email || "Unknown";
}

export function getStaffInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}