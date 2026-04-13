import { format, parseISO } from "date-fns";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShiftsEntity, TimeLogsEntity } from "@/product-types";

interface PayPeriodShiftCardProps {
  shift: typeof ShiftsEntity["instanceType"];
  facilityName?: string;
  timeLog?: typeof TimeLogsEntity["instanceType"];
  roleBadgeColor: string;
}

export const PayPeriodShiftCard = ({
  shift,
  facilityName,
  timeLog,
  roleBadgeColor,
}: PayPeriodShiftCardProps) => {
  const isCompleted = shift.status === "completed";

  const formattedDate = shift.startDateTime
    ? (() => {
        try {
          return format(parseISO(shift.startDateTime), "EEE, MMM d");
        } catch {
          return "";
        }
      })()
    : "";

  const timeRange =
    shift.startDateTime && shift.endDateTime
      ? (() => {
          try {
            const s = format(parseISO(shift.startDateTime), "h:mm a");
            const e = format(parseISO(shift.endDateTime), "h:mm a");
            return `${s} – ${e}`;
          } catch {
            return "";
          }
        })()
      : "";

  const netHours = timeLog?.totalHours ?? null;

  const statusBadgeClass = (() => {
    switch (shift.status) {
      case "completed":
        return "bg-chart-2/20 text-chart-2";
      case "in_progress":
        return "bg-chart-3/20 text-chart-3";
      case "claimed":
        return "bg-chart-1/20 text-chart-1";
      case "assigned":
        return "bg-chart-4/20 text-chart-4";
      default:
        return "bg-muted text-muted-foreground";
    }
  })();

  const statusLabel = (() => {
    switch (shift.status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "claimed":
        return "Claimed";
      case "assigned":
        return "Assigned";
      default:
        return shift.status || "Unknown";
    }
  })();

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              {isCompleted && (
                <CheckCircle className="h-4 w-4 shrink-0 text-chart-2" />
              )}
              <span className="font-semibold text-sm truncate">
                {facilityName || "Unknown Facility"}
              </span>
            </div>
            {formattedDate && (
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            )}
            {timeRange && (
              <span className="text-xs text-muted-foreground">{timeRange}</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {shift.requiredRole && (
              <Badge className={cn("text-xs", roleBadgeColor)}>
                {shift.requiredRole}
              </Badge>
            )}
            <Badge className={cn("text-xs", statusBadgeClass)}>
              {statusLabel}
            </Badge>
            {netHours !== null && (
              <Badge variant="secondary" className="text-xs">
                {netHours.toFixed(1)} hrs
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};