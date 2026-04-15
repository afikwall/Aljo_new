import type {
  StaffDocumentsEntityDocumentTypeEnum,
  StaffDocumentsEntityDocumentCategoryEnum,
  IStaffDocumentsEntity,
} from "@/product-types";
import { isPast, parseISO } from "date-fns";

// --- Document Type Constants ---

export const REQUIRED_DOCS_BY_ROLE: Record<
  string,
  StaffDocumentsEntityDocumentTypeEnum[]
> = {
  RN: ["contractor_letter", "resume", "nursing_license", "cpr_certification", "liability_coverage", "police_check", "work_permit", "sin_copy", "covid_vaccination", "photo_id", "void_cheque"],
  LPN: ["contractor_letter", "resume", "nursing_license", "cpr_certification", "liability_coverage", "police_check", "work_permit", "sin_copy", "covid_vaccination", "photo_id", "void_cheque"],
  CCA: ["contractor_letter", "resume", "cca_certificate", "cpr_certification", "police_check", "work_permit", "sin_copy", "covid_vaccination", "photo_id", "void_cheque"],
  CITR: ["contractor_letter", "resume", "police_check", "work_permit", "sin_copy", "covid_vaccination", "photo_id", "void_cheque"],
};

export const DOCUMENT_TYPE_LABELS: Record<
  StaffDocumentsEntityDocumentTypeEnum,
  string
> = {
  contractor_letter: "Signed Independent Contractor Letter",
  resume: "Resume",
  nursing_license: "NSCN Registration",
  cpr_certification: "CPR/First Aid",
  liability_coverage: "Letter of Professional Liability Coverage",
  police_check: "Vulnerability Sector Police Check",
  work_permit: "Work Permit / PR Card",
  sin_copy: "Copy of SIN",
  covid_vaccination: "Proof of COVID Vaccination",
  photo_id: "Photo ID (Driver's License)",
  void_cheque: "Void Cheque / Direct Deposit Form",
  cca_certificate: "CCA Registry / CCA Certificate",
  government_id: "Government ID",
  background_check: "Background Check",
  tb_test: "TB Test",
};

/**
 * Returns hint text for the expiry date field.
 */
export function getExpiryHintText(_docType: StaffDocumentsEntityDocumentTypeEnum): string {
  return "Optional — add if your document has an expiry date";
}

// --- Document Category Mapping ---

export const DOCUMENT_TYPE_TO_CATEGORY: Record<
  StaffDocumentsEntityDocumentTypeEnum,
  StaffDocumentsEntityDocumentCategoryEnum
> = {
  contractor_letter: "other",
  resume: "other",
  nursing_license: "certification",
  cpr_certification: "certification",
  liability_coverage: "certification",
  police_check: "identification",
  work_permit: "identification",
  sin_copy: "identification",
  covid_vaccination: "medical",
  photo_id: "identification",
  void_cheque: "other",
  cca_certificate: "certification",
  government_id: "identification",
  background_check: "identification",
  tb_test: "medical",
};

// --- Optional Document Category Options ---

export const OPTIONAL_DOCUMENT_CATEGORIES = [
  { value: "first_aid", label: "First Aid" },
  { value: "cpr_advanced", label: "CPR Advanced" },
  { value: "specialty_certification", label: "Specialty Certification" },
  { value: "training_certificate", label: "Training Certificate" },
  { value: "reference_letter", label: "Reference Letter" },
  { value: "other", label: "Other" },
] as const;

export type OptionalDocumentCategoryValue =
  (typeof OPTIONAL_DOCUMENT_CATEGORIES)[number]["value"];

/**
 * Map optional document category selection to database documentCategory enum
 */
export function mapOptionalCategoryToDbCategory(
  category: OptionalDocumentCategoryValue
): StaffDocumentsEntityDocumentCategoryEnum {
  switch (category) {
    case "first_aid":
    case "cpr_advanced":
      return "medical";
    case "specialty_certification":
    case "training_certificate":
      return "certification";
    case "reference_letter":
    case "other":
    default:
      return "other";
  }
}

// --- Status Types ---

export type DocumentStatus =
  | "missing"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired";

export const STATUS_SORT_ORDER: Record<DocumentStatus, number> = {
  missing: 0,
  rejected: 1,
  expired: 2,
  pending_review: 3,
  approved: 4,
};

// --- Helper Functions ---

export function isImageFile(url?: string, fileName?: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const lower = (url || fileName || "").toLowerCase();
  return imageExtensions.some((ext) => lower.endsWith(ext));
}

export function getDocumentStatus(doc: IStaffDocumentsEntity): DocumentStatus {
  if (doc.reviewStatus === "approved" && doc.expiryDate) {
    try {
      if (isPast(parseISO(doc.expiryDate))) return "expired";
    } catch {
      // invalid date, treat as approved
    }
  }
  return (doc.reviewStatus as DocumentStatus) || "missing";
}

export function getCardStatus(
  docs: IStaffDocumentsEntity[]
): DocumentStatus {
  if (docs.length === 0) return "missing";

  const statuses = docs.map(getDocumentStatus);

  if (statuses.includes("approved")) return "approved";
  if (statuses.includes("pending_review")) return "pending_review";
  if (statuses.includes("rejected")) return "rejected";
  if (statuses.includes("expired")) return "expired";

  return "missing";
}

/**
 * Get the required document types for a given role
 */
export function getRequiredDocTypesForRole(
  roleType?: string
): StaffDocumentsEntityDocumentTypeEnum[] {
  return REQUIRED_DOCS_BY_ROLE[roleType || ""] || REQUIRED_DOCS_BY_ROLE["CITR"];
}

/**
 * Check if a document is considered "required" for compliance purposes.
 * Treats null/undefined isRequired as true for backward compatibility.
 */
export function isDocumentRequired(doc: IStaffDocumentsEntity): boolean {
  return doc.isRequired !== false;
}

/**
 * Filter documents to only those that are required for compliance.
 */
export function filterRequiredDocuments(
  documents: IStaffDocumentsEntity[]
): IStaffDocumentsEntity[] {
  return documents.filter(isDocumentRequired);
}

/**
 * Filter documents to only those that are optional (isRequired === false).
 */
export function filterOptionalDocuments(
  documents: IStaffDocumentsEntity[]
): IStaffDocumentsEntity[] {
  return documents.filter((doc) => doc.isRequired === false);
}

/**
 * Get the display name for a document - uses customDocumentName for optional docs,
 * DOCUMENT_TYPE_LABELS for required docs
 */
export function getDocumentDisplayName(doc: IStaffDocumentsEntity): string {
  if (doc.customDocumentName) return doc.customDocumentName;
  if (doc.documentType) return DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType;
  return "Unknown Document";
}

/**
 * Get border color class based on document status
 */
export function getStatusBorderClass(status: DocumentStatus): string {
  switch (status) {
    case "missing":
      return "border-l-4 border-l-destructive bg-destructive/5";
    case "pending_review":
      return "border-l-4 border-l-chart-3 bg-chart-3/5";
    case "approved":
      return "border-l-4 border-l-accent bg-accent/5";
    case "rejected":
      return "border-l-4 border-l-destructive bg-destructive/5";
    case "expired":
      return "border-l-4 border-l-chart-3 bg-chart-3/5";
    default:
      return "";
  }
}