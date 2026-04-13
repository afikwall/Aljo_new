import { Badge } from "@/components/ui/badge";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  ROLE_FULL_NAMES,
  getUpgradeStatusBadge,
  formatApplicationDate,
} from "@/utils/roleUpgradeUtils";
import type { IRoleUpgradeApplicationsEntity } from "@/product-types";
import { ArrowRight, CheckCircle, XCircle, Clock, Search, ListIcon } from "lucide-react";
import { useMemo } from "react";

interface MyApplicationsListProps {
  applications: (IRoleUpgradeApplicationsEntity & { id: string })[];
}

export const MyApplicationsList = ({ applications }: MyApplicationsListProps) => {
  const sortedApplications = useMemo(
    () =>
      [...applications].sort((a, b) => {
        const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
        const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
        return dateB - dateA;
      }),
    [applications]
  );

  const mostRecent = sortedApplications[0];
  const showCongrats = mostRecent?.status === "approved";

  return (
    <div className="space-y-4">
      {/* Congratulations Banner */}
      {showCongrats && (
        <div className="flex items-center gap-3 rounded-lg bg-accent/10 border border-accent/20 p-4">
          <span className="text-2xl">🎉</span>
          <p className="text-sm font-semibold">
            Congratulations! Your role upgrade to{" "}
            {ROLE_FULL_NAMES[mostRecent.requestedRole || ""] ||
              mostRecent.requestedRole}{" "}
            has been approved!
          </p>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center gap-2">
        <ListIcon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">My Applications</h3>
      </div>

      {/* Applications List */}
      {sortedApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed min-h-[120px] p-6 text-center">
          <Search className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No applications yet. Apply for a role upgrade above.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {sortedApplications.map((app) => {
            const statusBadge = getUpgradeStatusBadge(app.status);
            return (
              <div key={app.id} className="p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Role Transition */}
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(app.currentRole)}>
                      {app.currentRole}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge className={getRoleBadgeColor(app.requestedRole)}>
                      {app.requestedRole}
                    </Badge>
                  </div>

                  {/* Status Badge */}
                  <Badge className={statusBadge.className}>
                    {app.status === "approved" && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {app.status === "rejected" && (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {(app.status === "pending" ||
                      app.status === "under_review") && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {statusBadge.label}
                  </Badge>
                </div>

                {/* Date */}
                <p className="text-xs text-muted-foreground">
                  Applied {formatApplicationDate(app.appliedAt)}
                </p>

                {/* Rejection Reason */}
                {app.status === "rejected" && app.rejectionReason && (
                  <div className="rounded-md bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">
                      {app.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};