import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityCreate,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  RoleUpgradeApplicationsEntity,
  StaffDocumentsEntity,
  type IStaffProfilesEntity,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  ROLE_FULL_NAMES,
  getNextUpgradeRole,
} from "@/utils/roleUpgradeUtils";
import { UpgradeRoleCard } from "@/components/UpgradeRoleCard";
import { MyApplicationsList } from "@/components/MyApplicationsList";
import { WhatHappensNextTimeline } from "@/components/WhatHappensNextTimeline";
import { TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";

interface CareerAdvancementSectionProps {
  profile: IStaffProfilesEntity & { id: string };
}

export const CareerAdvancementSection = ({
  profile,
}: CareerAdvancementSectionProps) => {
  const user = useUser();
  const [applyingRole, setApplyingRole] = useState<string | null>(null);

  // Fetch staff's role upgrade applications
  const {
    data: applications,
    isLoading: loadingApps,
    refetch: refetchApps,
  } = useEntityGetAll(RoleUpgradeApplicationsEntity, {
    staffProfileId: profile.id,
  });

  // Fetch staff's documents
  const { data: staffDocs, isLoading: loadingDocs } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId: profile.id }
  );

  const { createFunction } = useEntityCreate(RoleUpgradeApplicationsEntity);

  const currentRole = profile.roleType || "";
  const nextRole = useMemo(() => getNextUpgradeRole(currentRole), [currentRole]);

  // Check if there's a pending/under_review application for the target role
  const hasPendingForRole = useCallback(
    (targetRole: string) => {
      if (!applications) return false;
      return applications.some(
        (app) =>
          app.requestedRole === targetRole &&
          (app.status === "pending" || app.status === "under_review")
      );
    },
    [applications]
  );

  // Check if there's any pending/under_review application (for "What Happens Next" timeline)
  const pendingOrReviewApp = useMemo(() => {
    if (!applications || !nextRole) return null;
    return applications.find(
      (app) =>
        app.requestedRole === nextRole &&
        (app.status === "pending" || app.status === "under_review")
    ) || null;
  }, [applications, nextRole]);

  // Get the most recent approved application for congrats banner
  const typedApplications = useMemo(() => {
    if (!applications) return [];
    return applications.map((app) => ({
      ...app,
      id: (app as any).id as string,
    }));
  }, [applications]);

  const handleApply = useCallback(
    async (targetRole: string) => {
      if (hasPendingForRole(targetRole)) return;

      setApplyingRole(targetRole);
      try {
        await createFunction({
          data: {
            staffProfileId: profile.id,
            staffEmail: user.email,
            currentRole: currentRole,
            requestedRole: targetRole as any,
            status: "pending",
            appliedAt: new Date().toISOString(),
          },
        });
        toast.success(
          `Your application for ${ROLE_FULL_NAMES[targetRole] || targetRole} has been submitted! Please upload any required documents.`
        );
        await refetchApps();
      } catch (error) {
        toast.error("Failed to submit application. Please try again.");
      } finally {
        setApplyingRole(null);
      }
    },
    [hasPendingForRole, createFunction, profile.id, user.email, currentRole, refetchApps]
  );

  if (loadingApps || loadingDocs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Career Advancement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const isHighestRole = nextRole === null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Career Advancement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Role Display */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Current Role
          </p>
          <div className="flex items-center gap-3">
            <Badge className={`text-base px-3 py-1 ${getRoleBadgeColor(currentRole)}`}>
              {currentRole}
            </Badge>
            <span className="text-lg font-semibold">
              {ROLE_FULL_NAMES[currentRole] || currentRole}
            </span>
          </div>
        </div>

        {/* Upgrade Path */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Upgrade Path
          </p>

          {isHighestRole ? (
            /* Highest qualification card */
            <div className="flex items-center gap-4 rounded-lg border border-chart-3/30 bg-chart-3/5 p-4">
              <Trophy className="h-8 w-8 text-chart-3 shrink-0" />
              <div>
                <p className="font-semibold">Top Qualification</p>
                <p className="text-sm text-muted-foreground">
                  You hold the highest qualification. Congratulations on reaching
                  the top of the clinical career ladder!
                </p>
              </div>
            </div>
          ) : (
            nextRole && (
              <>
                <UpgradeRoleCard
                  currentRole={currentRole}
                  targetRole={nextRole}
                  approvedDocs={staffDocs || []}
                  hasPendingApplication={hasPendingForRole(nextRole)}
                  isApplying={applyingRole === nextRole}
                  onApply={() => handleApply(nextRole)}
                />

                {/* "What happens next?" timeline — shown only when pending/under_review */}
                {pendingOrReviewApp && (
                  <WhatHappensNextTimeline
                    currentRole={currentRole}
                    targetRole={nextRole}
                    staffDocs={staffDocs || []}
                  />
                )}
              </>
            )
          )}
        </div>

        {/* My Applications */}
        <MyApplicationsList applications={typedApplications} />
      </CardContent>
    </Card>
  );
};