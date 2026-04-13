import { cn } from "@/lib/utils";
import { abbreviateFacilityName, formatShiftTime } from "@/utils/calendarUtils";

export type ShiftPillVariant = "pending" | "upcoming" | "completed";

interface ShiftPillProps {
  facilityName: string;
  startDateTime?: string;
  variant: ShiftPillVariant;
  className?: string;
}

export const ShiftPill = ({
  facilityName,
  startDateTime,
  variant,
  className,
}: ShiftPillProps) => {
  const abbreviated = abbreviateFacilityName(facilityName);
  const time = startDateTime ? formatShiftTime(startDateTime) : "";

  const label =
    variant === "completed"
      ? abbreviated
      : `${abbreviated}${time ? ` ${time}` : ""}`;

  return (
    <div
      className={cn(
        "text-xs rounded-full px-1.5 py-0.5 truncate max-w-full leading-tight",
        variant === "pending" && "bg-chart-1/20 text-chart-1",
        variant === "upcoming" && "bg-accent/20 text-accent",
        variant === "completed" && "bg-muted text-muted-foreground",
        className
      )}
      title={label}
    >
      {label}
    </div>
  );
};