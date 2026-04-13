import type {
  IFacilityManagerProfilesEntity,
  IFacilityFavoritesEntity,
  IStaffProfilesEntity,
  IShiftsEntity,
} from "@/product-types";

/**
 * Role eligibility matrix.
 * Defines which staff roles can fill which shift required roles.
 * Higher-qualified staff can fill lower-level positions.
 */
const ROLE_ELIGIBILITY: Record<string, string[]> = {
  RN: ["RN"],
  LPN: ["RN", "LPN"],
  CCA: ["RN", "LPN", "CCA"],
  CITR: ["RN", "LPN", "CCA", "CITR"],
};

/**
 * Checks if a staff member's role is eligible for a shift's required role.
 */
export const isStaffEligibleForRole = (
  staffRoleType: string | undefined,
  shiftRequiredRole: string | undefined
): boolean => {
  if (!staffRoleType || !shiftRequiredRole) return false;
  const eligibleRoles = ROLE_ELIGIBILITY[shiftRequiredRole];
  if (!eligibleRoles) return false;
  return eligibleRoles.includes(staffRoleType);
};

/**
 * Auto-schedule mode options with labels and descriptions.
 */
export const AUTO_SCHEDULE_MODES = [
  {
    value: "favorites_only" as const,
    label: "Favorites Only",
    description:
      "Only auto-assign from favorites. Remaining open slots stay visible to all eligible staff, but no additional auto-assignment occurs.",
  },
  {
    value: "favorites_first" as const,
    label: "Favorites First",
    description:
      "Favorites get a head start window (configurable). After the window expires, slots open to all eligible staff.",
  },
  {
    value: "open_to_all" as const,
    label: "Open to All",
    description:
      "No auto-assignment. Shifts are immediately visible to all eligible staff.",
  },
] as const;

export type AutoScheduleMode = "favorites_only" | "favorites_first" | "open_to_all";

/**
 * Default head start minutes for favorites_first mode.
 */
export const DEFAULT_FAVORITES_HEAD_START_MINUTES = 120;

/**
 * Available head start options for the settings UI.
 */
export const HEAD_START_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
  { value: 1440, label: "24 hours" },
] as const;

/**
 * Determines whether auto-schedule should run for a given facility manager profile.
 */
export const shouldAutoSchedule = (
  managerProfile: IFacilityManagerProfilesEntity | null | undefined
): boolean => {
  if (!managerProfile) return false;
  if (!managerProfile.autoScheduleEnabled) return false;
  if (managerProfile.autoScheduleMode === "open_to_all") return false;
  return true;
};

/**
 * Filters facility favorites to only those whose staff role is eligible
 * for the given shift required role. Returns favorites sorted by priority
 * (preferred first, then regular).
 */
export const getEligibleFavorites = (
  favorites: IFacilityFavoritesEntity[],
  staffProfiles: IStaffProfilesEntity[],
  shiftRequiredRole: string
): Array<IFacilityFavoritesEntity & { staffProfile: IStaffProfilesEntity }> => {
  // Build a lookup map for staff profiles by ID
  const staffById = new Map<string, IStaffProfilesEntity>();
  for (const sp of staffProfiles) {
    if ((sp as { id?: string }).id) {
      staffById.set((sp as { id?: string }).id!, sp);
    }
  }

  const eligible: Array<
    IFacilityFavoritesEntity & { staffProfile: IStaffProfilesEntity }
  > = [];

  for (const fav of favorites) {
    if (!fav.staffProfileId) continue;
    const staff = staffById.get(fav.staffProfileId);
    if (!staff) continue;

    // Check role eligibility
    if (!isStaffEligibleForRole(staff.roleType, shiftRequiredRole)) continue;

    // Check compliance and onboarding
    if (staff.complianceStatus !== "compliant") continue;
    if (staff.onboardingStatus !== "approved") continue;

    eligible.push({ ...fav, staffProfile: staff });
  }

  // Sort by priority: preferred first, then regular
  eligible.sort((a, b) => {
    if (a.priority === "preferred" && b.priority !== "preferred") return -1;
    if (a.priority !== "preferred" && b.priority === "preferred") return 1;
    return 0;
  });

  return eligible;
};

/**
 * Builds the input payload for the AutoAssignFavoritesToShiftAction.
 */
export const buildAutoAssignInput = (
  shiftId: string,
  facilityId: string,
  requiredRole: "RN" | "LPN" | "CCA" | "CITR",
  headcount: number,
  startDateTime: string,
  endDateTime: string
) => ({
  shiftId,
  facilityId,
  requiredRole,
  headcount,
  startDateTime,
  endDateTime,
});

/**
 * Result summary for auto-schedule operations.
 */
export interface AutoScheduleResult {
  /** Whether auto-schedule was attempted */
  attempted: boolean;
  /** Number of favorites auto-assigned */
  assignedCount: number;
  /** Total slots for the shift */
  totalSlots: number;
  /** Number of remaining open slots */
  remainingSlots: number;
  /** Emails of auto-assigned staff */
  assignedStaffEmails: string[];
  /** Reason if not attempted */
  skipReason?: string;
}

/**
 * Creates a result for when auto-schedule is skipped.
 */
export const createSkippedResult = (reason: string): AutoScheduleResult => ({
  attempted: false,
  assignedCount: 0,
  totalSlots: 0,
  remainingSlots: 0,
  assignedStaffEmails: [],
  skipReason: reason,
});

/**
 * Creates a result from the AutoAssignFavoritesToShift action output.
 */
export const createAutoScheduleResult = (
  actionOutput: {
    assignedCount: number;
    remainingSlots: number;
    assignedStaffEmails: string[];
  },
  headcount: number
): AutoScheduleResult => ({
  attempted: true,
  assignedCount: actionOutput.assignedCount,
  totalSlots: headcount,
  remainingSlots: actionOutput.remainingSlots,
  assignedStaffEmails: actionOutput.assignedStaffEmails,
});

/**
 * Formats a human-readable summary of the auto-schedule result.
 * e.g. "Auto-assigned (2 of 3 slots filled from favorites)"
 */
export const formatAutoScheduleSummary = (result: AutoScheduleResult): string => {
  if (!result.attempted) {
    return result.skipReason || "Auto-schedule not applied";
  }

  if (result.assignedCount === 0) {
    return "No eligible favorites found for auto-assignment";
  }

  const slotsText =
    result.assignedCount === result.totalSlots
      ? "all slots"
      : `${result.assignedCount} of ${result.totalSlots} slots`;

  return `Auto-assigned (${slotsText} filled from favorites)`;
};

/**
 * Determines what happens to remaining slots based on auto-schedule mode.
 */
export const getRemainingSlotsBehavior = (
  mode: AutoScheduleMode,
  remainingSlots: number,
  headStartMinutes: number
): string => {
  if (remainingSlots === 0) {
    return "All slots have been filled by favorites";
  }

  switch (mode) {
    case "favorites_only":
      return `${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} open to all eligible staff`;
    case "favorites_first":
      return `${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} will open to all staff after ${formatHeadStartDuration(headStartMinutes)}`;
    case "open_to_all":
      return `${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} open to all eligible staff`;
    default:
      return "";
  }
};

/**
 * Formats head start duration into a human-readable string.
 */
export const formatHeadStartDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Builds notification data for auto-assigned staff members.
 */
export const buildAutoAssignNotification = (
  recipientEmail: string,
  shiftStartDateTime: string,
  shiftEndDateTime: string,
  facilityName?: string
) => ({
  recipientEmail,
  notificationType: "shift_reminder" as const,
  title: "Auto-Assigned to Shift",
  body: `You've been automatically assigned to a shift${facilityName ? ` at ${facilityName}` : ""} from ${shiftStartDateTime} to ${shiftEndDateTime}. You are listed as a facility favorite.`,
  linkUrl: "/staff-my-shifts",
  relatedEntityType: "shift",
});

/**
 * Determines if a shift was partially or fully auto-filled.
 */
export const getAutoFillStatus = (
  assignedCount: number,
  headcount: number
): "none" | "partial" | "full" => {
  if (assignedCount === 0) return "none";
  if (assignedCount >= headcount) return "full";
  return "partial";
};