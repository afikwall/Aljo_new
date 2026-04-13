import { useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Clock,
  CalendarDays,
  Users,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Sparkles,
  FileText,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import {
  formatShiftDateTime,
  getStatusBadgeColor,
  getRoleBadgeColor,
  formatStatusLabel,
  getShiftDurationHours,
} from "@/utils/shiftUtils";
import { getStaffDisplayName } from "@/utils/shiftApplicationUtils";
import type { IFacilitiesEntity, IStaffProfilesEntity } from "@/product-types";

interface ShiftInstance {
  id: string;
  status?: string;
  facilityProfileId?: string;
  requiredRole?: string;
  startDateTime?: string;
  endDateTime?: string;
  headcount?: number;
  filledCount?: number;
  assignedStaffId?: string;
  isShortNotice?: boolean;
  isHoliday?: boolean;
  requiresOrientation?: boolean;
  notes?: string;
  shiftStaffRate?: number;
}

interface AdminShiftCardProps {
  shift: ShiftInstance;
  facility?: IFacilitiesEntity & { id: string };
  assignedStaff?: (IStaffProfilesEntity & { id: string }) | null;
  onAssignStaff: (shift: ShiftInstance) => void;
  onUnassignStaff: (shift: ShiftInstance, staffName: string) => void;
}

export const AdminShiftCard = ({
  shift,
  facility,
  assignedStaff,
  onAssignStaff,
  onUnassignStaff,
}: AdminShiftCardProps) => {
  const duration = useMemo(
    () => getShiftDurationHours(shift.startDateTime, shift.endDateTime),
    [shift.startDateTime, shift.endDateTime]
  );

  const dateTimeDisplay = useMemo(
    () => formatShiftDateTime(shift.startDateTime, shift.endDateTime),
    [shift.startDateTime, shift.endDateTime]
  );

  const staffName = useMemo(() => {
    if (!assignedStaff) return "";
    return getStaffDisplayName(
      assignedStaff.firstName,
      assignedStaff.lastName,
      assignedStaff.email
    );
  }, [assignedStaff]);

  const handleAssign = useCallback(() => {
    onAssignStaff(shift);
  }, [onAssignStaff, shift]);

  const handleUnassign = useCallback(() => {
    onUnassignStaff(shift, staffName);
  }, [onUnassignStaff, shift, staffName]);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        {/* Header: Facility + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">
              {facility?.name || "Unknown Facility"}
            </h3>
            {facility?.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{facility.city}{facility.province ? `, ${facility.province}` : ""}</span>
              </p>
            )}
          </div>
          <Badge className={cn("shrink-0 text-xs", getStatusBadgeColor(shift.status))}>
            {formatStatusLabel(shift.status)}
          </Badge>
        </div>

        {/* Date / Time / Duration */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{dateTimeDisplay}</span>
          {duration > 0 && (
            <span className="text-muted-foreground">({duration}h)</span>
          )}
        </div>

        {/* Role + Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cn("text-xs", getRoleBadgeColor(shift.requiredRole))}>
            {shift.requiredRole || "—"}
          </Badge>
          {shift.isShortNotice && (
            <Badge variant="outline" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              Short Notice
            </Badge>
          )}
          {shift.isHoliday && (
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Holiday
            </Badge>
          )}
          {shift.requiresOrientation ? (
            <Badge className="text-xs bg-chart-3/20 text-chart-3">
              <GraduationCap className="h-3 w-3 mr-1" />
              Orientation Required
            </Badge>
          ) : (
            <Badge className="text-xs bg-accent/20 text-accent">
              <CheckCircle className="h-3 w-3 mr-1" />
              No Orientation
            </Badge>
          )}
        </div>

        {/* Headcount + Rate */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{shift.filledCount ?? 0}/{shift.headcount ?? 1} filled</span>
          </div>
          {shift.shiftStaffRate != null && shift.shiftStaffRate > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>${shift.shiftStaffRate}/hr</span>
            </div>
          )}
        </div>

        {/* Notes Snippet */}
        {shift.notes && (
          <p className="text-xs text-muted-foreground flex items-start gap-1 line-clamp-2">
            <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{shift.notes}</span>
          </p>
        )}

        {/* Assigned Staff Display */}
        {shift.status === "assigned" && assignedStaff && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {assignedStaff.firstName?.charAt(0)?.toUpperCase() || ""}
              {assignedStaff.lastName?.charAt(0)?.toUpperCase() || ""}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{staffName}</p>
              <Badge className={cn("text-xs mt-0.5", getRoleBadgeColor(assignedStaff.roleType))}>
                {assignedStaff.roleType}
              </Badge>
            </div>
          </div>
        )}

        {/* Actions */}
        {shift.status === "open" && (
          <Button
            onClick={handleAssign}
            className="w-full md:w-auto h-11"
            size="default"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Staff
          </Button>
        )}

        {shift.status === "assigned" && (
          <Button
            variant="outline"
            onClick={handleUnassign}
            className="w-full md:w-auto h-11 text-destructive hover:text-destructive"
            size="default"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Unassign
          </Button>
        )}
      </CardContent>
    </Card>
  );
};