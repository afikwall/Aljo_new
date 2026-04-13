import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  type BulkShiftPreviewItem,
  formatBulkShiftSummary,
  type DayOfWeekValue,
} from "@/utils/bulkShiftUtils";
import { format, parseISO } from "date-fns";

interface BulkShiftPreviewProps {
  previewItems: BulkShiftPreviewItem[];
  daysOfWeek: DayOfWeekValue[];
  requiredRole: string;
  startTime: string;
  endTime: string;
}

const formatTimeDisplay = (time: string): string => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const BulkShiftPreview = ({
  previewItems,
  daysOfWeek,
  requiredRole,
  startTime,
  endTime,
}: BulkShiftPreviewProps) => {
  const summary = useMemo(
    () => formatBulkShiftSummary(previewItems, daysOfWeek),
    [previewItems, daysOfWeek]
  );

  const timeRange = useMemo(
    () => `${formatTimeDisplay(startTime)} – ${formatTimeDisplay(endTime)}`,
    [startTime, endTime]
  );

  if (previewItems.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-chart-3/30 bg-chart-3/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-chart-3" />
        <p className="text-sm text-foreground">
          No shifts match the selected days in this date range. Try adjusting your
          date range or selected days of week.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-chart-1" />
        <p className="text-sm font-medium">{summary}</p>
      </div>

      {/* Shift list */}
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {previewItems.map((item) => {
          const dateObj = parseISO(item.date);
          const formattedDate = format(dateObj, "EEE, MMM d");

          return (
            <div
              key={item.date}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                "border-l-4 border-l-chart-1"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{formattedDate}</p>
                <p className="text-xs text-muted-foreground">{timeRange}</p>
              </div>
              <Badge className={cn("text-xs shrink-0", getRoleBadgeColor(requiredRole))}>
                {requiredRole}
              </Badge>
              {item.isWeekend && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Weekend
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};