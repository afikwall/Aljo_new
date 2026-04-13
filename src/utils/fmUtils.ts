/**
 * Utility functions for facility manager operations
 */

/**
 * Extract initials from email or name for avatar display
 */
export const getInitials = (email?: string, name?: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    return local.substring(0, 2).toUpperCase();
  }
  return "FM";
};

/**
 * Get FM count for a specific facility from all FM profiles
 */
export const getFMCountForFacility = (
  allFMProfiles: Array<{ facilityProfileId?: string }>,
  facilityId: string
): number => {
  return allFMProfiles.filter((p) => p.facilityProfileId === facilityId).length;
};

/**
 * Format FM count text for badge display
 */
export const formatFMCountText = (count: number): string => {
  if (count === 0) return "No FMs";
  if (count === 1) return "1 FM";
  return `${count} FMs`;
};