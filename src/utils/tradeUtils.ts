import { format, parseISO, differenceInHours, formatDistanceToNow } from "date-fns";

/** Eligibility matrix: a role can fill shifts requiring any role at or below its level */
export const ELIGIBILITY_MATRIX: Record<string, string[]> = {
  RN: ["RN", "LPN", "CCA", "CITR"],
  LPN: ["LPN", "CCA", "CITR"],
  CCA: ["CCA", "CITR"],
  CITR: ["CITR"],
};

/** Check if a staff member with a given role can accept a shift requiring a specific role */
export function isRoleEligible(staffRole: string, shiftRequiredRole: string): boolean {
  const eligible = ELIGIBILITY_MATRIX[staffRole];
  if (!eligible) return false;
  return eligible.includes(shiftRequiredRole);
}

/** Trade status badge styling */
export const TRADE_STATUS_STYLES: Record<string, { className: string; label: string }> = {
  open: { className: "bg-chart-1/20 text-chart-1", label: "Open" },
  pending: { className: "bg-chart-3/20 text-chart-3", label: "Awaiting Admin Approval" },
  accepted: { className: "bg-chart-1/20 text-chart-1", label: "Accepted" },
  admin_approved: { className: "bg-accent/20 text-accent", label: "Approved" },
  rejected: { className: "bg-destructive/20 text-destructive", label: "Rejected" },
  cancelled: { className: "bg-muted text-muted-foreground", label: "Cancelled" },
};

/** Trade type badge styling */
export function getTradeTypeBadge(requestType?: string): { className: string; label: string } {
  if (requestType === "giveaway") {
    return { className: "bg-accent/20 text-accent", label: "Give Away" };
  }
  return { className: "bg-chart-1/20 text-chart-1", label: "Trade" };
}

/** Format shift details into a compact label for selects/cards */
export function formatShiftLabel(
  facilityName?: string,
  startDateTime?: string,
  endDateTime?: string,
  role?: string
): string {
  const parts: string[] = [];
  if (facilityName) parts.push(facilityName);
  if (startDateTime) {
    try {
      parts.push(format(parseISO(startDateTime), "EEE, MMM d"));
      if (endDateTime) {
        parts.push(
          `${format(parseISO(startDateTime), "h:mm a")} - ${format(parseISO(endDateTime), "h:mm a")}`
        );
      }
    } catch {
      // ignore
    }
  }
  if (role) parts.push(role);
  return parts.join(" • ");
}

/** Format shift date and time for trade cards */
export function formatTradeShiftDateTime(startDateTime?: string, endDateTime?: string): string {
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

/** Get shift duration in hours */
export function getTradeShiftDuration(startDateTime?: string, endDateTime?: string): number {
  if (!startDateTime || !endDateTime) return 0;
  try {
    return differenceInHours(parseISO(endDateTime), parseISO(startDateTime));
  } catch {
    return 0;
  }
}

/** Get relative time string */
export function getRelativeTradeTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

/** Role badge colors */
export function getRoleBadgeColor(role?: string): string {
  if (role === "RN") return "bg-chart-1/20 text-chart-1";
  if (role === "LPN") return "bg-chart-2/20 text-chart-2";
  if (role === "CCA") return "bg-chart-3/20 text-chart-3";
  if (role === "CITR") return "bg-chart-4/20 text-chart-4";
  return "bg-muted text-muted-foreground";
}

/** Get staff display name from profile fields */
export function getStaffName(firstName?: string, lastName?: string, email?: string): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }
  return email || "Unknown";
}

/** Get initials for avatar */
export function getStaffInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}