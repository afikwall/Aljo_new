/**
 * Role eligibility matrix for shift assignment.
 * Defines which shift required roles each staff roleType can fill.
 * Higher-qualified staff can fill lower-level positions.
 *
 * Key = staff's roleType
 * Value = array of shift requiredRole values this staff can fill
 */
export const ELIGIBILITY_MATRIX: Record<string, string[]> = {
  RN: ["RN", "LPN", "CCA", "CITR"],
  LPN: ["LPN", "CCA", "CITR"],
  CCA: ["CCA", "CITR"],
  CITR: ["CITR"],
};

/**
 * Returns the set of staff roleTypes that are eligible to fill
 * a shift with the given requiredRole.
 *
 * e.g. getEligibleRoleTypes("LPN") => ["RN", "LPN"]
 *      because RN can fill LPN shifts, and LPN can fill LPN shifts.
 */
export const getEligibleRoleTypes = (shiftRequiredRole: string): string[] => {
  const eligible: string[] = [];
  for (const [staffRole, canFillRoles] of Object.entries(ELIGIBILITY_MATRIX)) {
    if (canFillRoles.includes(shiftRequiredRole)) {
      eligible.push(staffRole);
    }
  }
  return eligible;
};

/**
 * Checks whether a staff member's roleType is eligible to work a shift
 * with the given requiredRole.
 */
export const isRoleEligible = (
  staffRoleType: string | undefined,
  shiftRequiredRole: string | undefined
): boolean => {
  if (!staffRoleType || !shiftRequiredRole) return false;
  const canFill = ELIGIBILITY_MATRIX[staffRoleType];
  if (!canFill) return false;
  return canFill.includes(shiftRequiredRole);
};