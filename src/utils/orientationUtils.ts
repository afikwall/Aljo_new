import type { IOrientationsEntity, IShiftsEntity } from "@/product-types";

export type OrientationStatus =
  | "required_and_oriented"
  | "required_not_oriented"
  | "not_required";

/**
 * Determines the orientation status for a shift given a set of facility IDs
 * where the staff member has completed orientations.
 */
export const getOrientationStatus = (
  shift: IShiftsEntity,
  orientedFacilitySet: Set<string>
): OrientationStatus => {
  const shiftRequiresOrientation = shift.requiresOrientation === true;
  if (!shiftRequiresOrientation) return "not_required";

  const staffIsOriented = orientedFacilitySet.has(shift.facilityProfileId || "");
  return staffIsOriented ? "required_and_oriented" : "required_not_oriented";
};

/**
 * Checks whether a staff member has completed orientation for a shift that requires it.
 *
 * @param shift - The shift to check orientation requirements for
 * @param orientations - All orientation records for this staff member at this facility
 * @returns An object with `passed` (boolean) and optional `reason` (string) if check fails
 */
export const checkOrientationEligibility = (
  shift: IShiftsEntity,
  orientations: IOrientationsEntity[]
): { passed: boolean; reason?: string } => {
  // If requiresOrientation is false or null/undefined, skip this check entirely
  if (!shift.requiresOrientation) {
    return { passed: true };
  }

  // requiresOrientation is true — look for a completed orientation record
  const hasCompletedOrientation = orientations.some(
    (record) => record.status === "completed"
  );

  if (!hasCompletedOrientation) {
    return {
      passed: false,
      reason:
        "This shift requires facility orientation. Please contact your facility manager to schedule an orientation.",
    };
  }

  // Completed orientation record exists — staff is oriented
  return { passed: true };
};