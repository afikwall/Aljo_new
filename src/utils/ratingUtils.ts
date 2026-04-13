import { format, parseISO } from "date-fns";

/**
 * Format a rating to 1 decimal place
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * Get the color class for a rating-based left border accent
 * Green for 4-5, yellow for 3, red for 1-2
 */
export const getRatingBorderColor = (rating: number): string => {
  if (rating >= 4) return "border-l-accent";
  if (rating >= 3) return "border-l-chart-3";
  return "border-l-destructive";
};

/**
 * Format the ratedAt date for display
 */
export const formatRatingDate = (ratedAt?: string): string => {
  if (!ratedAt) return "Unknown date";
  try {
    return format(parseISO(ratedAt), "MMM d, yyyy");
  } catch {
    return "Unknown date";
  }
};

/**
 * Get sub-score label
 */
export const getSubScoreLabel = (key: string): string => {
  const labels: Record<string, string> = {
    reliabilityScore: "Reliability",
    professionalism: "Professionalism",
    clinicalSkills: "Clinical",
  };
  return labels[key] || key;
};

/**
 * Priority badge config
 */
export const getPriorityConfig = (priority?: string) => {
  if (priority === "preferred") {
    return {
      label: "Preferred",
      className: "bg-chart-3/20 text-chart-3",
    };
  }
  return {
    label: "Regular",
    className: "bg-chart-1/20 text-chart-1",
  };
};