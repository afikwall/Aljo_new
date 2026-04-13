import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getUpgradeStatusBadge,
  formatApplicationDate,
} from "@/utils/roleUpgradeUtils";
import type {
  IRoleUpgradeApplicationsEntity,
  IStaffProfilesEntity,
} from "@/product-types";
import { ArrowRight, CheckCircle, XCircle, User } from "lucide-react";

interface RecentUpgradeCardProps {
  application: IRoleUpgradeApplicationsEntity & { id: string };
  staffProfile?: IStaffProfilesEntity & { id: string };
  onViewProfile?: (staffProfileId: string) => void;
}

export const RecentUpgradeCard = ({
  application,
  staffProfile,
  onViewProfile,
}: RecentUpgradeCardProps) => {
  const staffName = useMemo(() => {
    if (staffProfile?.firstName || staffProfile?.lastName) {
      return `${staffProfile.firstName || ""} ${staffProfile.lastName || ""}`.trim();
    }
    return application.staffEmail || "Unknown Staff";
  }, [staffProfile, application.staffEmail]);

  const statusBadge = useMemo(
    () => getUpgradeStatusBadge(application.status),
    [application.status]
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
      <div className="space-y-1.5">
        {/* Staff Name */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{staffName}</p>
          {onViewProfile && application.staffProfileId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 px-2"
              onClick={() => onViewProfile(application.staffProfileId!)}
            >
              <User className="h-3 w-3" />
              View Profile
            </Button>
          )}
        </div>

        {/* Role Transition */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {application.currentRole}
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            {application.requestedRole}
          </Badge>
        </div>

        {/* Rejection reason */}
        {application.status === "rejected" && application.rejectionReason && (
          <p className="text-xs text-muted-foreground">
            Reason: {application.rejectionReason}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge className={statusBadge.className}>
          {application.status === "approved" && (
            <CheckCircle className="h-3 w-3 mr-1" />
          )}
          {application.status === "rejected" && (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {statusBadge.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatApplicationDate(application.reviewedAt)}
        </span>
      </div>
    </div>
  );
};