import React from "react";
import { useUser, useEntityGetAll, useEntityCreate, useEntityUpdate, useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import {
  StaffProfilesEntity,
  ShiftsEntity,
  FacilitiesEntity,
  ShiftApplicationsEntity,
  FacilityFavoritesEntity,
  OrientationsEntity,
  CheckEligibilityv2Action,
  LoginPage,
  ProfilePage,
  StaffMyShiftsPage,
} from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Zap,
  Info,
  FileText,
  Loader2,
  CheckCircle,
  Users,
  Ban,
  XCircle,
  X,
  Star,
  GraduationCap,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  addWeeks,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  differenceInHours,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { getPageUrl, cn } from "@/lib/utils";
import { Link } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AvailableShiftCard } from "@/components/AvailableShiftCard";
import { ShiftTradesTab } from "@/components/ShiftTradesTab";
import type { ApplicationStatusType } from "@/utils/countdownUtils";
import { checkOrientationEligibility, getOrientationStatus } from "@/utils/orientationUtils";
import { getOrientationRequestStatus } from "@/utils/orientationActionUtils";
import { useOrientationActions } from "@/hooks/useOrientationActions";
import { ArrowLeftRight } from "lucide-react";

type DateFilter = "today" | "tomorrow" | "this_week" | "next_week" | "custom";

export default function StaffAvailableShiftsPage() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) {
    return null;
  }

  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email }
  );
  const staffProfile = staffProfiles?.[0];

  // Fetch favorites where this staff is favorited
  const { data: staffFavorites } = useEntityGetAll(
    FacilityFavoritesEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  // Fetch orientation records for this staff member
  const { data: staffOrientations, refetch: refetchOrientations } = useEntityGetAll(
    OrientationsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  // Build a set of facilityIds where this staff has a completed orientation
  const orientedFacilitySet = useMemo(() => {
    const set = new Set<string>();
    staffOrientations?.forEach((o) => {
      if (o.status === "completed" && o.facilityId) {
        set.add(o.facilityId);
      }
    });
    return set;
  }, [staffOrientations]);

  // Orientation request action hook
  const { requestOrientation, isRequesting: isRequestingOrientation } = useOrientationActions({
    staffOrientations,
    refetchOrientations,
  });

  // Build a set of facilityIds where this staff is a favorite
  const favoriteFacilityIds = useMemo(() => {
    const set = new Set<string>();
    staffFavorites?.forEach((f) => {
      if (f.facilityId) set.add(f.facilityId);
    });
    return set;
  }, [staffFavorites]);

  // Fetch ALL applications for this staff member (no status filter) — full picture
  const { data: allApplications, isLoading: loadingApplications, refetch: refetchApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  // Build application status map: shiftId → application (latest/most relevant)
  const applicationMap = useMemo(() => {
    const map = new Map<string, { status: string; appliedAt?: string; id?: string }>();
    if (!allApplications) return map;

    // Sort by appliedAt descending so latest application wins
    const sorted = [...allApplications].sort((a, b) => {
      const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return dateB - dateA;
    });

    for (const app of sorted) {
      if (app.shiftProfileId && !map.has(app.shiftProfileId)) {
        map.set(app.shiftProfileId, {
          status: app.status || "approved",
          appliedAt: app.appliedAt,
          id: app.id,
        });
      }
    }
    return map;
  }, [allApplications]);

  // Only fetch open shifts
  const { data: openShifts, isLoading: loadingShifts, refetch: refetchShifts } = useEntityGetAll(
    ShiftsEntity,
    { status: "open" },
    { enabled: !!staffProfile }
  );

  const { data: facilities } = useEntityGetAll(FacilitiesEntity);

  const ELIGIBILITY_MATRIX: Record<string, string[]> = useMemo(() => ({
    'RN': ['RN', 'LPN', 'CCA', 'CITR'],
    'LPN': ['LPN', 'CCA', 'CITR'],
    'CCA': ['CCA', 'CITR'],
    'CITR': ['CITR']
  }), []);

  const allShifts = useMemo(() => {
    if (!staffProfile?.roleType) return [];
    const shifts = openShifts || [];
    const eligibleRoles = ELIGIBILITY_MATRIX[staffProfile.roleType] || [];
    return shifts.filter((shift) => {
      // Filter out private shifts
      if (shift.isPrivate === true) return false;
      return shift.requiredRole && eligibleRoles.includes(shift.requiredRole);
    });
  }, [openShifts, staffProfile?.roleType, ELIGIBILITY_MATRIX]);

  const [mainTab, setMainTab] = useState("browse");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [hideClaimedShifts, setHideClaimedShifts] = useState(false);

  const customStartDate = customDateRange?.from;
  const customEndDate = customDateRange?.to;

  const handlePresetFilterClick = useCallback((filter: DateFilter) => {
    setDateFilter(filter);
    setCustomDateRange(undefined);
  }, []);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    setCustomDateRange(range);
    if (range?.from) {
      setDateFilter("custom");
    }
  }, []);

  const customButtonLabel = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `${format(customStartDate, "MMM d")} – ${format(customEndDate, "MMM d")}`;
    }
    if (customStartDate) {
      return `${format(customStartDate, "MMM d")} – ...`;
    }
    return "Custom";
  }, [customStartDate, customEndDate]);

  const [selectedShift, setSelectedShift] = useState<typeof ShiftsEntity['instanceType'] | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorReasons, setErrorReasons] = useState<string[]>([]);
  const [applyingAgain, setApplyingAgain] = useState(false);

  const { executeFunction: checkEligibility, isLoading: checkingEligibility } = useExecuteAction(CheckEligibilityv2Action);
  const { createFunction: createApplication, isLoading: creatingApplication } = useEntityCreate(ShiftApplicationsEntity);
  const { updateFunction: updateShift } = useEntityUpdate(ShiftsEntity);

  const getFacilityData = useMemo(() => {
    return (facilityId?: string) => {
      if (!facilityId || !facilities) return null;
      return facilities.find((f) => f.id === facilityId);
    };
  }, [facilities]);

  const uniqueCities = useMemo(() => {
    if (!allShifts || !facilities) return [];
    const cities = new Set<string>();
    allShifts.forEach((shift) => {
      const facility = getFacilityData(shift.facilityProfileId);
      if (facility?.city) {
        cities.add(facility.city);
      }
    });
    return Array.from(cities).sort();
  }, [allShifts, facilities, getFacilityData]);

  const filteredShifts = useMemo(() => {
    if (!allShifts) return [];

    let filtered = [...allShifts];

    // Date filter
    filtered = filtered.filter((shift) => {
      if (!shift.startDateTime) return false;
      try {
        const shiftDate = parseISO(shift.startDateTime);
        if (dateFilter === "today") return isToday(shiftDate);
        if (dateFilter === "tomorrow") return isTomorrow(shiftDate);
        if (dateFilter === "this_week") return isThisWeek(shiftDate);
        if (dateFilter === "next_week") {
          const nextWeekStart = startOfWeek(addWeeks(new Date(), 1));
          const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1));
          return isWithinInterval(shiftDate, { start: nextWeekStart, end: nextWeekEnd });
        }
        if (dateFilter === "custom" && customStartDate && customEndDate) {
          return isWithinInterval(shiftDate, { start: startOfDay(customStartDate), end: endOfDay(customEndDate) });
        }
        return true;
      } catch {
        return false;
      }
    });

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((shift) => {
        const facility = getFacilityData(shift.facilityProfileId);
        return facility?.city === cityFilter;
      });
    }

    // Hide claimed shifts filter
    if (hideClaimedShifts) {
      filtered = filtered.filter((shift) => {
        return !applicationMap.has(shift.id || "");
      });
    }

    // Sort by start date
    filtered.sort((a, b) => {
      if (!a.startDateTime || !b.startDateTime) return 0;
      try {
        return parseISO(a.startDateTime).getTime() - parseISO(b.startDateTime).getTime();
      } catch {
        return 0;
      }
    });

    return filtered;
  }, [allShifts, dateFilter, cityFilter, customStartDate, customEndDate, getFacilityData, hideClaimedShifts, applicationMap]);

  const getShiftDuration = useMemo(() => {
    return (startDateTime?: string, endDateTime?: string) => {
      if (!startDateTime || !endDateTime) return 0;
      try {
        return differenceInHours(parseISO(endDateTime), parseISO(startDateTime));
      } catch {
        return 0;
      }
    };
  }, []);

  const handleOpenShiftModal = useCallback((shift: typeof ShiftsEntity['instanceType']) => {
    setSelectedShift(shift);
    setErrorMessage(null);
    setErrorReasons([]);
    setShowShiftModal(true);
  }, []);

  // Claim shift — auto-approve: creates application with status "approved" directly
  const handleClaimShift = useCallback(async () => {
    if (!selectedShift || !staffProfile) return;

    setErrorMessage(null);
    setErrorReasons([]);

    try {
      const eligibilityResult = await checkEligibility({
        staffProfileId: staffProfile.id || "",
        shiftId: selectedShift.id || "",
      });

      // Orientation check: filter orientations for this shift's facility
      const facilityOrientations = (staffOrientations || []).filter(
        (o) => o.facilityId === selectedShift.facilityProfileId
      );
      const orientationCheck = checkOrientationEligibility(
        selectedShift,
        facilityOrientations
      );

      // Check if non-orientation reasons fail
      const nonOrientationReasons = [...(eligibilityResult.reasons || [])];
      const hasNonOrientationFailure = !eligibilityResult.eligible && nonOrientationReasons.length > 0;

      // Check orientation failure separately
      const hasOrientationFailure = !orientationCheck.passed;

      if (hasNonOrientationFailure) {
        // Non-orientation eligibility failure — show error in modal
        setErrorMessage("You are not eligible to claim this shift:");
        setErrorReasons(nonOrientationReasons);
        return;
      }

      if (hasOrientationFailure) {
        // Orientation-only failure — show orientation blocked state
        setErrorMessage("orientation_required");
        setErrorReasons([]);
        return;
      }

      // All checks pass — auto-approve claim
      await createApplication({
        data: {
          staffProfileId: staffProfile.id,
          shiftProfileId: selectedShift.id,
          status: "approved",
          appliedAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
        },
      });

      // Update shift: increment filledCount, set to claimed if full
      const currentFilled = selectedShift.filledCount || 0;
      const newFilled = currentFilled + 1;
      const headcount = selectedShift.headcount || 1;
      const shiftUpdateData: Record<string, unknown> = {
        filledCount: newFilled,
      };
      if (newFilled >= headcount) {
        shiftUpdateData.status = "claimed";
      }
      await updateShift({
        id: selectedShift.id || "",
        data: shiftUpdateData,
      });

      await refetchApplications();
      await refetchShifts();
      setShowShiftModal(false);
      setSelectedShift(null);

      toast.success("Shift claimed! ✓", {
        action: {
          label: "View My Shifts",
          onClick: () => navigate(getPageUrl(StaffMyShiftsPage)),
        },
      });
    } catch {
      toast.error("Failed to claim shift. Please try again.");
    }
  }, [selectedShift, staffProfile, staffOrientations, checkEligibility, createApplication, updateShift, refetchApplications, refetchShifts, navigate]);

  // Re-apply for shift (rejected/withdrawn) — auto-approve flow
  const handleClaimAgain = useCallback(async (shiftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!staffProfile) return;

    // Find the shift to check orientation requirements
    const shiftToApply = (openShifts || []).find((s) => s.id === shiftId);

    setApplyingAgain(true);
    try {
      const eligibilityResult = await checkEligibility({
        staffProfileId: staffProfile.id || "",
        shiftId: shiftId,
      });

      // Orientation check
      let orientationCheck = { passed: true, reason: undefined as string | undefined };
      if (shiftToApply) {
        const facilityOrientations = (staffOrientations || []).filter(
          (o) => o.facilityId === shiftToApply.facilityProfileId
        );
        orientationCheck = checkOrientationEligibility(
          shiftToApply,
          facilityOrientations
        );
      }

      const isEligible = eligibilityResult.eligible && orientationCheck.passed;

      if (isEligible) {
        await createApplication({
          data: {
            staffProfileId: staffProfile.id,
            shiftProfileId: shiftId,
            status: "approved",
            appliedAt: new Date().toISOString(),
            respondedAt: new Date().toISOString(),
          },
        });

        // Update shift: increment filledCount, set to claimed if full
        if (shiftToApply) {
          const currentFilled = shiftToApply.filledCount || 0;
          const newFilled = currentFilled + 1;
          const headcount = shiftToApply.headcount || 1;
          const shiftUpdateData: Record<string, unknown> = {
            filledCount: newFilled,
          };
          if (newFilled >= headcount) {
            shiftUpdateData.status = "claimed";
          }
          await updateShift({
            id: shiftId,
            data: shiftUpdateData,
          });
        }

        await refetchApplications();
        await refetchShifts();
        toast.success("Shift claimed! ✓");
      } else {
        const reasons = [...(eligibilityResult.reasons || [])];
        if (!orientationCheck.passed && orientationCheck.reason) {
          reasons.push(orientationCheck.reason);
        }
        toast.error(reasons[0] || "You are not eligible for this shift.");
      }
    } catch {
      toast.error("Failed to claim shift. Please try again.");
    } finally {
      setApplyingAgain(false);
    }
  }, [staffProfile, openShifts, staffOrientations, checkEligibility, createApplication, updateShift, refetchApplications, refetchShifts]);

  const handleRequestOrientation = useCallback(async () => {
    if (!staffProfile?.id || !selectedShift?.facilityProfileId || !user.email) return;

    const result = await requestOrientation(
      staffProfile.id,
      selectedShift.facilityProfileId,
      user.email
    );

    if (result.success || result.alreadyRequested) {
      setShowShiftModal(false);
    }
  }, [staffProfile?.id, selectedShift?.facilityProfileId, user.email, requestOrientation]);

  const getRoleBadgeColor = useCallback((role?: string) => {
    if (role === "RN") return "bg-chart-1/20 text-chart-1";
    if (role === "LPN") return "bg-chart-2/20 text-chart-2";
    if (role === "CCA") return "bg-chart-3/20 text-chart-3";
    if (role === "CITR") return "bg-chart-4/20 text-chart-4";
    return "bg-muted text-muted-foreground";
  }, []);

  if (loadingProfile) {
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
                <p className="font-semibold">Setup Required</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please complete your staff profile to browse and claim available shifts.
              </p>
              <Link to={getPageUrl(ProfilePage)}>
                <Button className="w-full">Complete Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Modal data
  const selectedFacility = selectedShift ? getFacilityData(selectedShift.facilityProfileId) : null;
  const selectedShiftDuration = selectedShift ? getShiftDuration(selectedShift.startDateTime, selectedShift.endDateTime) : 0;
  const selectedShiftApp = selectedShift ? applicationMap.get(selectedShift.id || "") : undefined;
  const selectedAppStatus: ApplicationStatusType = (selectedShiftApp?.status as ApplicationStatusType) || "none";
  const isShiftFullyBooked = selectedShift ? (selectedShift.filledCount || 0) >= (selectedShift.headcount || 1) : false;
  const selectedShiftShowFilled = selectedShift ? (selectedShift.headcount != null && selectedShift.headcount > 1) : false;
  const selectedOrientationStatus = selectedShift ? getOrientationStatus(selectedShift, orientedFacilitySet) : "not_required";

  // Check if orientation error is the blocking reason
  const isOrientationBlocked = errorMessage === "orientation_required";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Available Shifts</h1>
        <p className="text-sm text-muted-foreground">
          Browse and claim open shifts
        </p>
      </div>

      {/* Tabs: Browse & Shift Trades */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-auto">
          <TabsTrigger value="browse">Browse Shifts</TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Shift Trades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-6">

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-10 bg-background border rounded-lg shadow-sm">
        <div className="p-4 space-y-4">
          {staffProfile.complianceStatus !== "compliant" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  Your compliance status is {staffProfile.complianceStatus}. Update your documents to claim shifts.
                </span>
                <Link to={getPageUrl(ProfilePage)}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Update Documents
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Date filter buttons */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetFilterClick("today")}
              className="whitespace-nowrap text-xs px-2.5 py-1.5 h-8"
            >
              Today
            </Button>
            <Button
              variant={dateFilter === "tomorrow" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetFilterClick("tomorrow")}
              className="whitespace-nowrap text-xs px-2.5 py-1.5 h-8"
            >
              Tomorrow
            </Button>
            <Button
              variant={dateFilter === "this_week" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetFilterClick("this_week")}
              className="whitespace-nowrap text-xs px-2.5 py-1.5 h-8"
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === "next_week" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetFilterClick("next_week")}
              className="whitespace-nowrap text-xs px-2.5 py-1.5 h-8"
            >
              Next Week
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap text-xs px-2.5 py-1.5 h-8"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customButtonLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* City filter + Hide claimed toggle */}
          <div className="flex items-center justify-between gap-3">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full max-w-[200px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 shrink-0">
              <Switch
                id="hide-claimed"
                checked={hideClaimedShifts}
                onCheckedChange={setHideClaimedShifts}
              />
              <Label
                htmlFor="hide-claimed"
                className={cn(
                  "text-sm whitespace-nowrap cursor-pointer",
                  hideClaimedShifts ? "text-primary" : "text-muted-foreground"
                )}
              >
                Hide claimed shifts
              </Label>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {filteredShifts.length} {filteredShifts.length === 1 ? "shift" : "shifts"} available
          </p>
        </div>
      </div>

      {/* Shifts Grid */}
      {loadingShifts || loadingApplications ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg hidden sm:block" />
          <Skeleton className="h-52 w-full rounded-lg hidden sm:block" />
          <Skeleton className="h-52 w-full rounded-lg hidden lg:block" />
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-base">No open shifts right now</p>
          <p className="text-sm text-muted-foreground mt-1">
            {hideClaimedShifts ? "Try turning off the \"Hide claimed shifts\" filter" : "Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShifts.map((shift) => {
            const facility = getFacilityData(shift.facilityProfileId);
            const duration = getShiftDuration(shift.startDateTime, shift.endDateTime);
            const app = applicationMap.get(shift.id || "");
            const appStatus: ApplicationStatusType = (app?.status as ApplicationStatusType) || "none";
            const shiftOrientationStatus = getOrientationStatus(shift, orientedFacilitySet);
            const shiftOrientationRequestStatus = getOrientationRequestStatus(
              staffOrientations || [],
              shift.facilityProfileId || ""
            );

            return (
              <AvailableShiftCard
                key={shift.id}
                facilityName={facility?.name || "Unknown Facility"}
                facilityCity={facility?.city}
                startDateTime={shift.startDateTime}
                endDateTime={shift.endDateTime}
                duration={duration}
                requiredRole={shift.requiredRole}
                isShortNotice={shift.isShortNotice}
                isComplianceCompliant={staffProfile.complianceStatus === "compliant"}
                roleBadgeColor={getRoleBadgeColor(shift.requiredRole)}
                filledCount={shift.filledCount}
                headcount={shift.headcount}
                applicationStatus={appStatus}
                appliedAt={app?.appliedAt}
                isShiftOpen={shift.status === "open"}
                isFavorite={favoriteFacilityIds.has(shift.facilityProfileId || "")}
                orientationStatus={shiftOrientationStatus}
                orientationRequestStatus={shiftOrientationRequestStatus}
                shiftStaffRate={shift.shiftStaffRate}
                onClick={() => handleOpenShiftModal(shift)}
                onApplyAgain={(e) => handleClaimAgain(shift.id || "", e)}
              />
            );
          })}
        </div>
      )}

        </TabsContent>

        <TabsContent value="trades" className="mt-4">
          <ShiftTradesTab />
        </TabsContent>
      </Tabs>

      {/* Bottom Sheet Modal */}
      <Sheet open={showShiftModal} onOpenChange={setShowShiftModal}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold">
              {selectedFacility?.name || "Shift Details"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Full details for the selected shift
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {selectedFacility && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFacility.address && `${selectedFacility.address}, `}
                      {selectedFacility.city}
                      {selectedFacility.province && `, ${selectedFacility.province}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedShift?.startDateTime && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedShift.startDateTime), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedShift?.startDateTime && selectedShift?.endDateTime && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedShift.startDateTime), "h:mm a")} -{" "}
                      {format(parseISO(selectedShift.endDateTime), "h:mm a")}{" "}
                      <span className="text-muted-foreground/70">({selectedShiftDuration} hours)</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedShift?.requiredRole && (
                <Badge className={getRoleBadgeColor(selectedShift.requiredRole)}>
                  {selectedShift.requiredRole}
                </Badge>
              )}
              {selectedShift?.isShortNotice && (
                <Badge className="bg-chart-3/20 text-chart-3">
                  <Zap className="w-3 h-3 mr-1" />
                  Short Notice
                </Badge>
              )}
              {selectedOrientationStatus === "required_and_oriented" && (
                <Badge className="bg-accent/20 text-accent">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Oriented
                </Badge>
              )}
              {selectedOrientationStatus === "required_not_oriented" && (
                <Badge className="bg-chart-3/20 text-chart-3">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  Orientation Required
                </Badge>
              )}
              {isShiftFullyBooked && selectedAppStatus === "none" && (
                <Badge className="bg-destructive/15 text-destructive">
                  <Ban className="w-3 h-3 mr-1" />
                  Full
                </Badge>
              )}
            </div>

            {/* Pay Rate Display */}
            {selectedShift?.shiftStaffRate != null && selectedShift.shiftStaffRate > 0 && (
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your Pay Rate</p>
                    <p className="text-2xl font-bold text-accent">${selectedShift.shiftStaffRate.toFixed(2)}/hr</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preferred Worker Badge in Sheet */}
            {selectedShift?.facilityProfileId && favoriteFacilityIds.has(selectedShift.facilityProfileId) && (
              <Badge className="bg-chart-3/15 text-chart-3 border border-chart-3/30 shadow-sm gap-1 w-fit">
                <Star className="h-3 w-3 fill-chart-3" />
                Preferred Worker
              </Badge>
            )}

            {/* Filled slots indicator */}
            {selectedShiftShowFilled && selectedShift && (
              <div className="flex items-center gap-2">
                <Users className={cn(
                  "w-4 h-4 shrink-0",
                  isShiftFullyBooked ? "text-accent" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isShiftFullyBooked ? "text-accent" : "text-muted-foreground"
                )}>
                  {selectedShift.filledCount || 0}/{selectedShift.headcount} filled
                </span>
              </div>
            )}

            {/* Dynamic Orientation Status */}
            {selectedOrientationStatus === "not_required" && (
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent">No Orientation Required</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      All compliant staff can claim this shift — no facility orientation needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {selectedOrientationStatus === "required_and_oriented" && (
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5 text-accent" />
                    <CheckCircle className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent">Orientation Required — You're Cleared ✓</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      You have a completed orientation at this facility and can claim this shift.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {selectedOrientationStatus === "required_not_oriented" && (
              <div className="rounded-lg bg-chart-3/10 border border-chart-3/20 p-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-chart-3 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-chart-3">Orientation Required</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      You need to complete a facility orientation before claiming this shift.
                    </p>
                    {selectedShift?.orientationNotes && (
                      <p className="text-sm text-muted-foreground mt-1.5">
                        <span className="font-medium">Note:</span> {selectedShift.orientationNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedShift?.notes && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Shift Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedShift.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && errorMessage !== "orientation_required" && errorReasons.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">{errorMessage}</p>
                  <ul className="space-y-1">
                    {errorReasons.map((reason, index) => (
                      <li key={index} className="text-sm">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Modal footer adapts based on application status */}
          <div className="mt-8 space-y-3 pb-6">
            {selectedAppStatus === "approved" ? (
              <>
                <Badge className="w-full h-14 flex items-center justify-center gap-2 bg-accent/20 text-accent text-lg">
                  <CheckCircle className="w-6 h-6" />
                  Claimed ✓
                </Badge>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  asChild
                >
                  <Link to={getPageUrl(StaffMyShiftsPage)}>View My Shifts</Link>
                </Button>
              </>
            ) : selectedAppStatus === "rejected" ? (
              <>
                <Badge className="w-full h-14 flex items-center justify-center gap-2 bg-destructive/20 text-destructive text-lg">
                  <XCircle className="w-6 h-6" />
                  Not Selected
                </Badge>
                {selectedShift?.status === "open" && (
                  <Button
                    className="w-full h-12 text-base"
                    variant="outline"
                    onClick={(e) => handleClaimAgain(selectedShift?.id || "", e)}
                    disabled={applyingAgain}
                  >
                    {applyingAgain ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      "Claim Again"
                    )}
                  </Button>
                )}
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            ) : selectedAppStatus === "withdrawn" || selectedAppStatus === "withdrawal_pending" ? (
              <>
                <Badge className="w-full h-14 flex items-center justify-center gap-2 bg-muted text-muted-foreground text-lg">
                  <X className="w-6 h-6" />
                  Withdrawn
                </Badge>
                {selectedShift?.status === "open" && (
                  <Button
                    className="w-full h-12 text-base"
                    variant="outline"
                    onClick={(e) => handleClaimAgain(selectedShift?.id || "", e)}
                    disabled={applyingAgain}
                  >
                    {applyingAgain ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      "Claim Again"
                    )}
                  </Button>
                )}
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            ) : isShiftFullyBooked ? (
              <>
                <Badge className="w-full h-14 flex items-center justify-center gap-2 bg-muted text-muted-foreground text-lg">
                  <Ban className="w-6 h-6" />
                  Fully Booked
                </Badge>
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            ) : isOrientationBlocked ? (
              <>
                <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-6 h-6 text-chart-3 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-chart-3">This shift requires facility orientation</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You need to complete an orientation at this facility before you can claim this shift.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={handleRequestOrientation}
                  disabled={isRequestingOrientation}
                >
                  {isRequestingOrientation ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    "Request Orientation"
                  )}
                </Button>
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <Button
                  className="w-full h-14 text-lg"
                  size="lg"
                  onClick={handleClaimShift}
                  disabled={
                    checkingEligibility ||
                    creatingApplication ||
                    staffProfile.complianceStatus !== "compliant"
                  }
                >
                  {checkingEligibility || creatingApplication ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "Claim This Shift"
                  )}
                </Button>
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}