import type { StaffDocumentsEntityDocumentTypeEnum } from "@/product-types";
import { getRequiredDocTypesForRole } from "@/utils/documentUtils";
import { format, parseISO } from "date-fns";

// --- Role Full Names ---
export const ROLE_FULL_NAMES: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CCA: "Continuing Care Assistant",
  CITR: "Carer in Training",
};

// --- Role Descriptions ---
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  RN: "Registered Nurses provide advanced clinical care, administer medications, develop care plans, and supervise other nursing staff.",
  LPN: "Licensed Practical Nurses deliver direct patient care under the supervision of RNs, including medication administration and wound care.",
  CCA: "Continuing Care Assistants provide personal care and support to clients in home care, long-term care, and community settings.",
  CITR: "Carers in Training are developing foundational healthcare skills through supervised practical experience and training programs.",
};

// --- Role Upgrade Progression ---
export const ROLE_UPGRADE_MAP: Record<string, string | null> = {
  CITR: "CCA",
  CCA: "LPN",
  LPN: "RN",
  RN: null,
};

/**
 * Get the next role a staff member can upgrade to based on their current role.
 * Returns null if they hold the highest qualification (RN).
 */
export function getNextUpgradeRole(currentRole?: string): string | null {
  if (!currentRole) return null;
  return ROLE_UPGRADE_MAP[currentRole] ?? null;
}

/**
 * Get the additional document types needed for a target role
 * that are not required for the current role.
 */
export function getAdditionalDocsForUpgrade(
  currentRole: string,
  targetRole: string
): StaffDocumentsEntityDocumentTypeEnum[] {
  const currentDocs = getRequiredDocTypesForRole(currentRole);
  const targetDocs = getRequiredDocTypesForRole(targetRole);
  return targetDocs.filter((doc) => !currentDocs.includes(doc));
}

/**
 * Get status badge styling for role upgrade application statuses
 */
export function getUpgradeStatusBadge(status?: string): {
  className: string;
  label: string;
} {
  switch (status) {
    case "pending":
      return { className: "bg-chart-3/20 text-chart-3", label: "Pending" };
    case "under_review":
      return { className: "bg-chart-1/20 text-chart-1", label: "Under Review" };
    case "approved":
      return { className: "bg-accent/20 text-accent", label: "Approved" };
    case "rejected":
      return {
        className: "bg-destructive/20 text-destructive",
        label: "Rejected",
      };
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: "Unknown",
      };
  }
}

/**
 * Format a datetime string to a user-friendly date
 */
export function formatApplicationDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return "";
  }
}