import type { IOrientationsEntity } from "@/product-types";

/**
 * Finds an orientation record that references a specific shift as its orientation shift.
 * Used during clock-out to determine if completing this shift should auto-complete
 * the orientation.
 *
 * @param shiftId - The shift being clocked out
 * @param orientations - All orientation records to search
 * @returns The matching scheduled orientation, or null
 */
export const findScheduledOrientationByShift = (
  shiftId: string,
  orientations: IOrientationsEntity[]
): (IOrientationsEntity & { id: string }) | null => {
  if (!shiftId || !orientations?.length) return null;

  const match = orientations.find(
    (o) => o.orientationShiftId === shiftId && o.status === "scheduled"
  );

  return match ? (match as IOrientationsEntity & { id: string }) : null;
};

/**
 * Checks if the completed shift is an orientation shift that should trigger
 * auto-completion of the orientation record. Returns the orientation ID
 * to update if applicable.
 *
 * @param shiftId - The shift that was just completed
 * @param allOrientations - All orientation records accessible
 * @returns Object with orientationId and staffProfileId if auto-complete should happen
 */
export const getOrientationToComplete = (
  shiftId: string,
  allOrientations: IOrientationsEntity[]
): { orientationId: string; staffProfileId: string; facilityId: string } | null => {
  const orientation = findScheduledOrientationByShift(shiftId, allOrientations);
  if (!orientation) return null;

  return {
    orientationId: orientation.id,
    staffProfileId: orientation.staffProfileId || "",
    facilityId: orientation.facilityId || "",
  };
};