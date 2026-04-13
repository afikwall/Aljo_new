import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatFMCountText } from "@/utils/fmUtils";

interface FMCountBadgeProps {
  count: number;
  className?: string;
}

export const FMCountBadge = ({ count, className }: FMCountBadgeProps) => {
  const text = useMemo(() => formatFMCountText(count), [count]);

  return (
    <span
      className={cn(
        "rounded-full text-xs px-2 py-0.5 font-medium",
        count > 0
          ? "bg-accent/20 text-accent"
          : "bg-chart-3/20 text-chart-3",
        className
      )}
    >
      {text}
    </span>
  );
};