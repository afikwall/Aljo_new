import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, FileCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPageUrl } from "@/lib/utils";
import { AdminStaffManagementPage } from "@/product-types";
import type { IStaffProfilesEntity } from "@/product-types";

interface PendingReviewsSectionProps {
  staffProfiles: (IStaffProfilesEntity & { id: string })[] | undefined;
  isLoading: boolean;
}

export const PendingReviewsSection = ({
  staffProfiles,
  isLoading,
}: PendingReviewsSectionProps) => {
  const navigate = useNavigate();

  const pendingComplianceCount = useMemo(() => {
    if (!staffProfiles) return 0;
    return staffProfiles.filter((s) => s.complianceStatus === "pending").length;
  }, [staffProfiles]);

  const pendingOnboardingCount = useMemo(() => {
    if (!staffProfiles) return 0;
    return staffProfiles.filter((s) => s.onboardingStatus === "pending_review").length;
  }, [staffProfiles]);

  const handleNavigateToPendingReview = useCallback(() => {
    navigate(getPageUrl(AdminStaffManagementPage) + "?tab=pending_review");
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[100px] w-full rounded-lg" />
          <Skeleton className="h-[100px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Pending Reviews</h2>
      </div>
      <Separator />

      <div className="grid grid-cols-2 gap-4">
        {/* Card 1 – Pending Compliance Documents */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md min-h-[100px]",
            pendingComplianceCount > 0 ? "bg-chart-3/10" : "bg-accent/10"
          )}
          onClick={handleNavigateToPendingReview}
        >
          <CardContent className="p-4 relative">
            <FileCheck
              className={cn(
                "h-8 w-8 absolute top-4 right-4",
                pendingComplianceCount > 0 ? "text-chart-3" : "text-accent"
              )}
            />
            <div className="pr-10">
              <p className="text-3xl font-bold">{pendingComplianceCount}</p>
              <p className="text-sm font-medium mt-1">Pending Document Reviews</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Staff with documents awaiting review
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 – Pending Onboarding */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md min-h-[100px]",
            pendingOnboardingCount > 0 ? "bg-chart-3/10" : "bg-accent/10"
          )}
          onClick={handleNavigateToPendingReview}
        >
          <CardContent className="p-4 relative">
            <UserCheck
              className={cn(
                "h-8 w-8 absolute top-4 right-4",
                pendingOnboardingCount > 0 ? "text-chart-3" : "text-accent"
              )}
            />
            <div className="pr-10">
              <p className="text-3xl font-bold">{pendingOnboardingCount}</p>
              <p className="text-sm font-medium mt-1">Pending Onboarding</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Staff awaiting onboarding approval
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};