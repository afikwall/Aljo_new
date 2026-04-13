import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { format, parseISO } from "date-fns";
import { CheckCircle, Loader2 } from "lucide-react";
import type { IOrientationsEntity, IStaffProfilesEntity } from "@/product-types";

interface OrientationMobileCardProps {
  orientation: IOrientationsEntity & { id: string };
  staff?: (IStaffProfilesEntity & { id: string }) | null;
  onClick?: () => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
}

const getOrientationStatusStyle = (status?: string): string => {
  switch (status) {
    case "completed":
      return "bg-accent/20 text-accent";
    case "scheduled":
      return "bg-chart-1/20 text-chart-1";
    case "expired":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStaffInitials = (staff?: IStaffProfilesEntity | null): string => {
  if (!staff) return "?";
  if (staff.firstName && staff.lastName) {
    return `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
  }
  if (staff.email) return staff.email[0].toUpperCase();
  return "?";
};

const getStaffDisplayName = (staff?: IStaffProfilesEntity | null): string => {
  if (!staff) return "Unknown Staff";
  if (staff.firstName && staff.lastName) {
    return `${staff.firstName} ${staff.lastName}`;
  }
  return staff.email || "Unknown Staff";
};

const formatOrientationDate = (dateStr?: string): string => {
  if (!dateStr) return "\u2014";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return "\u2014";
  }
};

const formatStatusLabel = (status?: string): string => {
  switch (status) {
    case "completed":
      return "Completed";
    case "scheduled":
      return "Scheduled";
    case "expired":
      return "Expired";
    default:
      return status || "Unknown";
  }
};

export const OrientationMobileCard = ({
  orientation,
  staff,
  onClick,
  onMarkComplete,
  isMarkingComplete,
}: OrientationMobileCardProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        onClick ? "cursor-pointer hover:bg-accent/40" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-xs">
            {getStaffInitials(staff)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium leading-tight truncate">
            {getStaffDisplayName(staff)}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {staff?.roleType && (
              <Badge
                className={cn(
                  "rounded-full text-[10px] px-1.5 py-0",
                  getRoleBadgeColor(staff.roleType)
                )}
              >
                {staff.roleType}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatOrientationDate(orientation.completedAt)}
            </span>
          </div>
          {orientation.orientedBy && (
            <p className="text-xs text-muted-foreground truncate">
              By: {orientation.orientedBy}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Badge
          className={cn(
            "rounded-full text-[10px]",
            getOrientationStatusStyle(orientation.status)
          )}
        >
          {formatStatusLabel(orientation.status)}
        </Badge>
        {onMarkComplete && (
          <Button
            size="sm"
            disabled={isMarkingComplete}
            onClick={(e) => {
              e.stopPropagation();
              onMarkComplete();
            }}
            className="h-8 text-xs px-2"
          >
            {isMarkingComplete ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            {isMarkingComplete ? "Completing..." : "Mark Complete"}
          </Button>
        )}
      </div>
    </div>
  );
};