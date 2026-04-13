import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/reportUtils";
import type { EarlyPayRequestsEntityStatusEnum } from "@/product-types";

// ─── Status Badge Helpers ─────────────────────────────────────────────────────

export interface StatusBadgeStyle {
  className: string;
  label: string;
}

export function getEarlyPayStatusBadge(status?: EarlyPayRequestsEntityStatusEnum): StatusBadgeStyle {
  switch (status) {
    case "pending":
      return {
        className: "bg-chart-3/20 text-chart-3",
        label: "Pending",
      };
    case "approved":
      return {
        className: "bg-accent/20 text-accent",
        label: "Approved",
      };
    case "denied":
      return {
        className: "bg-destructive/20 text-destructive",
        label: "Denied",
      };
    case "paid":
      return {
        className: "bg-chart-1/20 text-chart-1",
        label: "Paid",
      };
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: status || "Unknown",
      };
  }
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

export function formatCAD(amount: number): string {
  return formatCurrency(amount);
}

export function formatRequestDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatRequestDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
}

export function formatPeriodLabel(periodStart?: string, periodEnd?: string): string {
  if (!periodStart || !periodEnd) return "";
  try {
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    return `${format(start, "MMM d")} \u2013 ${format(end, "MMM d, yyyy")}`;
  } catch {
    return `${periodStart} \u2013 ${periodEnd}`;
  }
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

export function validateEarlyPayAmount(
  amount: number,
  maxAvailable: number
): string | null {
  if (isNaN(amount) || amount <= 0) {
    return "Please enter a valid amount greater than $0";
  }
  if (amount > maxAvailable) {
    return `Amount cannot exceed ${formatCurrency(maxAvailable)}`;
  }
  return null;
}

export function validateEarlyPayReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) {
    return "Please provide a reason for your early pay request";
  }
  if (trimmed.length < 5) {
    return "Reason must be at least 5 characters";
  }
  return null;
}