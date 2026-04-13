import { format, parseISO } from "date-fns";
import { formatElapsedTime } from "@/utils/clockInOutUtils";

interface LiveShiftTimerProps {
  clockInTime: string;
  currentTime: Date;
}

export const LiveShiftTimer = ({ clockInTime, currentTime }: LiveShiftTimerProps) => {
  const elapsed = formatElapsedTime(clockInTime, currentTime);

  const startTimeFormatted = (() => {
    try {
      return format(parseISO(clockInTime), "h:mm a");
    } catch {
      return "";
    }
  })();

  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-accent animate-pulse" />
        <span className="font-mono text-5xl font-bold text-accent tracking-tight">
          {elapsed}
        </span>
      </div>
      {startTimeFormatted && (
        <p className="text-sm text-muted-foreground">
          Started at {startTimeFormatted}
        </p>
      )}
    </div>
  );
};