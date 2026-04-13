import { useMemo, useCallback, useRef } from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IRoleUpgradeApplicationsEntity, IStaffProfilesEntity } from "@/product-types";

interface PendingUpgradeAlertProps {
  upgradeApplications?: (IRoleUpgradeApplicationsEntity & { id: string })[];
  staffProfiles?: (IStaffProfilesEntity & { id: string })[];
  onGoToUpgrades: () => void;
}

export const PendingUpgradeAlert = ({
  upgradeApplications,
  staffProfiles,
  onGoToUpgrades,
}: PendingUpgradeAlertProps) => {
  const pendingApplications = useMemo(() => {
    if (!upgradeApplications) return [];
    return upgradeApplications.filter(
      (app) => app.status === "pending" || app.status === "under_review"
    );
  }, [upgradeApplications]);

  const applicantDetails = useMemo(() => {
    return pendingApplications.map((app) => {
      const staffProfile = staffProfiles?.find(
        (s) => s.id === app.staffProfileId
      );
      const name =
        staffProfile?.firstName && staffProfile?.lastName
          ? `${staffProfile.firstName} ${staffProfile.lastName}`
          : null;
      const email = app.staffEmail || staffProfile?.email || "Unknown";
      const initials = name
        ? `${staffProfile?.firstName?.[0] || ""}${staffProfile?.lastName?.[0] || ""}`
        : email[0]?.toUpperCase() || "?";

      return {
        id: app.staffProfileId || app.id,
        name,
        email,
        initials,
        currentRole: app.currentRole,
        requestedRole: app.requestedRole,
      };
    });
  }, [pendingApplications, staffProfiles]);

  const displayedApplicants = useMemo(
    () => applicantDetails.slice(0, 3),
    [applicantDetails]
  );

  const remainingCount = applicantDetails.length - displayedApplicants.length;

  const handleGoToUpgrades = useCallback(() => {
    onGoToUpgrades();
  }, [onGoToUpgrades]);

  if (pendingApplications.length === 0) return null;

  return (
    <div className="rounded-lg border-l-4 border-l-chart-3 bg-chart-3/10 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3 md:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-3/20 md:h-12 md:w-12">
            <TrendingUp className="h-5 w-5 text-chart-3 md:h-6 md:w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              {pendingApplications.length} Role Upgrade Request
              {pendingApplications.length !== 1 ? "s" : ""} Awaiting Your Review
            </h3>
            <p className="text-sm text-muted-foreground">
              Staff members have applied for role upgrades. Click the Role
              Upgrades tab below to review and approve or reject.
            </p>

            {/* Applicant list */}
            <div className="mt-3 space-y-2">
              {displayedApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-chart-3/20 text-chart-3 font-medium">
                      {applicant.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {applicant.name || applicant.email}
                  </span>
                  {applicant.name && (
                    <span className="text-muted-foreground">
                      ({applicant.email})
                    </span>
                  )}
                  {applicant.currentRole && applicant.requestedRole && (
                    <span className="text-muted-foreground">
                      — {applicant.currentRole} → {applicant.requestedRole}
                    </span>
                  )}
                </div>
              ))}
              {remainingCount > 0 && (
                <p className="text-sm font-medium text-chart-3 pl-8">
                  +{remainingCount} more
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleGoToUpgrades}
          className="w-full bg-chart-3 text-white hover:bg-chart-3/90 md:w-auto shrink-0"
        >
          Go to Role Upgrades
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};