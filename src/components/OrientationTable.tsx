import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { format, parseISO } from "date-fns";
import { CheckCircle, Loader2 } from "lucide-react";
import type { IOrientationsEntity, IStaffProfilesEntity } from "@/product-types";

interface OrientationTableProps {
  orientations: (IOrientationsEntity & { id: string })[];
  staffMap: Map<string, IStaffProfilesEntity & { id: string }>;
  onStaffClick?: (staffProfileId: string) => void;
  onMarkComplete?: (orientationId: string, staffProfileId: string) => void;
  completingOrientationId?: string | null;
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

export const OrientationTable = ({
  orientations,
  staffMap,
  onStaffClick,
  onMarkComplete,
  completingOrientationId,
}: OrientationTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[240px]">Staff Name</TableHead>
          <TableHead className="w-[100px]">Role</TableHead>
          <TableHead className="w-[140px]">Orientation Date</TableHead>
          <TableHead className="w-[110px]">Status</TableHead>
          <TableHead>Conducted By</TableHead>
          <TableHead className="w-[150px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orientations.map((orientation) => {
          const staff = orientation.staffProfileId
            ? staffMap.get(orientation.staffProfileId)
            : undefined;
          const isThisCompleting = completingOrientationId === orientation.id;

          return (
            <TableRow
              key={orientation.id}
              className={cn(onStaffClick && orientation.staffProfileId ? "cursor-pointer hover:bg-muted/50" : "")}
              onClick={() => {
                if (onStaffClick && orientation.staffProfileId) {
                  onStaffClick(orientation.staffProfileId);
                }
              }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getStaffInitials(staff)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {getStaffDisplayName(staff)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {staff?.roleType && (
                  <Badge
                    className={cn(
                      "rounded-full",
                      getRoleBadgeColor(staff.roleType)
                    )}
                  >
                    {staff.roleType}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {formatOrientationDate(orientation.completedAt)}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "rounded-full",
                    getOrientationStatusStyle(orientation.status)
                  )}
                >
                  {formatStatusLabel(orientation.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {orientation.orientedBy || "\u2014"}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {orientation.status === "scheduled" &&
                  orientation.staffProfileId &&
                  onMarkComplete && (
                    <Button
                      size="sm"
                      disabled={isThisCompleting || !!completingOrientationId}
                      onClick={() =>
                        onMarkComplete(orientation.id, orientation.staffProfileId!)
                      }
                    >
                      {isThisCompleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      {isThisCompleting ? "Completing..." : "Mark Complete"}
                    </Button>
                  )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};