import type { IStaffProfilesEntity, StaffDocumentsEntityDocumentTypeEnum, IStaffDocumentsEntity } from "@/product-types";
import { isPast, parseISO } from "date-fns";

/**
 * Required profile fields for onboarding Step 1
 */
export const REQUIRED_PROFILE_FIELDS: {
  key: keyof IStaffProfilesEntity;
  label: string;
}[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "phone", label: "Phone Number" },
  { key: "roleType", label: "Role Type" },
  { key: "city", label: "City" },
  { key: "province", label: "Province" },
  { key: "emergencyContactName", label: "Emergency Contact Name" },
  { key: "emergencyContactPhone", label: "Emergency Contact Phone" },
];

/**
 * Base documents required for all roles
 */
const BASE_DOCUMENTS: StaffDocumentsEntityDocumentTypeEnum[] = [
  "government_id",
  "background_check",
  "tb_test",
  "covid_vaccination",
];

/**
 * Additional documents per role type
 */
const ROLE_ADDITIONAL_DOCUMENTS: Record<string, StaffDocumentsEntityDocumentTypeEnum[]> = {
  RN: ["nursing_license", "cpr_certification"],
  LPN: ["nursing_license", "cpr_certification"],
  CCA: ["cpr_certification"],
  CITR: [],
};

/**
 * Human-readable labels for document types
 */
export const DOCUMENT_TYPE_LABELS: Record<StaffDocumentsEntityDocumentTypeEnum, string> = {
  government_id: "Government ID",
  background_check: "Background Check",
  tb_test: "TB Test",
  covid_vaccination: "COVID Vaccination",
  nursing_license: "Nursing License",
  cpr_certification: "CPR Certification",
};

/**
 * Get required documents for a given role type
 */
export function getRequiredDocuments(
  roleType?: string
): StaffDocumentsEntityDocumentTypeEnum[] {
  const additional = ROLE_ADDITIONAL_DOCUMENTS[roleType || ""] || [];
  return [...BASE_DOCUMENTS, ...additional];
}

/**
 * Check how many required profile fields are filled
 */
export function getProfileCompletion(
  profile?: IStaffProfilesEntity | null
): { filled: number; total: number; allFilled: boolean; fieldStatuses: { key: string; label: string; filled: boolean }[] } {
  const total = REQUIRED_PROFILE_FIELDS.length;
  const fieldStatuses = REQUIRED_PROFILE_FIELDS.map((field) => {
    const value = profile?.[field.key];
    const filled = value !== undefined && value !== null && value !== "";
    return { key: field.key, label: field.label, filled };
  });
  const filled = fieldStatuses.filter((f) => f.filled).length;
  return { filled, total, allFilled: filled === total, fieldStatuses };
}

/**
 * Document status for the wizard
 */
export type WizardDocumentStatus = "missing" | "pending_review" | "approved" | "rejected" | "expired";

/**
 * Get document upload status for each required document.
 * Only considers required documents (isRequired !== false) for compliance tracking.
 */
export function getDocumentCompletion(
  roleType?: string,
  documents?: IStaffDocumentsEntity[]
): {
  uploaded: number;
  total: number;
  allUploaded: boolean;
  documentStatuses: { type: StaffDocumentsEntityDocumentTypeEnum; label: string; status: WizardDocumentStatus }[];
} {
  const requiredDocTypes = getRequiredDocuments(roleType);
  const total = requiredDocTypes.length;

  // Filter to only required documents for compliance evaluation
  const requiredDocs = documents ? filterRequiredDocuments(documents) : [];

  const documentStatuses = requiredDocTypes.map((docType) => {
    const doc = requiredDocs.find((d) => d.documentType === docType);
    let status: WizardDocumentStatus = "missing";
    if (doc) {
      status = doc.reviewStatus as WizardDocumentStatus || "pending_review";
    }
    return {
      type: docType,
      label: DOCUMENT_TYPE_LABELS[docType],
      status,
    };
  });

  // Uploaded means not missing — pending_review, approved, or expired all count as uploaded
  const uploaded = documentStatuses.filter((d) => d.status !== "missing").length;
  // Can proceed when all are uploaded AND none are rejected
  const allUploaded = documentStatuses.every(
    (d) => d.status !== "missing" && d.status !== "rejected"
  );

  return { uploaded, total, allUploaded, documentStatuses };
}

/**
 * Determine the first incomplete wizard step based on profile and document data
 * Returns 0-indexed step (0=profile, 1=documents, 2=terms, 3=complete)
 */
export function getFirstIncompleteStep(
  profile?: IStaffProfilesEntity | null,
  documents?: IStaffDocumentsEntity[]
): number {
  // Step 1: Check profile completion
  const profileCompletion = getProfileCompletion(profile);
  if (!profileCompletion.allFilled) return 0;

  // Step 2: Check document uploads
  const docCompletion = getDocumentCompletion(profile?.roleType, documents);
  if (!docCompletion.allUploaded) return 1;

  // Step 3: Check if terms were already acknowledged (onboardingStatus changed to pending_review)
  if (profile?.onboardingStatus !== "pending_review" && profile?.onboardingStatus !== "approved") {
    return 2;
  }

  // All steps complete
  return 3;
}

/**
 * Wizard step definitions
 */
export const WIZARD_STEPS = [
  { number: 1, label: "Profile", shortLabel: "Profile" },
  { number: 2, label: "Documents", shortLabel: "Docs" },
  { number: 3, label: "Terms", shortLabel: "Terms" },
  { number: 4, label: "Complete", shortLabel: "Done" },
];

/**
 * Check if a document is considered "required" for compliance purposes.
 * Treats null/undefined isRequired as true for backward compatibility
 * with existing records that were created before the isRequired field existed.
 */
export function isDocumentRequired(doc: IStaffDocumentsEntity): boolean {
  return doc.isRequired !== false;
}

/**
 * Filter documents to only those that are required for compliance.
 * Documents with isRequired === false are excluded.
 * Documents with isRequired === true, null, or undefined are included (backward compatible).
 */
export function filterRequiredDocuments(documents: IStaffDocumentsEntity[]): IStaffDocumentsEntity[] {
  return documents.filter(isDocumentRequired);
}

/**
 * Filter documents to only those that are optional (isRequired === false).
 */
export function filterOptionalDocuments(documents: IStaffDocumentsEntity[]): IStaffDocumentsEntity[] {
  return documents.filter((doc) => doc.isRequired === false);
}

/**
 * Determine the effective review status of a document, accounting for expiry.
 * An approved document that has passed its expiry date is treated as "expired".
 */
export function getEffectiveDocumentStatus(doc: IStaffDocumentsEntity): WizardDocumentStatus {
  if (doc.reviewStatus === "approved" && doc.expiryDate) {
    try {
      if (isPast(parseISO(doc.expiryDate))) return "expired";
    } catch {
      // invalid date, treat as approved
    }
  }
  return (doc.reviewStatus as WizardDocumentStatus) || "missing";
}

/**
 * Calculate compliance status for a staff member based ONLY on required documents.
 *
 * Rules:
 * - "compliant": ALL required documents for the staff's role are approved (and not expired)
 * - "not_compliant" / "pending": Any required document is missing, rejected, or expired
 * - Optional documents (isRequired === false) NEVER affect compliance status
 * - Documents with isRequired === null/undefined are treated as required (backward compatibility)
 *
 * Returns the computed compliance status and details for each required document.
 */
export function calculateComplianceStatus(
  roleType?: string,
  documents?: IStaffDocumentsEntity[]
): {
  status: "compliant" | "pending" | "expired";
  approvedCount: number;
  totalRequired: number;
  progressPercent: number;
  allApproved: boolean;
  hasExpired: boolean;
  documentDetails: Array<{
    type: StaffDocumentsEntityDocumentTypeEnum;
    label: string;
    status: WizardDocumentStatus;
  }>;
} {
  const requiredDocTypes = getRequiredDocuments(roleType);
  const totalRequired = requiredDocTypes.length;

  // Only consider required documents (isRequired !== false)
  const requiredDocs = documents ? filterRequiredDocuments(documents) : [];

  const documentDetails = requiredDocTypes.map((docType) => {
    const doc = requiredDocs.find((d) => d.documentType === docType);
    let status: WizardDocumentStatus = "missing";
    if (doc) {
      status = getEffectiveDocumentStatus(doc);
    }
    return {
      type: docType,
      label: DOCUMENT_TYPE_LABELS[docType],
      status,
    };
  });

  const approvedCount = documentDetails.filter((d) => d.status === "approved").length;
  const hasExpired = documentDetails.some((d) => d.status === "expired");
  const allApproved = approvedCount === totalRequired;
  const progressPercent = totalRequired > 0 ? Math.round((approvedCount / totalRequired) * 100) : 0;

  let status: "compliant" | "pending" | "expired";
  if (allApproved) {
    status = "compliant";
  } else if (hasExpired) {
    status = "expired";
  } else {
    status = "pending";
  }

  return {
    status,
    approvedCount,
    totalRequired,
    progressPercent,
    allApproved,
    hasExpired,
    documentDetails,
  };
}