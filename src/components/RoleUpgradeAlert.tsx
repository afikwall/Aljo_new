import { useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { RoleUpgradeApplicationsEntity, AdminStaffManagementPage } from "@/product-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";

export const RoleUpgradeAlert = () => {
  const { data: upgradeApplications, isLoading } = useEntityGetAll(
    RoleUpgradeApplicationsEntity
  );

  const pendingCount = useMemo(() => {
    if (!upgradeApplications) return 0;
    return upgradeApplications.filter(
      (app) => app.status === "pending" || app.status === "under_review"
    ).length;
  }, [upgradeApplications]);

  const staffManagementUrl = getPageUrl(AdminStaffManagementPage);

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (pendingCount > 0) {
    return (
      <Alert className="border-chart-3/50 bg-chart-3/5">
        <TrendingUp className="h-4 w-4 text-chart-3" />
        <AlertTitle className="text-chart-3">
          Role Upgrade Requests Pending
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-sm">
              {pendingCount} staff member{pendingCount !== 1 ? "s" : ""}{" "}
              {pendingCount !== 1 ? "are" : "is"} waiting for role upgrade
              review
            </span>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to={staffManagementUrl}>Review Now &rarr;</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-accent/50 bg-accent/5">
      <CheckCircle className="h-4 w-4 text-accent" />
      <AlertTitle>No Pending Role Upgrade Requests</AlertTitle>
      <AlertDescription>
        All role upgrade applications have been processed
      </AlertDescription>
    </Alert>
  );
};