import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CalendarPlus, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { IOrientationsEntity, IStaffProfilesEntity } from "@/product-types";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface OrientationRequestCardProps {
  orientation: IOrientationsEntity & { id: string };
  staff: (IStaffProfilesEntity & { id: string }) | null | undefined;
  onSchedule: (orientation: IOrientationsEntity & { id: string }) => void;
  onDeny: (orientation: IOrientationsEntity & { id: string }) => void;
}

export const OrientationRequestCard = ({
  orientation,
  staff,
  onSchedule,
  onDeny,
}: OrientationRequestCardProps) => {
  const staffName =
    staff?.firstName && staff?.lastName
      ? `${staff.firstName} ${staff.lastName}`
      : staff?.email || "Unknown Staff";

  const initials =
    staff?.firstName && staff?.lastName
      ? `${staff.firstName[0]}${staff.lastName[0]}`
      : staff?.email
        ? staff.email[0].toUpperCase()
        : "?";

  const formattedRequestedAt = orientation.requestedAt
    ? (() => {
        try {
          return format(parseISO(orientation.requestedAt), "MMM d, h:mm a");
        } catch {
          return "";
        }
      })()
    : "";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-shadow">
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        {staff?.profilePhotoUrl && (
          <AvatarImage src={staff.profilePhotoUrl} alt={staffName} />
        )}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{staffName}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {staff?.roleType && (
            <Badge className={getRoleBadgeColor(staff.roleType)}>
              {staff.roleType}
            </Badge>
          )}
          {formattedRequestedAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formattedRequestedAt}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onSchedule(orientation);
          }}
        >
          <CalendarPlus className="h-4 w-4 mr-1.5" />
          Schedule
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-sm text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDeny(orientation);
          }}
        >
          <XCircle className="h-4 w-4 mr-1.5" />
          Deny
        </Button>
      </div>
    </div>
  );
};