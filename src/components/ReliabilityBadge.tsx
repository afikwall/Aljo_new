import { useMemo } from "react";
import { Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReliabilityBadge } from "@/utils/reliabilityUtils";

interface ReliabilityBadgeProps {
  totalShiftsCompleted: number;
  size?: "sm" | "md" | "lg";
}

export const ReliabilityBadge = ({
  totalShiftsCompleted,
  size = "md",
}: ReliabilityBadgeProps) => {
  const badgeInfo = useMemo(
    () => getReliabilityBadge(totalShiftsCompleted),
    [totalShiftsCompleted]
  );

  const sizeClasses = useMemo(() => {
    switch (size) {
      case "sm":
        return {
          container: "text-xs px-2 py-0.5 rounded-full gap-1",
          icon: "h-3 w-3",
        };
      case "lg":
        return {
          container: "text-base px-4 py-2 rounded-full gap-2 font-semibold",
          icon: "h-5 w-5",
        };
      default:
        return {
          container: "text-sm px-2.5 py-1 rounded-full gap-1.5",
          icon: "h-3.5 w-3.5",
        };
    }
  }, [size]);

  const IconComponent =
    badgeInfo.iconVariant === "shieldCheck" ? ShieldCheck : Shield;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap",
        badgeInfo.className,
        sizeClasses.container
      )}
    >
      <IconComponent className={sizeClasses.icon} />
      <span>
        {badgeInfo.tier} · {totalShiftsCompleted} shift
        {totalShiftsCompleted !== 1 ? "s" : ""}
      </span>
    </span>
  );
};