import type { IStaffProfilesEntity } from "@/product-types";

// --- Education Level Labels ---
export const EDUCATION_LABELS: Record<string, string> = {
  high_school: "High School",
  college: "College",
  diploma: "Diploma",
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  doctorate: "Doctorate",
};

// --- Work Permit Labels ---
export const WORK_PERMIT_LABELS: Record<string, string> = {
  citizen: "Canadian Citizen",
  permanent_resident: "Permanent Resident",
  work_permit: "Work Permit",
};

// --- Payment Method Labels ---
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  direct_deposit: "Direct Deposit",
  cheque: "Cheque",
  e_transfer: "e-Transfer",
};

// --- Role Type Full Names ---
export const ROLE_TYPE_LABELS: Record<string, string> = {
  RN: "RN — Registered Nurse",
  LPN: "LPN — Licensed Practical Nurse",
  CCA: "CCA — Continuing Care Assistant",
  CITR: "CITR — Carer in Training",
};

// --- Compliance Status Config ---
export function getComplianceStatusConfig(status?: string) {
  const configs: Record<string, { className: string; label: string }> = {
    compliant: {
      className: "bg-accent/20 text-accent",
      label: "Compliant",
    },
    pending: {
      className: "bg-chart-3/20 text-chart-3",
      label: "Pending",
    },
    expired: {
      className: "bg-destructive/20 text-destructive",
      label: "Expired",
    },
    blocked: {
      className: "bg-destructive/20 text-destructive",
      label: "Blocked",
    },
  };
  return configs[status || ""] || configs.pending;
}

// --- Required Fields per Section ---

interface SectionCompletion {
  filled: number;
  total: number;
  isComplete: boolean;
}

export function getPersonalInfoCompletion(
  profile: Partial<IStaffProfilesEntity>
): SectionCompletion {
  const required = ["firstName", "lastName", "phone", "dateOfBirth"] as const;
  const filled = required.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return { filled, total: required.length, isComplete: filled === required.length };
}

export function getAddressCompletion(
  profile: Partial<IStaffProfilesEntity>
): SectionCompletion {
  const required = ["city", "province"] as const;
  const filled = required.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return { filled, total: required.length, isComplete: filled === required.length };
}

export function getWorkEligibilityCompletion(
  profile: Partial<IStaffProfilesEntity>
): SectionCompletion {
  const required = ["workPermitStatus", "roleType"] as const;
  const filled = required.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return { filled, total: required.length, isComplete: filled === required.length };
}

export function getPaymentsCompletion(
  profile: Partial<IStaffProfilesEntity>
): SectionCompletion {
  const required = ["paymentMethod"] as const;
  const filled = required.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return { filled, total: required.length, isComplete: filled === required.length };
}

export function getOverallCompletion(
  profile: Partial<IStaffProfilesEntity>
): { filled: number; total: number; percentage: number } {
  const sections = [
    getPersonalInfoCompletion(profile),
    getAddressCompletion(profile),
    getWorkEligibilityCompletion(profile),
    getPaymentsCompletion(profile),
  ];

  const filled = sections.reduce((sum, s) => sum + s.filled, 0);
  const total = sections.reduce((sum, s) => sum + s.total, 0);
  const percentage = total === 0 ? 0 : Math.round((filled / total) * 100);

  return { filled, total, percentage };
}

// --- Field Count Summary for Section Headers ---

export function getPersonalInfoFieldCount(
  profile: Partial<IStaffProfilesEntity>
): string {
  const allFields = ["firstName", "lastName", "phone", "dateOfBirth", "bio", "email"] as const;
  const filled = allFields.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return `${filled} of ${allFields.length} fields`;
}

export function getAddressFieldCount(
  profile: Partial<IStaffProfilesEntity>
): string {
  const allFields = ["streetAddress", "city", "province", "postalCode"] as const;
  const filled = allFields.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return `${filled} of ${allFields.length} fields`;
}

export function getWorkEligibilityFieldCount(
  profile: Partial<IStaffProfilesEntity>
): string {
  const allFields = ["workPermitStatus", "roleType", "sinNumber"] as const;
  const filled = allFields.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  return `${filled} of ${allFields.length} fields`;
}

export function getEducationFieldCount(
  profile: Partial<IStaffProfilesEntity>
): string {
  const allFields = ["highestEducation", "institution", "graduationYear"] as const;
  const filled = allFields.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  const certCount = profile.certifications?.items?.length || 0;
  const totalFilled = filled + (certCount > 0 ? 1 : 0);
  return `${totalFilled} of ${allFields.length + 1} fields`;
}

export function getExperienceFieldCount(
  profile: Partial<IStaffProfilesEntity>
): string {
  let filled = 0;
  let total = 4;
  if (profile.yearsOfExperience !== undefined && profile.yearsOfExperience !== null) filled++;
  if (profile.languages && profile.languages.length > 0) filled++;
  if (profile.specialSkills && profile.specialSkills.length > 0) filled++;
  if (profile.professionalReferences && profile.professionalReferences.length > 0) filled++;
  return `${filled} of ${total} fields`;
}

export function getPaymentsFieldCount(
  profile: Partial<IStaffProfilesEntity>
): string {
  const allFields = ["paymentMethod"] as const;
  let filled = allFields.filter(
    (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== ""
  ).length;
  let total = 1;
  if (profile.paymentMethod === "direct_deposit") {
    total += 3;
    if (profile.bankName) filled++;
    if (profile.bankAccountLast4) filled++;
    if (profile.bankTransitNumber) filled++;
  }
  return `${filled} of ${total} fields`;
}

// --- User Initials ---
export function getUserInitials(firstName?: string, lastName?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) return firstName[0].toUpperCase();
  return "U";
}

// --- Masked SIN ---
export function getMaskedSin(sinNumber?: string): string {
  if (!sinNumber) return "Not set";
  if (sinNumber.length >= 3) {
    return `***-***-${sinNumber.slice(-3)}`;
  }
  return "***-***-***";
}