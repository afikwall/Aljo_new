import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Zap, Users, FileText, Pencil, CalendarPlus, DollarSign, GraduationCap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatShiftDateTime,
  getShiftDurationHours,
  getStatusBadgeColor,
  getRoleBadgeColor,
  formatStatusLabel,
} from "@/utils/shiftUtils";
import { useCallback } from "react";

interface FacilityShiftCardProps {
  shiftId: string;
  facilityName: string;
  facilityCity?: string;
  startDateTime?: string;
  endDateTime?: string;
  requiredRole?: string;
  status?: string;
  isShortNotice?: boolean;
  requiresOrientation?: boolean;
  headcount?: number;
  filledCount?: number;
  notes?: string;
  shiftStaffRate?: number;
  onCardClick: (shiftId: string) => void;
  onEditClick: (shiftId: string) => void;
}

export const FacilityShiftCard = ({
  shiftId,
  facilityName,
  facilityCity,
  startDateTime,
  endDateTime,
  requiredRole,
  status,
  isShortNotice,
  requiresOrientation,
  headcount,
  filledCount,
  notes,
  shiftStaffRate,
  onCardClick,
  onEditClick,
}: FacilityShiftCardProps) => {
  const duration = getShiftDurationHours(startDateTime, endDateTime);
  const dateTimeStr = formatShiftDateTime(startDateTime, endDateTime);

  const handleCardClick = useCallback(() => {
    onCardClick(shiftId);
  }, [onCardClick, shiftId]);

  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEditClick(shiftId);
    },
    [onEditClick, shiftId]
  );

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-md border flex flex-col"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 flex flex-col flex-1 gap-3 relative">
        {/* Edit button top-right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleEditClick}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Facility name */}
        <div className="space-y-1 pr-8">
          <h3 className="text-base font-bold leading-tight">{facilityName}</h3>
          {facilityCity && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{facilityCity}</span>
            </div>
          )}
        </div>

        {/* Date & Time */}
        {dateTimeStr && (
          <p className="text-sm font-medium">{dateTimeStr}</p>
        )}

        {/* Duration */}
        {duration > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{duration} hours</span>
          </div>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {requiredRole && (
            <Badge className={cn("rounded-full", getRoleBadgeColor(requiredRole))}>
              {requiredRole}
            </Badge>
          )}
          {status && (
            <Badge className={cn("rounded-full", getStatusBadgeColor(status))}>
              {formatStatusLabel(status)}
            </Badge>
          )}
          {isShortNotice && (
            <Badge className="rounded-full bg-chart-3/20 text-chart-3">
              <Zap className="w-3 h-3 mr-1" />
              Short Notice
            </Badge>
          )}
          {requiresOrientation ? (
            <Badge className="rounded-full text-xs bg-chart-3/20 text-chart-3">
              <GraduationCap className="h-3 w-3 mr-1" />
              Orientation Required
            </Badge>
          ) : (
            <Badge className="rounded-full text-xs bg-accent/20 text-accent">
              <CheckCircle className="h-3 w-3 mr-1" />
              No Orientation
            </Badge>
          )}
          {shiftStaffRate != null && shiftStaffRate > 0 ? (
            <Badge className="rounded-full bg-accent/20 text-accent">
              <DollarSign className="h-3 w-3 mr-0.5" />
              ${shiftStaffRate.toFixed(0)}/hr staff
            </Badge>
          ) : (
            <Badge className="rounded-full bg-muted text-muted-foreground">
              <DollarSign className="h-3 w-3 mr-0.5" />
              Rate not set
            </Badge>
          )}
        </div>

        {/* Filled Slots Indicator - only show when headcount > 1 */}
        {headcount != null && headcount > 1 && (
          <div className="flex items-center gap-2">
            <Users className={cn(
              "w-3.5 h-3.5 shrink-0",
              (filledCount || 0) >= headcount ? "text-accent" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              (filledCount || 0) >= headcount ? "text-accent" : "text-muted-foreground"
            )}>
              {filledCount || 0}/{headcount} filled
            </span>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="flex items-start gap-1 text-sm text-muted-foreground">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{notes}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface EmptyShiftCardProps {
  onPostShift: () => void;
}

export const EmptyShiftCard = ({ onPostShift }: EmptyShiftCardProps) => {
  return (
    <div className="col-span-full border border-dashed rounded-lg min-h-[180px] flex flex-col items-center justify-center gap-3 p-6">
      <CalendarPlus className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground font-medium">No shifts yet</p>
      <Button onClick={onPostShift}>
        Post New Shift
      </Button>
    </div>
  );
};