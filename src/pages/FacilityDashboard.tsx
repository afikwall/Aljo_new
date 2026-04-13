import {
  useUser,
  useEntityGetAll,
  useEntityGetOne,
  useEntityUpdate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  FacilityManagerProfilesEntity,
  FacilitiesEntity,
  ShiftsEntity,
  StaffProfilesEntity,
  LoginPage,
  FacilityPostShiftPage,
} from "@/product-types";
import type { IShiftsEntity, IStaffProfilesEntity } from "@/product-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RateCompletedShifts } from "@/components/RateCompletedShifts";
import { FacilityFavorites } from "@/components/FacilityFavorites";
import { OrientationManagementSection } from "@/components/OrientationManagementSection";
import { OrientationRequestsSection } from "@/components/OrientationRequestsSection";
import { StaffActivityCard } from "@/components/StaffActivityCard";
import { FMStaffDocumentsSheet } from "@/components/FMStaffDocumentsSheet";
import { Calendar, Clock, CheckCircle, Plus, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { StatsCard } from "@/components/StatsCard";
import { FacilityShiftCard, EmptyShiftCard } from "@/components/FacilityShiftCard";
import { ShiftFilters } from "@/components/ShiftFilters";
import { EditShiftSheet } from "@/components/EditShiftSheet";
import { AutoScheduleSettingsCard } from "@/components/AutoScheduleSettingsCard";
import { FacilityRatesSection } from "@/components/FacilityRatesSection";
import { getPageUrl } from "@/lib/utils";
import { toast } from "sonner";

export const pageIcon = "layout-dashboard";

export default function FacilityDashboardPage() {
  const user = useUser();
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // FM staff documents sheet state
  const [fmStaffSheetOpen, setFmStaffSheetOpen] = useState(false);
  const [selectedFMStaffId, setSelectedFMStaffId] = useState<string | null>(null);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) {
    return null;
  }

  // Fetch manager profile
  const { data: managerProfiles, isLoading: loadingProfile } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: user.email }
  );
  const managerProfile = managerProfiles?.[0];
  const facilityProfileId = managerProfile?.facilityProfileId;

  // Fetch facility details
  const { data: facility } = useEntityGetOne(
    FacilitiesEntity,
    { id: facilityProfileId || "" },
    { enabled: !!facilityProfileId }
  );

  // Fetch shifts
  const {
    data: shifts,
    isLoading: loadingShifts,
    refetch: refetchShifts,
  } = useEntityGetAll(
    ShiftsEntity,
    { facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  // Fetch all staff profiles for the popup
  const { data: allStaffProfiles } = useEntityGetAll(StaffProfilesEntity);

  const staffMap = useMemo(() => {
    const map = new Map<string, IStaffProfilesEntity & { id: string }>();
    allStaffProfiles?.forEach((sp) => {
      map.set(sp.id, sp as IStaffProfilesEntity & { id: string });
    });
    return map;
  }, [allStaffProfiles]);

  // Update hook
  const { updateFunction, isLoading: isSaving } = useEntityUpdate(ShiftsEntity);

  // KPI Stats
  const stats = useMemo(() => {
    if (!shifts) return { openShifts: 0, shiftsToday: 0, claimedThisWeek: 0 };

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const openShifts = shifts.filter((s) => s.status === "open").length;

    const shiftsToday = shifts.filter((s) => {
      if (!s.startDateTime) return false;
      try {
        return isToday(parseISO(s.startDateTime));
      } catch {
        return false;
      }
    }).length;

    const claimedThisWeek = shifts.filter((s) => {
      if (!s.startDateTime) return false;
      const filled = s.filledCount || 0;
      const hc = s.headcount || 1;
      if (filled < hc) return false;
      try {
        const shiftDate = parseISO(s.startDateTime);
        return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
      } catch {
        return false;
      }
    }).length;

    return { openShifts, shiftsToday, claimedThisWeek };
  }, [shifts]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    if (!shifts) return [];

    return shifts
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (roleFilter !== "all" && s.requiredRole !== roleFilter) return false;
        return true;
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.startDateTime || "");
          const dateB = parseISO(b.startDateTime || "");
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      });
  }, [shifts, statusFilter, roleFilter]);

  // Selected shift for editing
  const selectedShift = useMemo(() => {
    if (!selectedShiftId || !shifts) return null;
    return shifts.find((s) => s.id === selectedShiftId) || null;
  }, [selectedShiftId, shifts]);

  // Selected staff for popup
  const selectedFMStaff = useMemo(
    () => (selectedFMStaffId ? staffMap.get(selectedFMStaffId) ?? null : null),
    [selectedFMStaffId, staffMap]
  );

  // Handlers
  const handleCardClick = useCallback((shiftId: string) => {
    setSelectedShiftId(shiftId);
    setSheetOpen(true);
  }, []);

  const handleEditClick = useCallback((shiftId: string) => {
    setSelectedShiftId(shiftId);
    setSheetOpen(true);
  }, []);

  const handlePostShift = useCallback(() => {
    navigate(getPageUrl(FacilityPostShiftPage));
  }, [navigate]);

  const handleSaveShift = useCallback(
    async (shiftId: string, data: Partial<IShiftsEntity>) => {
      try {
        await updateFunction({ id: shiftId, data });
        toast.success("Shift updated successfully");
        setSheetOpen(false);
        refetchShifts();
      } catch {
        toast.error("Failed to update shift. Please try again.");
      }
    },
    [updateFunction, refetchShifts]
  );

  const handleCancelShift = useCallback(
    async (shiftId: string) => {
      setIsCancelling(true);
      try {
        await updateFunction({
          id: shiftId,
          data: { status: "cancelled" },
        });
        toast.success("Shift cancelled successfully");
        setSheetOpen(false);
        refetchShifts();
      } catch {
        toast.error("Failed to cancel shift. Please try again.");
      } finally {
        setIsCancelling(false);
      }
    },
    [updateFunction, refetchShifts]
  );

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleRoleFilterChange = useCallback((value: string) => {
    setRoleFilter(value);
  }, []);

  const handleActivityStaffClick = useCallback((staffProfileId: string) => {
    setSelectedFMStaffId(staffProfileId);
    setFmStaffSheetOpen(true);
  }, []);

  // Loading state
  if (loadingProfile) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // No profile
  if (!managerProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-chart-3" />
              Profile Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your facility manager profile hasn&apos;t been set up yet. Please
              contact your administrator to complete your profile setup.
            </p>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">What you&apos;ll need:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside flex flex-col gap-1">
                <li>Facility assignment</li>
                <li>Contact information</li>
                <li>Position details</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = loadingShifts;
  const postShiftPageUrl = getPageUrl(FacilityPostShiftPage);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your facility&apos;s shifts and staffing
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatsCard
          title="Open Shifts"
          value={stats.openShifts}
          icon={Calendar}
          isLoading={isLoading}
          iconClassName="text-chart-1"
        />
        <StatsCard
          title="Shifts Today"
          value={stats.shiftsToday}
          icon={Clock}
          isLoading={isLoading}
          iconClassName="text-chart-2"
        />
        <StatsCard
          title="Claimed This Week"
          value={stats.claimedThisWeek}
          icon={CheckCircle}
          isLoading={isLoading}
          iconClassName="text-accent"
        />
      </div>

      {/* Staff Activity (Upcoming Staff + Withdrawals) */}
      {facilityProfileId && (
        <StaffActivityCard
          facilityProfileId={facilityProfileId}
          shifts={shifts || []}
          isLoadingShifts={loadingShifts}
          onStaffClick={handleActivityStaffClick}
        />
      )}

      {/* FM Staff Documents Sheet */}
      <FMStaffDocumentsSheet
        open={fmStaffSheetOpen}
        onOpenChange={(open) => {
          setFmStaffSheetOpen(open);
          if (!open) setSelectedFMStaffId(null);
        }}
        staff={selectedFMStaff}
      />

      {/* Orientation Requests (for pending staff requests) */}
      {facilityProfileId && (
        <OrientationRequestsSection facilityProfileId={facilityProfileId} />
      )}

      {/* Post New Shift Button */}
      <Link to={postShiftPageUrl} className="block">
        <Button size="lg" className="w-full md:w-auto h-12 md:h-11 text-base">
          <Plus className="mr-2 h-5 w-5" />
          Post New Shift
        </Button>
      </Link>

      {/* Facility Rates (Staff + Billing, view-only for FM) */}
      {facilityProfileId && (
        <FacilityRatesSection facilityProfileId={facilityProfileId} />
      )}

      {/* Orientation Management */}
      {facilityProfileId && (
        <OrientationManagementSection facilityProfileId={facilityProfileId} />
      )}

      {/* Rate Completed Shifts */}
      {facilityProfileId && (
        <RateCompletedShifts
          facilityId={facilityProfileId}
          ratedByEmail={user.email || ""}
        />
      )}

      {/* Favorites */}
      {facilityProfileId && (
        <FacilityFavorites facilityId={facilityProfileId} />
      )}

      {/* Auto-Schedule Settings */}
      {managerProfile && (
        <AutoScheduleSettingsCard
          managerProfile={managerProfile as typeof managerProfile & { id: string }}
          onSettingsSaved={() => refetchShifts()}
        />
      )}

      {/* All Shifts Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">All Shifts</h2>
        </div>

        {/* Filters */}
        <ShiftFilters
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          onStatusChange={handleStatusFilterChange}
          onRoleChange={handleRoleFilterChange}
          resultsCount={filteredShifts.length}
        />

        {/* Shift Cards Grid */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <EmptyShiftCard onPostShift={handlePostShift} />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShifts.map((shift) => (
              <FacilityShiftCard
                key={shift.id}
                shiftId={shift.id}
                facilityName={facility?.name || "Facility"}
                facilityCity={facility?.city}
                startDateTime={shift.startDateTime}
                endDateTime={shift.endDateTime}
                requiredRole={shift.requiredRole}
                status={shift.status}
                isShortNotice={shift.isShortNotice}
                headcount={shift.headcount}
                filledCount={shift.filledCount}
                notes={shift.notes}
                shiftStaffRate={shift.shiftStaffRate}
                requiresOrientation={shift.requiresOrientation}
                onCardClick={handleCardClick}
                onEditClick={handleEditClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Shift Sheet */}
      <EditShiftSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        shift={selectedShift}
        facility={facility || null}
        onSave={handleSaveShift}
        onCancel={handleCancelShift}
        isSaving={isSaving}
        isCancelling={isCancelling}
      />
    </div>
  );
}