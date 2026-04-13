import type { IOrientationsEntity } from "@/product-types";

/**
 * Checks if a staff member has a pending (requested or scheduled) orientation
 * at a specific facility.
 *
 * @param orientations - All orientation records for the staff member
 * @param facilityId - The facility to check
 * @returns The existing pending orientation record, or null
 */
export const findPendingOrientation = (
  orientations: IOrientationsEntity[],
  facilityId: string
): (IOrientationsEntity & { id: string }) | null => {
  if (!orientations || !facilityId) return null;

  const pending = orientations.find(
    (o) =>
      o.facilityId === facilityId &&
      (o.status === "requested" || o.status === "scheduled")
  );

  return pending ? (pending as IOrientationsEntity & { id: string }) : null;
};

/**
 * Checks if a staff member has a denied orientation at a specific facility
 * (most recent record).
 *
 * @param orientations - All orientation records for the staff member
 * @param facilityId - The facility to check
 * @returns The denied orientation record, or null
 */
export const findDeniedOrientation = (
  orientations: IOrientationsEntity[],
  facilityId: string
): (IOrientationsEntity & { id: string }) | null => {
  if (!orientations || !facilityId) return null;

  const denied = orientations.find(
    (o) => o.facilityId === facilityId && o.status === "denied"
  );

  return denied ? (denied as IOrientationsEntity & { id: string }) : null;
};

/**
 * Gets the orientation request status for display on shift cards.
 *
 * @param orientations - All orientation records for the staff member
 * @param facilityId - The facility to check
 * @returns "requested" | "scheduled" | "none"
 */
export const getOrientationRequestStatus = (
  orientations: IOrientationsEntity[],
  facilityId: string
): "requested" | "scheduled" | "none" => {
  if (!orientations || !facilityId) return "none";

  const pending = findPendingOrientation(orientations, facilityId);
  if (!pending) return "none";

  return pending.status as "requested" | "scheduled";
};

/**
 * Checks whether a given shift is an orientation shift by comparing its ID
 * against orientation records that reference it.
 *
 * @param shiftId - The shift ID to check
 * @param orientations - All orientation records to search through
 * @returns The matching orientation record, or null
 */
export const findOrientationForShift = (
  shiftId: string,
  orientations: IOrientationsEntity[]
): (IOrientationsEntity & { id: string }) | null => {
  if (!shiftId || !orientations) return null;

  const match = orientations.find(
    (o) => o.orientationShiftId === shiftId && o.status === "scheduled"
  );

  return match ? (match as IOrientationsEntity & { id: string }) : null;
};

/**
 * Formats a message about an existing pending orientation request.
 *
 * @param orientation - The existing orientation record
 * @returns A user-friendly message string
 */
export const getPendingOrientationMessage = (
  orientation: IOrientationsEntity
): string => {
  if (orientation.status === "scheduled") {
    return "Your orientation at this facility is already scheduled. Check your notifications for details.";
  }
  return "You have already requested an orientation at this facility. The facility manager will review your request.";
};