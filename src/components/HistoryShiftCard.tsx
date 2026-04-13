import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, XCircle, X, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { IShiftsEntity } from "@/product-types";
import type { IShiftApplicationsEntity } from "@/product-types";
import type { IFacilitiesEntity } from "@/product-types";
import type { ITimeLogsEntity } from "@/product-types";

type HistoryStatus = "completed" | "rejected" | "withdrawn" | "withdrawal_pending" | "expired";

interface HistoryShiftCardProps {
  shift: IShiftsEntity & { id?: string };
  application: IShiftApplicationsEntity & { id?: string };
  facility: (IFacilitiesEntity & { id?: string }) | null;
  timeLog?: (ITimeLogsEntity & { id?: string }) | null;
  historyStatus: HistoryStatus;
  roleBadgeColor: string;
}

const STATUS_CONFIG: Record<HistoryStatus, { label: string; className: string; icon: React.ElementType }> = {
  completed: { label: "Completed", className: "bg-accent/20 text-accent", icon: CheckCircle },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive", icon: XCircle },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground", icon: X },
  withdrawal_pending: { label: "Withdrawal Pending", className: "bg-chart-3/20 text-chart-3", icon: Clock },
  expired: { label: "Missed / Expired", className: "bg-chart-3/20 text-chart-3", icon: AlertCircle },
};

export const HistoryShiftCard = ({
  shift,
  application,
  facility,
  timeLog,
  historyStatus,
  roleBadgeColor,
}: HistoryShiftCardProps) => {
  const statusConfig = STATUS_CONFIG[historyStatus];
  const StatusIcon = statusConfig.icon;

  const grossHours = timeLog?.totalHours
    ? (timeLog.totalHours + (timeLog.breakMinutes || 0) / 60).toFixed(1)
    : null;
  const breakMinutes = timeLog?.breakMinutes || 0;
  const netHours = timeLog?.totalHours?.toFixed(1) || null;

  return (
    <Card className="border">
      <CardContent className="p-4 space-y-3">
        {/* Header with facility name and status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-base font-bold leading-tight truncate">
              {facility?.name || "Unknown Facility"}
            </h3>
            {facility?.city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{facility.city}</span>
              </div>
            )}
          </div>
          <Badge className={`shrink-0 ${statusConfig.className}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Date & Time */}
        {shift.startDateTime && shift.endDateTime && (
          <p className="text-sm font-medium">
            {format(parseISO(shift.startDateTime), "EEE, MMM d")} •{" "}
            {format(parseISO(shift.startDateTime), "h:mm a")} -{" "}
            {format(parseISO(shift.endDateTime), "h:mm a")}
          </p>
        )}

        {/* Role badge */}
        {shift.requiredRole && (
          <Badge className={roleBadgeColor}>{shift.requiredRole}</Badge>
        )}

        {/* Hours grid for completed shifts */}
        {historyStatus === "completed" && grossHours && netHours && (
          <div className="grid grid-cols-3 gap-3 rounded-lg border p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Gross Hours</p>
              <p className="text-lg font-bold">{grossHours}h</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Break</p>
              <p className="text-lg font-bold">{breakMinutes}min</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Net Hours</p>
              <p className="text-lg font-bold text-accent">{netHours}h</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};