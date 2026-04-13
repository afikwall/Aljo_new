export interface ReliabilityBadgeInfo {
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  className: string;
  iconVariant: "shield" | "shieldCheck";
}

export const getReliabilityBadge = (
  totalShiftsCompleted: number
): ReliabilityBadgeInfo => {
  if (totalShiftsCompleted > 100) {
    return {
      tier: "Platinum",
      className: "bg-purple-100 text-purple-700 border border-purple-200",
      iconVariant: "shieldCheck",
    };
  }
  if (totalShiftsCompleted >= 51) {
    return {
      tier: "Gold",
      className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      iconVariant: "shieldCheck",
    };
  }
  if (totalShiftsCompleted >= 11) {
    return {
      tier: "Silver",
      className: "bg-slate-100 text-slate-600 border border-slate-200",
      iconVariant: "shield",
    };
  }
  return {
    tier: "Bronze",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
    iconVariant: "shield",
  };
};

export const formatHoursWorked = (hours: number): string => {
  return `${hours.toFixed(1)} hrs`;
};

export const getReliabilityColor = (score: number): string => {
  if (score >= 80) return "bg-accent";
  if (score >= 50) return "bg-chart-3";
  return "bg-destructive";
};

export const getReliabilityTextColor = (score: number): string => {
  if (score >= 80) return "text-accent";
  if (score >= 50) return "text-chart-3";
  return "text-destructive";
};