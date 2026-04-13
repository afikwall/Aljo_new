import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  RoleUpgradeApplicationsEntity,
  StaffProfilesEntity,
  StaffDocumentsEntity,
  ApproveRoleUpgradeAction,
  RejectRoleUpgradeAction,
  type IStaffProfilesEntity,
  type IStaffDocumentsEntity,
  type IRoleUpgradeApplicationsEntity,
} from "@/product-types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingUpgradeCard } from "@/components/PendingUpgradeCard";
import { RecentUpgradeCard } from "@/components/RecentUpgradeCard";
import { ROLE_FULL_NAMES } from "@/utils/roleUpgradeUtils";
import { Clock, CheckCircle, Inbox, Info } from "lucide-react";
import { toast } from "sonner";

interface RoleUpgradesTabProps {
  staffProfiles?: (IStaffProfilesEntity & { id: string })[];
  staffDocuments?: (IStaffDocumentsEntity & { id: string })[];
  onViewProfile?: (staffProfileId: string) => void;
}

export const RoleUpgradesTab = ({
  staffProfiles,
  staffDocuments,
  onViewProfile,
}: RoleUpgradesTabProps) => {
  const user = useUser();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data: allApplications,
    isLoading: loadingApps,
    refetch: refetchApps,
  } = useEntityGetAll(RoleUpgradeApplicationsEntity);

  const { executeFunction: executeApprove } = useExecuteAction(
    ApproveRoleUpgradeAction
  );
  const { executeFunction: executeReject } = useExecuteAction(
    RejectRoleUpgradeAction
  );

  // Staff profiles map for quick lookup
  const staffProfilesMap = useMemo(() => {
    const map = new Map<string, IStaffProfilesEntity & { id: string }>();
    staffProfiles?.forEach((profile) => {
      if (profile.id) {
        map.set(profile.id, profile);
      }
    });
    return map;
  }, [staffProfiles]);

  // Staff documents grouped by staffProfileId
  const staffDocsMap = useMemo(() => {
    const map = new Map<string, IStaffDocumentsEntity[]>();
    staffDocuments?.forEach((doc) => {
      if (doc.staffProfileId) {
        const existing = map.get(doc.staffProfileId) || [];
        existing.push(doc);
        map.set(doc.staffProfileId, existing);
      }
    });
    return map;
  }, [staffDocuments]);

  // Separate pending and recent applications
  const pendingApplications = useMemo(() => {
    if (!allApplications) return [];
    return allApplications
      .filter(
        (app) =>
          app.status === "pending" || app.status === "under_review"
      )
      .map((app) => ({ ...app, id: (app as any).id as string }))
      .sort((a, b) => {
        const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
        const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [allApplications]);

  const recentApplications = useMemo(() => {
    if (!allApplications) return [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return allApplications
      .filter(
        (app) =>
          (app.status === "approved" || app.status === "rejected") &&
          app.reviewedAt &&
          new Date(app.reviewedAt).getTime() >= thirtyDaysAgo.getTime()
      )
      .map((app) => ({ ...app, id: (app as any).id as string }))
      .sort((a, b) => {
        const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [allApplications]);

  const handleApprove = useCallback(
    async (applicationId: string, staffProfileId: string, newRole: string) => {
      setProcessingId(applicationId);
      try {
        const result = await executeApprove({
          applicationId,
          staffProfileId,
          newRole,
          reviewedByEmail: user.email,
        });

        if (result?.success) {
          const staffProfile = staffProfilesMap.get(staffProfileId);
          const staffName = staffProfile
            ? `${staffProfile.firstName || ""} ${staffProfile.lastName || ""}`.trim()
            : "Staff member";
          toast.success(
            `Role upgrade approved! ${staffName} is now a ${ROLE_FULL_NAMES[newRole] || newRole}.`
          );
          await refetchApps();
        } else {
          toast.error("Failed to approve role upgrade.");
        }
      } catch (error) {
        toast.error("Failed to approve role upgrade. Please try again.");
      } finally {
        setProcessingId(null);
      }
    },
    [executeApprove, user.email, staffProfilesMap, refetchApps]
  );

  const handleReject = useCallback(
    async (applicationId: string, rejectionReason: string) => {
      setProcessingId(applicationId);
      try {
        const result = await executeReject({
          applicationId,
          rejectionReason,
          reviewedByEmail: user.email,
        });

        if (result?.success) {
          toast.success("Application rejected.");
          await refetchApps();
        } else {
          toast.error("Failed to reject application.");
        }
      } catch (error) {
        toast.error("Failed to reject application. Please try again.");
      } finally {
        setProcessingId(null);
      }
    },
    [executeReject, user.email, refetchApps]
  );

  const handleUploadSuccess = useCallback(() => {
    refetchApps();
  }, [refetchApps]);

  if (loadingApps) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Info Box - shown only when pending applications exist */}
      {pendingApplications.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Review Role Upgrade Requests</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              When staff apply for a role upgrade, they appear here. Review their
              documents before approving to ensure all requirements are met.
            </p>
          </div>
        </div>
      )}

      {/* Pending Applications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Pending Applications</h3>
          {pendingApplications.length > 0 && (
            <Badge className="bg-chart-3/20 text-chart-3">
              {pendingApplications.length}
            </Badge>
          )}
        </div>

        {pendingApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed min-h-[120px] p-6 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending role upgrade applications
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApplications.map((app) => (
              <PendingUpgradeCard
                key={app.id}
                application={app}
                staffProfile={
                  app.staffProfileId
                    ? staffProfilesMap.get(app.staffProfileId)
                    : undefined
                }
                staffDocs={
                  app.staffProfileId
                    ? staffDocsMap.get(app.staffProfileId) || []
                    : []
                }
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={processingId === app.id}
                onViewProfile={onViewProfile}
                onUploadSuccess={handleUploadSuccess}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently Processed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recently Processed</h3>
          {recentApplications.length > 0 && (
            <Badge variant="outline">{recentApplications.length}</Badge>
          )}
        </div>

        {recentApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed min-h-[120px] p-6 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recently processed applications
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {recentApplications.map((app) => (
              <RecentUpgradeCard
                key={app.id}
                application={app}
                staffProfile={
                  app.staffProfileId
                    ? staffProfilesMap.get(app.staffProfileId)
                    : undefined
                }
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};