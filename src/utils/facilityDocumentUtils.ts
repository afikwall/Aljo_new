import type { FacilityDocumentsEntityDocumentTypeEnum } from "@/product-types";
import { isPast, parseISO, differenceInDays } from "date-fns";

// --- Document Type Labels ---

export const FACILITY_DOCUMENT_TYPE_LABELS: Record<
  FacilityDocumentsEntityDocumentTypeEnum,
  string
> = {
  contract: "Contract",
  insurance: "Insurance",
  license: "License",
  docusign: "DocuSign",
  other: "Other",
};

// --- Document Type Badge Colors ---

export const FACILITY_DOCUMENT_TYPE_COLORS: Record<
  FacilityDocumentsEntityDocumentTypeEnum,
  string
> = {
  contract: "bg-chart-1/20 text-chart-1",
  insurance: "bg-accent/20 text-accent",
  license: "bg-chart-4/20 text-chart-4",
  docusign: "bg-chart-3/20 text-chart-3",
  other: "bg-muted text-muted-foreground",
};

// --- Document Type Options for Select ---

export const FACILITY_DOCUMENT_TYPE_OPTIONS: {
  value: FacilityDocumentsEntityDocumentTypeEnum;
  label: string;
}[] = [
  { value: "contract", label: "Contract" },
  { value: "insurance", label: "Insurance" },
  { value: "license", label: "License" },
  { value: "docusign", label: "DocuSign" },
  { value: "other", label: "Other" },
];

// --- Expiry Status ---

export type ExpiryStatus = "expired" | "expiring_soon" | "valid" | "none";

export function getExpiryStatus(expiryDate?: string | null): ExpiryStatus {
  if (!expiryDate) return "none";

  try {
    const date = parseISO(expiryDate);
    if (isPast(date)) return "expired";
    if (differenceInDays(date, new Date()) <= 30) return "expiring_soon";
    return "valid";
  } catch {
    return "none";
  }
}

export function getExpiryBadgeProps(status: ExpiryStatus): {
  label: string;
  className: string;
} | null {
  switch (status) {
    case "expired":
      return {
        label: "Expired",
        className: "bg-destructive/20 text-destructive",
      };
    case "expiring_soon":
      return {
        label: "Expiring Soon",
        className: "bg-chart-3/20 text-chart-3",
      };
    default:
      return null;
  }
}

// --- File Helpers ---

export const ACCEPTED_FILE_TYPES = "image/*,application/pdf";

export function getDocumentTypeLabel(
  type?: FacilityDocumentsEntityDocumentTypeEnum
): string {
  if (!type) return "Other";
  return FACILITY_DOCUMENT_TYPE_LABELS[type] || "Other";
}

export function getDocumentTypeBadgeClass(
  type?: FacilityDocumentsEntityDocumentTypeEnum
): string {
  if (!type) return FACILITY_DOCUMENT_TYPE_COLORS.other;
  return FACILITY_DOCUMENT_TYPE_COLORS[type] || FACILITY_DOCUMENT_TYPE_COLORS.other;
}