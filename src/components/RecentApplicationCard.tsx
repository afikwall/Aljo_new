import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLE_BADGE_COLORS,
  STATUS_BADGE_COLORS,
  formatShiftDateTime,
  getRelativeTime,
  getStaffDisplayName,
  getStaffInitials,
} from "@/utils/shiftApplicationUtils";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import type { IShiftsEntity, IStaffProfilesEntity, IFacilitiesEntity } from "@/product-types";

interface RecentApplicationCardProps {
  shift: (IShiftsEntity & { id: string }) | null;
  staff: (IStaffProfilesEntity & { id: string }) | null;
  facility: (IFacilitiesEntity & { id: string }) | null;
  status?: string;
  respondedAt?: string;
  onShiftClick?: () => void;
  onStaffClick?: () => void;
}

export const RecentApplicationCard = ({
  shift,
  staff,
  facility,
  status,
  respondedAt,
  onShiftClick,
  onStaffClick,
}: RecentApplicationCardProps) => {
  const staffName = getStaffDisplayName(staff?.firstName, staff?.lastName, staff?.email);
  const initials = getStaffInitials(staff?.firstName, staff?.lastName);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Shift info — clickable */}
          <div
            className="flex-1 space-y-1 hover:bg-muted/50 cursor-pointer rounded-lg p-2 -m-2 transition-colors"
            onClick={onShiftClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onShiftClick?.();
              }
            }}
          >
            <div className="flex items-center gap-2">
              <p className="font-semibold">{facility?.name || "Unknown Facility"}</p>
              {facility?.city && (
                <span className="text-sm text-muted-foreground">• {facility.city}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{formatShiftDateTime(shift?.startDateTime, shift?.endDateTime)}</span>
            </div>
            {shift?.requiredRole && (
              <Badge
                className={cn(
                  "rounded-full text-xs px-2 py-0.5",
                  ROLE_BADGE_COLORS[shift.requiredRole] || "bg-muted text-muted-foreground"
                )}
              >
                {shift.requiredRole}
              </Badge>
            )}
          </div>

          {/* Staff info — clickable */}
          <div
            className="flex items-center gap-3 flex-shrink-0 hover:bg-muted/50 cursor-pointer rounded-lg p-2 -m-2 transition-colors"
            onClick={onStaffClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onStaffClick?.();
              }
            }}
          >
            {staff?.profilePhotoUrl ? (
              <img
                src={staff.profilePhotoUrl}
                alt={staffName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{staffName}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {staff?.roleType && (
                  <Badge
                    className={cn(
                      "rounded-full text-xs px-2 py-0.5",
                      ROLE_BADGE_COLORS[staff.roleType] || "bg-muted text-muted-foreground"
                    )}
                  >
                    {staff.roleType}
                  </Badge>
                )}
                <ReliabilityBadge totalShiftsCompleted={staff?.totalRatings || 0} size="sm" />
              </div>
            </div>
          </div>

          {/* Status + responded time — not clickable */}
          <div className="flex items-center gap-3 flex-shrink-0 md:flex-col md:items-end">
            <Badge
              className={cn(
                "rounded-full text-xs px-3 py-1",
                STATUS_BADGE_COLORS[status || ""] || "bg-muted text-muted-foreground"
              )}
            >
              {status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : status}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Responded {getRelativeTime(respondedAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};