import { useUser, useEntityGetAll, useEntityCreate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import {
  StaffProfilesEntity,
  ShiftApplicationsEntity,
  ShiftsEntity,
  FacilitiesEntity,
  TimeLogsEntity,
  StaffRatesEntity,
  RoleUpgradeApplicationsEntity,
  ProfilePage,
  LoginPage,
  StaffMyDocumentsPage,
  StaffCareerPathPage,
  StaffMyPayrollsPage,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  MapPin,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO, isWithinInterval, subMinutes, startOfMonth, endOfMonth, subDays, isAfter } from "date-fns";
import { getPageUrl } from "@/lib/utils";
import { Link } from "react-router";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { ROLE_FULL_NAMES } from "@/utils/roleUpgradeUtils";
import { CurrentlyWorkingCard } from "@/components/CurrentlyWorkingCard";
import { StaffPayPeriodCard } from "@/components/StaffPayPeriodCard";
import { MyStatsCard } from "@/components/MyStatsCard";
import { OrientationsSection } from "@/components/OrientationsSection";
import { toast } from "sonner";

export default function StaffDashboardPage() {
  // ── All hooks MUST be called unconditionally at the top level ──

  const user = useUser();
  const navigate = useNavigate();

  // Live timer state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-creation state
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Auto-create hook
  const { createFunction: createStaffProfile } = useEntityCreate(StaffProfilesEntity);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  // Staff profile lookup by email
  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email }
  );
  const staffProfile = staffProfiles?.[0];

  // Auto-create profile for invited staff members
  useEffect(() => {
    // Run when: authenticated + have email + profiles loaded + no profile exists + not already creating
    if (
      !loadingProfile &&
      user.isAuthenticated &&
      user.email &&
      staffProfiles !== undefined &&
      staffProfiles.length === 0 &&
      !isCreatingProfile
    ) {
      setIsCreatingProfile(true);
      createStaffProfile({
        data: {
          email: user.email,
          onboardingStatus: "incomplete",
          complianceStatus: "pending",
        },
      })
        .catch((error) => {
          toast.error("Failed to create profile. Please refresh the page.");
          console.error("Auto-create profile error:", error);
        });
    }
  }, [
    loadingProfile,
    user.isAuthenticated,
    user.email,
    staffProfiles,
    isCreatingProfile,
    createStaffProfile,
  ]);

  // Shift applications for this staff member
  const { data: shiftApplications, isLoading: loadingApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  // Role upgrade applications for this staff member
  const { data: roleUpgradeApplications, isLoading: loadingUpgrades } = useEntityGetAll(
    RoleUpgradeApplicationsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  // Derived: approved applications
  const approvedApplications = useMemo(
    () => shiftApplications?.filter((app) => app.status === "approved") || [],
    [shiftApplications]
  );

  // Derived: approved shift IDs
  const approvedShiftIds = useMemo(
    () => approvedApplications?.map((app) => app.shiftProfileId) || [],
    [approvedApplications]
  );

  // All shifts
  const { data: allShifts, isLoading: loadingShifts } = useEntityGetAll(ShiftsEntity);

  // All facilities
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);

  // Fetch time logs to find active in-progress shift
  const { data: timeLogs, isLoading: loadingTimeLogs } = useEntityGetAll(TimeLogsEntity);

  // Fetch staff rates for pay period card
  const { data: staffRates, isLoading: loadingStaffRates } = useEntityGetAll(StaffRatesEntity);

  // Find in-progress shift for this staff member
  const inProgressShift = useMemo(() => {
    if (!allShifts || approvedShiftIds.length === 0) return null;
    return allShifts.find((shift) => {
      return approvedShiftIds.includes(shift.id) && shift.status === "in_progress";
    }) || null;
  }, [allShifts, approvedShiftIds]);

  // Find active time log for the in-progress shift
  const activeTimeLog = useMemo(() => {
    if (!inProgressShift || !timeLogs || !staffProfile?.id) return null;
    return timeLogs.find(
      (log) =>
        log.shiftProfileId === inProgressShift.id &&
        log.staffProfileId === staffProfile.id &&
        !log.clockOutTime
    ) || null;
  }, [inProgressShift, timeLogs, staffProfile?.id]);

  // In-progress facility name
  const inProgressFacilityName = useMemo(() => {
    if (!inProgressShift || !facilities) return "";
    const facility = facilities.find((f) => f.id === inProgressShift.facilityProfileId);
    return facility?.name || "Unknown Facility";
  }, [inProgressShift, facilities]);

  // Set up live timer if there's an active shift
  useEffect(() => {
    if (!inProgressShift || !activeTimeLog) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [inProgressShift, activeTimeLog]);

  // Derived: next 3 upcoming approved shifts
  const upcomingShifts = useMemo(() => {
    if (!allShifts || approvedShiftIds.length === 0) return [];

    const now = new Date();
    return allShifts
      .filter((shift) => {
        if (!approvedShiftIds.includes(shift.id)) return false;
        if (!shift.startDateTime) return false;
        try {
          const startTime = parseISO(shift.startDateTime);
          return startTime > now;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.startDateTime || "");
          const dateB = parseISO(b.startDateTime || "");
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 3);
  }, [allShifts, approvedShiftIds]);

  // Derived: completed shifts this month
  const completedShiftsThisMonth = useMemo(() => {
    if (!allShifts || approvedShiftIds.length === 0) return 0;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return allShifts.filter((shift) => {
      if (!approvedShiftIds.includes(shift.id)) return false;
      if (shift.status !== "completed") return false;
      if (!shift.startDateTime) return false;

      try {
        const shiftDate = parseISO(shift.startDateTime);
        return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    }).length;
  }, [allShifts, approvedShiftIds]);

  // Most recent role upgrade application
  const mostRecentUpgrade = useMemo(() => {
    if (!roleUpgradeApplications || roleUpgradeApplications.length === 0) return null;

    const sorted = [...roleUpgradeApplications].sort((a, b) => {
      const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return dateB - dateA;
    });

    return sorted[0];
  }, [roleUpgradeApplications]);

  const showApprovedBanner = useMemo(() => {
    if (!mostRecentUpgrade || mostRecentUpgrade.status !== "approved") return false;
    if (!mostRecentUpgrade.reviewedAt) return false;

    const sevenDaysAgo = subDays(new Date(), 7);
    return isAfter(parseISO(mostRecentUpgrade.reviewedAt), sevenDaysAgo);
  }, [mostRecentUpgrade]);

  // Determine display mode based on onboarding status
  const displayMode = useMemo(() => {
    const onboarding = staffProfile?.onboardingStatus;
    if (onboarding === "incomplete" || onboarding === "rejected") return "wizard" as const;
    if (onboarding === "pending_review") return "pending_review" as const;
    return "dashboard" as const; // "approved" or undefined
  }, [staffProfile?.onboardingStatus]);

  // ── Helper functions ──

  const getFacilityName = useCallback(
    (facilityId?: string) => {
      if (!facilityId || !facilities) return "Unknown Facility";
      const facility = facilities.find((f) => f.id === facilityId);
      return facility?.name || "Unknown Facility";
    },
    [facilities]
  );

  const canClockIn = useCallback((shiftStartDateTime?: string) => {
    if (!shiftStartDateTime) return false;
    try {
      const now = new Date();
      const shiftStart = parseISO(shiftStartDateTime);
      const clockInWindow = subMinutes(shiftStart, 15);
      return now >= clockInWindow && now <= shiftStart;
    } catch {
      return false;
    }
  }, []);

  const getComplianceStatusConfig = useCallback((status?: string) => {
    const configs = {
      compliant: {
        icon: CheckCircle,
        className: "bg-accent/20 text-accent border-accent/30",
        label: "Compliant",
      },
      pending: {
        icon: Clock,
        className: "bg-chart-3/20 text-chart-3 border-chart-3/30",
        label: "Pending Review",
      },
      expired: {
        icon: XCircle,
        className: "bg-destructive/20 text-destructive border-destructive/30",
        label: "Expired",
      },
      blocked: {
        icon: XCircle,
        className: "bg-destructive/20 text-destructive border-destructive/30",
        label: "Blocked",
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  }, []);

  // ── Conditional returns (AFTER all hooks) ──

  if (!user.isAuthenticated) {
    return null;
  }

  if (loadingProfile || isCreatingProfile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-chart-3">
                <AlertCircle className="h-5 w-5" />
                <p className="font-semibold">Profile Setup Failed</p>
              </div>
              <p className="text-sm text-muted-foreground">
                We couldn&apos;t create your profile automatically. Please try again.
              </p>
              <Button
                className="w-full"
                onClick={() => setIsCreatingProfile(false)}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── WIZARD MODE: Show onboarding wizard (incomplete or rejected) ──

  if (displayMode === "wizard") {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Welcome to ALJO CareCrew</h1>
          <p className="text-sm text-muted-foreground">
            Complete the steps below to get started
          </p>
        </div>
        <OnboardingWizard staffProfile={staffProfile as typeof staffProfile & { id: string }} />
      </div>
    );
  }

  // ── NORMAL DASHBOARD (approved or pending_review with banner) ──

  const complianceConfig = getComplianceStatusConfig(staffProfile.complianceStatus);
  const ComplianceIcon = complianceConfig.icon;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here&apos;s your overview
        </p>
      </div>

      {/* Pending Review Banner */}
      {displayMode === "pending_review" && (
        <div className="rounded-lg p-4 bg-chart-3/10 border border-chart-3/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-chart-3" />
            <h2 className="font-semibold text-base">Documents Under Review</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your documents are under review. You&apos;ll be notified when your account is fully approved.
          </p>
        </div>
      )}

      {/* Role Upgrade Alert Section */}
      {!loadingUpgrades && mostRecentUpgrade && (
        <>
          {/* Pending/Under Review Alert */}
          {(mostRecentUpgrade.status === "pending" || mostRecentUpgrade.status === "under_review") && (
            <div className="rounded-lg p-4 bg-chart-3/10 border border-chart-3/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-chart-3 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-base">Role Upgrade In Review</h2>
                    <Badge className="bg-chart-3/20 text-chart-3">Under Review</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your application to upgrade to {ROLE_FULL_NAMES[mostRecentUpgrade.requestedRole || ""] || mostRecentUpgrade.requestedRole} is currently under review.
                  </p>
                  <Link to={getPageUrl(StaffCareerPathPage)} className="text-sm text-chart-3 hover:underline inline-flex items-center gap-1">
                    View Application →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Approved Congratulations Banner */}
          {showApprovedBanner && (
            <div className="rounded-lg p-4 bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-base">Congratulations! 🎉</h2>
                    <Badge className="bg-accent/20 text-accent">Approved</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You've been upgraded to {ROLE_FULL_NAMES[mostRecentUpgrade.requestedRole || ""] || mostRecentUpgrade.requestedRole}! ✨
                  </p>
                  <Link to={getPageUrl(StaffCareerPathPage)} className="text-sm text-accent hover:underline inline-flex items-center gap-1">
                    View Career Path →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Currently Working Card - shown when staff has an active in-progress shift */}
      {inProgressShift && activeTimeLog && activeTimeLog.clockInTime && (
        <CurrentlyWorkingCard
          facilityName={inProgressFacilityName}
          clockInTime={activeTimeLog.clockInTime}
          currentTime={currentTime}
        />
      )}

      {/* Compliance Status Card - Top Priority */}
      <Link to={getPageUrl(StaffMyDocumentsPage)}>
        <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Compliance Status</p>
                <Badge className={`text-lg ${complianceConfig.className}`}>
                  <ComplianceIcon className="mr-2 h-5 w-5" />
                  {complianceConfig.label}
                </Badge>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tap to manage your documents and compliance
            </p>
          </CardContent>
        </Card>
      </Link>

      {/* Pay Period Card */}
      <StaffPayPeriodCard
        timeLogs={timeLogs as { clockOutTime?: string; totalHours?: number; staffProfileId?: string }[] | undefined}
        staffRoleType={staffProfile.roleType}
        staffRates={staffRates as { roleType?: string; staffRate?: number }[] | undefined}
        staffProfileId={staffProfile.id}
        isLoading={loadingTimeLogs || loadingStaffRates}
      />

      {/* Upcoming Shifts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Shifts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingShifts || loadingApplications ? (
            <>
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </>
          ) : upcomingShifts.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-base">No upcoming shifts</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse available shifts to get started
              </p>
            </div>
          ) : (
            upcomingShifts.map((shift) => {
              const showClockIn = canClockIn(shift.startDateTime);
              return (
                <Card key={shift.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="font-semibold">
                              {getFacilityName(shift.facilityProfileId)}
                            </p>
                          </div>
                          {shift.startDateTime && shift.endDateTime && (
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(shift.startDateTime), "EEE, MMM d")} •{" "}
                              {format(parseISO(shift.startDateTime), "h:mm a")} -{" "}
                              {format(parseISO(shift.endDateTime), "h:mm a")}
                            </p>
                          )}
                        </div>
                        {shift.requiredRole && (
                          <Badge variant="outline" className="text-xs">
                            {shift.requiredRole}
                          </Badge>
                        )}
                      </div>

                      {showClockIn && (
                        <Button className="w-full h-12 text-base" size="lg">
                          Clock In
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Orientations Section - only shown when dashboard is approved */}
      {displayMode === "dashboard" && staffProfile?.id && (
        <OrientationsSection
          staffProfileId={staffProfile.id}
          staffEmail={user.email}
        />
      )}

      {/* Quick Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Shifts Completed</p>
              <p className="text-3xl font-bold">{completedShiftsThisMonth}</p>
            </div>
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* My Stats Card */}
      {staffProfile?.id && (
        <MyStatsCard staffProfileId={staffProfile.id} />
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link to={getPageUrl(StaffMyDocumentsPage)} className="block">
          <Button variant="secondary" className="w-full h-12 text-base" size="lg">
            <FileText className="mr-2 h-5 w-5" />
            My Documents
          </Button>
        </Link>
        <Link to={getPageUrl(StaffMyPayrollsPage)} className="block">
          <Button variant="secondary" className="w-full h-12 text-base" size="lg">
            <Wallet className="mr-2 h-5 w-5" />
            My Payrolls
          </Button>
        </Link>
      </div>
    </div>
  );
}