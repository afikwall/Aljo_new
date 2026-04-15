import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useUser, useEntityGetAll, useEntityCreate, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Link, useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  StaffProfilesEntity,
  ShiftApplicationsEntity,
  ShiftsEntity,
  FacilitiesEntity,
  TimeLogsEntity,
  ShiftTradesEntity,
  OrientationsEntity,
  StaffRatesEntity,
  AppSettingsEntity,
  LoginPage,
  StaffAvailableShiftsPage,
} from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  Zap,
  Info,
  FileText,
  History,
  UserCheck,
  GraduationCap,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, parseISO, subMinutes, addMinutes, differenceInHours, differenceInMinutes, addDays, isWithinInterval } from "date-fns";
import { getPageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { calculateHaversineDistance } from "@/utils/GeofenceUtils";
import { calculateNetHours, calculateBreak, getShiftDurationHours } from "@/utils/shiftUtils";
import { ClockOutGeofenceWarningDialog } from "@/components/ClockOutGeofenceWarningDialog";
import { UpcomingShiftCard } from "@/components/UpcomingShiftCard";
import { HistoryShiftCard } from "@/components/HistoryShiftCard";
import { FindCoverageSheet } from "@/components/FindCoverageSheet";
import { InProgressShiftBanner } from "@/components/InProgressShiftBanner";
import { LiveShiftTimer } from "@/components/LiveShiftTimer";
import { BreakDeductionInfo } from "@/components/BreakDeductionInfo";
import {
  getClockInWindowInfo,
  needsAutoClockOut,
  isLateClockOut,
  LATE_CLOCK_IN_THRESHOLD_MINUTES,
  LATE_CLOCK_OUT_THRESHOLD_MINUTES,
} from "@/utils/clockInOutUtils";
import { getOrientationToComplete } from "@/utils/orientationCompleteUtils";
import { PayPeriodShiftCard } from "@/components/PayPeriodShiftCard";
import {
  getCurrentPayPeriod,
  getPayPeriodLabel,
  getPayPeriodNumber,
} from "@/utils/reportUtils";
import { buildRateKey } from "@/utils/reportUtils";

export default function StaffMyShiftsPage() {
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
  const staffProfileId = staffProfile?.id;

  // Fetch ALL applications for this staff member (no status filter)
  const { data: allApplications, isLoading: loadingApplications, refetch: refetchAllApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    { staffProfileId: staffProfileId },
    {
      enabled: !!staffProfileId,
      refetchOnWindowFocus: true,
    }
  );

  const { data: allShifts, isLoading: loadingShifts, refetch: refetchShifts } = useEntityGetAll(ShiftsEntity);
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);
  const { data: timeLogs, refetch: refetchTimeLogs } = useEntityGetAll(TimeLogsEntity);
  const { data: staffRates } = useEntityGetAll(StaffRatesEntity);
  const { data: appSettings } = useEntityGetAll(AppSettingsEntity);

  // Fetch orientation records for auto-complete on clock-out
  const { data: allOrientations, refetch: refetchOrientations } = useEntityGetAll(
    OrientationsEntity,
    { staffProfileId: staffProfileId },
    { enabled: !!staffProfileId }
  );
  const { updateFunction: updateOrientation } = useEntityUpdate(OrientationsEntity);
  const { updateFunction: updateStaffProfile } = useEntityUpdate(StaffProfilesEntity);

  // Geotracking setting
  const geotrackingEnabled = useMemo(() => {
    const geotrackingSetting = appSettings?.find((s) => s.settingKey === "geotrackingEnabled");
    return geotrackingSetting?.settingValue ?? true;
  }, [appSettings]);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [showGrossPay, setShowGrossPay] = useState(false);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<typeof ShiftsEntity['instanceType'] | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawingShift, setWithdrawingShift] = useState<typeof ShiftsEntity['instanceType'] | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawInformedFacility, setWithdrawInformedFacility] = useState(false);
  const [withdrawInformedALJO, setWithdrawInformedALJO] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [modalShift, setModalShift] = useState<typeof ShiftsEntity['instanceType'] | null>(null);
  const [modalTimeLog, setModalTimeLog] = useState<typeof TimeLogsEntity['instanceType'] | null>(null);
  const [modalApplication, setModalApplication] = useState<typeof ShiftApplicationsEntity['instanceType'] | null>(null);
  const [modalType, setModalType] = useState<"upcoming" | "in-progress" | "completed" | "withdrawal_pending" | "history">("upcoming");
  const [showClockOutGeofenceWarning, setShowClockOutGeofenceWarning] = useState(false);
  const [pendingClockOutPosition, setPendingClockOutPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [clockOutGeofenceDistance, setClockOutGeofenceDistance] = useState(0);
  const [showFindCoverageSheet, setShowFindCoverageSheet] = useState(false);
  const [findCoverageShift, setFindCoverageShift] = useState<typeof ShiftsEntity['instanceType'] | null>(null);
  const [submittingTrade, setSubmittingTrade] = useState(false);

  const [showGPSPermissionDialog, setShowGPSPermissionDialog] = useState(false);
  const [gpsPermissionAction, setGpsPermissionAction] = useState<"clockIn" | "clockOut">("clockIn");
  const [gpsPendingShift, setGpsPendingShift] = useState<typeof ShiftsEntity['instanceType'] | null>(null);

  const shouldBypassGPS = (facility: any, geoEnabled: boolean) => {
    if (!geoEnabled) return true;
    if (!facility) return true;
    if ((!facility.latitude && facility.latitude !== 0) && (!facility.longitude && facility.longitude !== 0)) return true;
    if (facility.latitude === 0 && facility.longitude === 0) return true;
    if (facility.geofenceMode === "off") return true;
    return false;
  };

  const resetWithdrawForm = useCallback(() => {
    setWithdrawReason("");
    setWithdrawInformedFacility(false);
    setWithdrawInformedALJO(false);
  }, []);

  // Track auto-clock-out processing to prevent duplicates
  const autoClockOutProcessed = useRef(new Set<string>());

  // Fetch shift trades for this user
  const { data: myTrades, refetch: refetchTrades } = useEntityGetAll(
    ShiftTradesEntity,
    { originalStaffEmail: user.email },
    { enabled: !!user.email }
  );
  const { createFunction: createTrade } = useEntityCreate(ShiftTradesEntity);

  // Map of shiftId -> true if there's an open/pending trade request
  const shiftTradeRequestMap = useMemo(() => {
    const map = new Set<string>();
    myTrades?.forEach((trade) => {
      if (
        trade.originalShiftId &&
        (trade.status === "open" || trade.status === "pending")
      ) {
        map.add(trade.originalShiftId);
      }
    });
    return map;
  }, [myTrades]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { createFunction: createTimeLog } = useEntityCreate(TimeLogsEntity);
  const { updateFunction: updateTimeLog } = useEntityUpdate(TimeLogsEntity);
  const { updateFunction: updateShift } = useEntityUpdate(ShiftsEntity);
  const { updateFunction: updateShiftApplication } = useEntityUpdate(ShiftApplicationsEntity);

  // Derived data from all applications
  const approvedApplications = useMemo(
    () => allApplications?.filter((app) => app.status === "approved") || [],
    [allApplications]
  );

  const withdrawalPendingApplications = useMemo(
    () => allApplications?.filter((app) => app.status === "withdrawal_pending") || [],
    [allApplications]
  );

  const approvedShiftIds = useMemo(() => {
    const ids = approvedApplications.map((app) => app.shiftProfileId) || [];
    const wpIds = withdrawalPendingApplications.map((app) => app.shiftProfileId) || [];
    return [...ids, ...wpIds];
  }, [approvedApplications, withdrawalPendingApplications]);

  const withdrawalPendingShiftIds = useMemo(
    () => new Set(withdrawalPendingApplications.map((app) => app.shiftProfileId) || []),
    [withdrawalPendingApplications]
  );

  // Set of shift IDs that are privately assigned to this staff member
  const assignedShiftIds = useMemo(() => {
    if (!allShifts || !staffProfileId) return new Set<string>();
    const ids = new Set<string>();
    allShifts.forEach((shift) => {
      if (
        shift.assignedStaffId === staffProfileId &&
        shift.status === "assigned" &&
        shift.id
      ) {
        ids.add(shift.id);
      }
    });
    return ids;
  }, [allShifts, staffProfileId]);

  const upcomingShifts = useMemo(() => {
    if (!allShifts) return [];
    const now = new Date();
    const seenIds = new Set<string>();

    return allShifts
      .filter((shift) => {
        if (!shift.id || !shift.startDateTime) return false;
        // Deduplicate
        if (seenIds.has(shift.id)) return false;

        // Source 1: existing approved applications (open/claimed/in_progress)
        const isApproved = approvedShiftIds.includes(shift.id) &&
          (shift.status === "open" || shift.status === "claimed" || shift.status === "in_progress");

        // Source 2: privately assigned shifts (status = "assigned", assignedStaffId = me)
        const isAssigned = assignedShiftIds.has(shift.id);

        if (!isApproved && !isAssigned) return false;

        try {
          const startTime = parseISO(shift.startDateTime);
          const lateThreshold = addMinutes(startTime, LATE_CLOCK_IN_THRESHOLD_MINUTES);
          if (now >= lateThreshold) return false;
        } catch {
          return false;
        }

        seenIds.add(shift.id);
        return true;
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.startDateTime || "");
          const dateB = parseISO(b.startDateTime || "");
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      });
  }, [allShifts, approvedShiftIds, assignedShiftIds]);

  const inProgressShift = useMemo(() => {
    if (!allShifts) return null;
    return allShifts.find((shift) => {
      if (shift.status !== "in_progress") return false;
      // Either via approved application or via assigned staff
      return approvedShiftIds.includes(shift.id) || assignedShiftIds.has(shift.id || "");
    });
  }, [allShifts, approvedShiftIds, assignedShiftIds]);

  // History: all past/completed/rejected/withdrawn applications
  const historyItems = useMemo(() => {
    if (!allApplications || !allShifts) return [];
    const now = new Date();

    return allApplications
      .map((application) => {
        const shift = allShifts.find((s) => s.id === application.shiftProfileId);
        if (!shift) return null;

        const timeLog = timeLogs?.find((log) => log.shiftProfileId === shift.id && log.staffProfileId === staffProfileId);

        // Determine history status
        let historyStatus: "completed" | "rejected" | "withdrawn" | "withdrawal_pending" | "expired" | null = null;

        if (shift.status === "completed" && application.status === "approved") {
          historyStatus = "completed";
        } else if (application.status === "rejected") {
          historyStatus = "rejected";
        } else if (application.status === "withdrawn") {
          historyStatus = "withdrawn";
        } else if (application.status === "withdrawal_pending") {
          historyStatus = "withdrawal_pending";
        } else if (
          application.status === "approved" &&
          shift.startDateTime &&
          parseISO(shift.startDateTime) < now &&
          shift.status !== "in_progress" &&
          shift.status !== "completed"
        ) {
          // Also consider past_window shifts as expired
          if (shift.startDateTime) {
            const windowInfo = getClockInWindowInfo(shift.startDateTime, now);
            if (windowInfo.state === "past_window") {
              historyStatus = "expired";
            }
          }
        }

        if (!historyStatus) return null;

        return { shift, application, timeLog: timeLog || null, historyStatus };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        try {
          const dateA = a.shift.startDateTime ? parseISO(a.shift.startDateTime).getTime() : 0;
          const dateB = b.shift.startDateTime ? parseISO(b.shift.startDateTime).getTime() : 0;
          return dateB - dateA;
        } catch {
          return 0;
        }
      });
  }, [allApplications, allShifts, timeLogs, staffProfileId]);

  const activeTimeLog = useMemo(() => {
    if (!inProgressShift || !timeLogs) return null;
    return timeLogs.find((log) => log.shiftProfileId === inProgressShift.id && !log.clockOutTime);
  }, [inProgressShift, timeLogs]);

  // ── Pay Period Calculations ──
  const currentPayPeriod = useMemo(() => getCurrentPayPeriod(), []);

  const payPeriodShifts = useMemo(() => {
    if (!allShifts || !allApplications || !staffProfileId) return [];
    const { start, end } = currentPayPeriod;
    const approvedAppShiftIds = new Set(
      allApplications
        .filter((app) => app.status === "approved" && app.staffProfileId === staffProfileId)
        .map((app) => app.shiftProfileId)
    );
    const validStatuses = new Set(["completed", "in_progress", "claimed", "assigned"]);

    return allShifts.filter((shift) => {
      if (!shift.startDateTime || !shift.id) return false;
      if (!validStatuses.has(shift.status || "")) return false;
      const isApproved = approvedAppShiftIds.has(shift.id);
      const isPrivatelyAssigned = shift.assignedStaffId === staffProfileId;
      if (!isApproved && !isPrivatelyAssigned) return false;
      try {
        const shiftStart = parseISO(shift.startDateTime);
        return isWithinInterval(shiftStart, { start, end });
      } catch {
        return false;
      }
    });
  }, [allShifts, allApplications, staffProfileId, currentPayPeriod]);

  const week1Shifts = useMemo(() => {
    const w1End = addDays(currentPayPeriod.start, 6);
    w1End.setHours(23, 59, 59, 999);
    return payPeriodShifts
      .filter((shift) => {
        try {
          const d = parseISO(shift.startDateTime!);
          return isWithinInterval(d, { start: currentPayPeriod.start, end: w1End });
        } catch { return false; }
      })
      .sort((a, b) => {
        try {
          return parseISO(a.startDateTime!).getTime() - parseISO(b.startDateTime!).getTime();
        } catch { return 0; }
      });
  }, [payPeriodShifts, currentPayPeriod]);

  const week2Shifts = useMemo(() => {
    const w2Start = addDays(currentPayPeriod.start, 7);
    return payPeriodShifts
      .filter((shift) => {
        try {
          const d = parseISO(shift.startDateTime!);
          return isWithinInterval(d, { start: w2Start, end: currentPayPeriod.end });
        } catch { return false; }
      })
      .sort((a, b) => {
        try {
          return parseISO(a.startDateTime!).getTime() - parseISO(b.startDateTime!).getTime();
        } catch { return 0; }
      });
  }, [payPeriodShifts, currentPayPeriod]);

  const shiftCount = useMemo(() => payPeriodShifts.length, [payPeriodShifts]);

  const totalHoursWorked = useMemo(() => {
    if (!timeLogs || !staffProfileId) return 0;
    return payPeriodShifts
      .filter((s) => s.status === "completed")
      .reduce((sum, shift) => {
        const log = timeLogs.find(
          (l) => l.shiftProfileId === shift.id && l.staffProfileId === staffProfileId
        );
        return sum + (log?.totalHours || 0);
      }, 0);
  }, [payPeriodShifts, timeLogs, staffProfileId]);

  const staffRateMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!staffRates) return map;
    staffRates.forEach((rate) => {
      if (rate.facilityProfileId && rate.roleType) {
        map.set(buildRateKey(rate.facilityProfileId, rate.roleType), rate.staffRate || 0);
      }
    });
    return map;
  }, [staffRates]);

  const estimatedGross = useMemo(() => {
    if (!timeLogs || !staffProfileId || !staffProfile?.roleType) return null;
    let gross = 0;
    let hasAnyRate = false;
    payPeriodShifts
      .filter((s) => s.status === "completed")
      .forEach((shift) => {
        if (!shift.facilityProfileId || !staffProfile?.roleType) return;
        const rateKey = buildRateKey(shift.facilityProfileId, staffProfile.roleType);
        const rate = staffRateMap.get(rateKey);
        if (rate === undefined) return;
        const log = timeLogs.find(
          (l) => l.shiftProfileId === shift.id && l.staffProfileId === staffProfileId
        );
        if (!log?.totalHours) return;
        hasAnyRate = true;
        gross += log.totalHours * rate;
      });
    return hasAnyRate || gross > 0 ? gross : null;
  }, [payPeriodShifts, timeLogs, staffProfileId, staffProfile, staffRateMap]);

  // ── Auto-Clock-Out on page load ──
  useEffect(() => {
    if (!allShifts || !timeLogs || !staffProfileId) return;

    const processAutoClockOut = async () => {
      const now = new Date();

      for (const shift of allShifts) {
        if (shift.status !== "in_progress") continue;
        if (!approvedShiftIds.includes(shift.id) && !assignedShiftIds.has(shift.id || "")) continue;
        if (!shift.endDateTime) continue;

        // Find active time log for this shift
        const activeLog = timeLogs.find(
          (log) => log.shiftProfileId === shift.id && log.staffProfileId === staffProfileId && !log.clockOutTime
        );
        if (!activeLog) continue;

        // Skip if already processed
        if (autoClockOutProcessed.current.has(activeLog.id || "")) continue;

        // Check if needs auto-clock-out (2+ hours past shift end)
        if (!needsAutoClockOut(shift.endDateTime, now)) continue;

        // Mark as processed immediately to prevent duplicates
        autoClockOutProcessed.current.add(activeLog.id || "");

        try {
          const clockInTime = activeLog.clockInTime || now.toISOString();
          const { breakMinutes, netHours } = calculateNetHours(clockInTime, shift.endDateTime);
          const scheduledHours = getShiftDurationHours(shift.startDateTime, shift.endDateTime);

          await updateTimeLog({
            id: activeLog.id || "",
            data: {
              clockOutTime: shift.endDateTime,
              autoClockOut: true,
              scheduledHours: scheduledHours,
              totalHours: Math.round(netHours * 100) / 100,
              breakMinutes: breakMinutes,
            },
          });

          await updateShift({
            id: shift.id || "",
            data: { status: "completed" },
          });

          // Auto-complete orientation if this was an orientation shift
          const orientationToComplete = getOrientationToComplete(
            shift.id || "",
            allOrientations || []
          );
          if (orientationToComplete) {
            try {
              await updateOrientation({
                id: orientationToComplete.orientationId,
                data: {
                  status: "completed",
                  completedAt: shift.endDateTime,
                },
              });

              if (staffProfile && orientationToComplete.facilityId) {
                const existingIds = staffProfile.orientedFacilityIds || [];
                if (!existingIds.includes(orientationToComplete.facilityId)) {
                  await updateStaffProfile({
                    id: staffProfile.id || "",
                    data: {
                      orientedFacilityIds: [...existingIds, orientationToComplete.facilityId],
                    },
                  });
                }
              }

              await refetchOrientations();
              toast.success("Orientation completed! You can now claim shifts at this facility.", {
                duration: 7000,
              });
            } catch {
              // Non-blocking
            }
          }

          toast.info(
            "Your shift was auto-clocked out because no clock-out was recorded within 2 hours after the shift ended. Clock-out time was set to the scheduled shift end.",
            { duration: 10000 }
          );

          await refetchShifts();
          await refetchTimeLogs();
        } catch {
          // Remove from processed so it can be retried
          autoClockOutProcessed.current.delete(activeLog.id || "");
        }
      }
    };

    processAutoClockOut();
  }, [allShifts, timeLogs, staffProfileId, approvedShiftIds, assignedShiftIds, updateTimeLog, updateShift, refetchShifts, refetchTimeLogs]);

  const getFacility = useCallback((facilityId?: string) => {
    if (!facilityId || !facilities) return null;
    return facilities.find((f) => f.id === facilityId);
  }, [facilities]);

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

  const getRoleBadgeColor = useCallback((role?: string) => {
    if (role === "RN") return "bg-chart-1/20 text-chart-1";
    if (role === "LPN") return "bg-chart-2/20 text-chart-2";
    if (role === "CCA") return "bg-chart-3/20 text-chart-3";
    if (role === "CITR") return "bg-chart-4/20 text-chart-4";
    return "bg-muted text-muted-foreground";
  }, []);

  const canClockIn = useCallback((shiftStartDateTime?: string) => {
    if (!shiftStartDateTime) return false;
    try {
      const windowInfo = getClockInWindowInfo(shiftStartDateTime, new Date());
      return windowInfo.canClockIn;
    } catch {
      return false;
    }
  }, []);

  const canWithdraw = useCallback((shiftStartDateTime?: string) => {
    if (!shiftStartDateTime) return false;
    try {
      const now = new Date();
      const shiftStart = parseISO(shiftStartDateTime);
      const hoursUntilShift = differenceInHours(shiftStart, now);
      return hoursUntilShift > 6;
    } catch {
      return false;
    }
  }, []);

  const getClockInOpenTime = useCallback((shiftStartDateTime?: string) => {
    if (!shiftStartDateTime) return "";
    try {
      const shiftStart = parseISO(shiftStartDateTime);
      const clockInWindow = subMinutes(shiftStart, 15);
      return format(clockInWindow, "h:mm a");
    } catch {
      return "";
    }
  }, []);

  const handleOpenShiftModal = useCallback((
    shift: typeof ShiftsEntity['instanceType'],
    timeLog?: typeof TimeLogsEntity['instanceType'],
    application?: typeof ShiftApplicationsEntity['instanceType'],
    type?: "upcoming" | "in-progress" | "completed" | "withdrawal_pending" | "history"
  ) => {
    setModalShift(shift);
    setModalTimeLog(timeLog || null);
    setModalApplication(application || null);
    setModalType(type || "upcoming");
    setShowShiftModal(true);
  }, []);

  const handleCloseShiftModal = useCallback(() => {
    setShowShiftModal(false);
  }, []);

  const handleClockIn = async (shift: typeof ShiftsEntity['instanceType']) => {
    if (!staffProfileId) return;

    if (shift.startDateTime) {
      try {
        const now = new Date();
        const windowInfo = getClockInWindowInfo(shift.startDateTime, now);

        if (windowInfo.state === "past_window") {
          toast.error(
            `You are more than ${LATE_CLOCK_IN_THRESHOLD_MINUTES} minutes late. Clock-in is not allowed. Please contact your manager.`,
            { duration: 7000 }
          );
          return;
        }

        if (windowInfo.state === "before_window") {
          toast.error("Clock-in window has not opened yet. Please wait.", { duration: 5000 });
          return;
        }
      } catch {
        // proceed
      }
    }

    setClockingIn(true);
    setSelectedShift(shift);

    try {
      const facility = getFacility(shift.facilityProfileId);

      // Check if GPS should be bypassed
      if (shouldBypassGPS(facility, geotrackingEnabled)) {
        // Bypass GPS - clock in immediately without location check
        let isLateBlocked = false;
        if (shift.startDateTime) {
          const windowInfo = getClockInWindowInfo(shift.startDateTime, new Date());
          isLateBlocked = windowInfo.isLateButAllowed;
        }

        const now = new Date().toISOString();
        const timeLogData: Record<string, unknown> = {
          clockInTime: now,
          clockInLat: null,
          clockInLng: null,
          geofenceStatus: "within",
          shiftProfileId: shift.id,
          staffProfileId: staffProfileId,
          facilityProfileId: shift.facilityProfileId,
        };

        if (isLateBlocked) {
          timeLogData.isLateBlocked = true;
        }

        await createTimeLog({ data: timeLogData });

        await updateShift({
          id: shift.id || "",
          data: { status: "in_progress" },
        });

        toast.success("You're clocked in!");
        await refetchShifts();
        await refetchTimeLogs();
        setShowShiftModal(false);
        setActiveTab("in-progress");
        return;
      }

      // Geotracking enabled - proceed with GPS flow
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const staffLat = position.coords.latitude;
      const staffLng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      const geofenceRadius = facility?.geofenceRadius || 200;
      const geofenceMode = facility?.geofenceMode || "flag";
      const distance = calculateHaversineDistance(staffLat, staffLng, facility!.latitude!, facility!.longitude!);

      let geofenceStatus: "within" | "outside_flagged" | "outside_blocked";

      // GPS accuracy check
      if (accuracy > geofenceRadius) {
        toast.warning(
          `GPS accuracy is ${Math.round(accuracy)}m, which exceeds the geofence radius. Location recorded but may be inaccurate.`,
          { duration: 5000 }
        );
        geofenceStatus = "outside_flagged";
      } else if (distance <= geofenceRadius) {
        geofenceStatus = "within";
      } else if (geofenceMode === "flag") {
        geofenceStatus = "outside_flagged";
        toast.warning(
          `You are ${Math.round(distance)}m from the facility. This has been noted.`,
          { duration: 5000 }
        );
      } else {
        geofenceStatus = "outside_blocked";
        toast.error(
          `You are ${Math.round(distance)}m from the facility. Please move within ${geofenceRadius}m to clock in.`,
          { duration: 7000 }
        );
        setClockingIn(false);
        return;
      }

      // Determine if late clock-in (within window but past shift start)
      let isLateBlocked = false;
      if (shift.startDateTime) {
        const windowInfo = getClockInWindowInfo(shift.startDateTime, new Date());
        isLateBlocked = windowInfo.isLateButAllowed;
      }

      const now = new Date().toISOString();
      const timeLogData: Record<string, unknown> = {
        clockInTime: now,
        clockInLat: staffLat,
        clockInLng: staffLng,
        geofenceStatus: geofenceStatus,
        shiftProfileId: shift.id,
        staffProfileId: staffProfileId,
        facilityProfileId: shift.facilityProfileId,
      };

      if (isLateBlocked) {
        timeLogData.isLateBlocked = true;
      }

      await createTimeLog({ data: timeLogData });

      await updateShift({
        id: shift.id || "",
        data: { status: "in_progress" },
      });

      toast.success("You're clocked in!");
      await refetchShifts();
      await refetchTimeLogs();
      setShowShiftModal(false);
      setActiveTab("in-progress");
    } catch (error: any) {
      if (error?.code === 1) {
        // GPS permission denied - show dialog
        setGpsPendingShift(shift);
        setGpsPermissionAction("clockIn");
        setShowGPSPermissionDialog(true);
      } else if (error?.code === 2) {
        toast.error("Unable to determine your location. Please try again.");
      } else if (error?.code === 3) {
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Failed to clock in. Please try again.");
      }
    } finally {
      setClockingIn(false);
      setSelectedShift(null);
    }
  };

  const executeClockOut = async (lat: number | null, lng: number | null, outsideGeofence: boolean) => {
    if (!inProgressShift || !activeTimeLog || !staffProfileId) return;

    setClockingOut(true);

    try {
      const now = new Date();
      const nowISO = now.toISOString();
      const clockInTime = activeTimeLog.clockInTime || nowISO;
      const { grossHours, breakMinutes, netHours } = calculateNetHours(clockInTime, nowISO);

      // Calculate scheduled hours
      const scheduledHours = getShiftDurationHours(
        inProgressShift.startDateTime,
        inProgressShift.endDateTime
      );

      // Cap total hours at scheduled duration (no overtime)
      let finalTotalHours = Math.round(netHours * 100) / 100;
      let overtimeFlagged = false;

      if (scheduledHours > 0 && netHours > scheduledHours) {
        finalTotalHours = Math.round(scheduledHours * 100) / 100;
        overtimeFlagged = true;
      }

      // Check late clock-out (more than 30 min after shift end)
      let lateClockOutFlagged = false;
      if (inProgressShift.endDateTime) {
        lateClockOutFlagged = isLateClockOut(inProgressShift.endDateTime, now);
      }

      const updateData: Record<string, unknown> = {
        clockOutTime: nowISO,
        clockOutLat: lat,
        clockOutLng: lng,
        breakMinutes: breakMinutes,
        totalHours: finalTotalHours,
        scheduledHours: scheduledHours,
      };

      if (outsideGeofence) {
        updateData.clockOutOutsideGeofence = true;
      }

      if (overtimeFlagged) {
        updateData.overtimeFlagged = true;
      }

      if (lateClockOutFlagged) {
        updateData.lateClockOutFlagged = true;
      }

      await updateTimeLog({
        id: activeTimeLog.id || "",
        data: updateData,
      });

      await refetchTimeLogs();

      await updateShift({
        id: inProgressShift.id || "",
        data: { status: "completed" },
      });

      // Auto-complete orientation if this was an orientation shift
      const orientationToComplete = getOrientationToComplete(
        inProgressShift.id || "",
        allOrientations || []
      );
      if (orientationToComplete) {
        try {
          await updateOrientation({
            id: orientationToComplete.orientationId,
            data: {
              status: "completed",
              completedAt: nowISO,
            },
          });

          // Update staff profile's orientedFacilityIds
          if (staffProfile && orientationToComplete.facilityId) {
            const existingIds = staffProfile.orientedFacilityIds || [];
            if (!existingIds.includes(orientationToComplete.facilityId)) {
              await updateStaffProfile({
                id: staffProfile.id || "",
                data: {
                  orientedFacilityIds: [...existingIds, orientationToComplete.facilityId],
                },
              });
            }
          }

          await refetchOrientations();
          toast.success("Orientation completed! You can now claim shifts at this facility.", {
            duration: 7000,
          });
        } catch {
          // Non-blocking: orientation completion failure shouldn't block clock-out
          toast.error("Shift completed, but orientation record update failed. Please contact support.");
        }
      }

      await refetchShifts();
      await refetchTimeLogs();

      // Show late clock-out warning
      if (lateClockOutFlagged) {
        toast.warning(
          "Your clock-out is more than 30 minutes after your scheduled shift end. This has been flagged for review.",
          { duration: 7000 }
        );
      }

      // Show overtime cap info
      if (overtimeFlagged) {
        toast.info(
          `Your hours have been capped at the scheduled shift duration (${scheduledHours.toFixed(1)}h). Overtime is not paid.`,
          { duration: 7000 }
        );
      }

      // Show summary toast
      toast.success(
        `Shift Complete! Gross: ${grossHours.toFixed(1)}h, Break: ${breakMinutes}min, Net: ${finalTotalHours.toFixed(1)}h`,
        { duration: 7000 }
      );

      setActiveTab("history");
    } catch {
      toast.error("Failed to clock out. Please try again.");
    } finally {
      setClockingOut(false);
    }
  };

  const handleClockOut = async () => {
    if (!inProgressShift || !activeTimeLog || !staffProfileId) return;

    setShowClockOutDialog(false);
    setShowShiftModal(false);
    setClockingOut(true);

    // Check if GPS should be bypassed for clock-out
    const facility = getFacility(inProgressShift.facilityProfileId);
    if (shouldBypassGPS(facility, geotrackingEnabled)) {
      setClockingOut(false);
      await executeClockOut(null, null, false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const staffLat = position.coords.latitude;
      const staffLng = position.coords.longitude;

      if (facility && facility.latitude && facility.longitude) {
        const geofenceRadius = facility.geofenceRadius || 200;
        const distance = calculateHaversineDistance(staffLat, staffLng, facility.latitude, facility.longitude);

        if (distance > geofenceRadius) {
          setClockingOut(false);
          setPendingClockOutPosition({ lat: staffLat, lng: staffLng });
          setClockOutGeofenceDistance(distance);
          setShowClockOutGeofenceWarning(true);
          return;
        }
      }

      setClockingOut(false);
      await executeClockOut(staffLat, staffLng, false);
    } catch (error: any) {
      if (error?.code === 1) {
        // GPS permission denied - show dialog, never block clock-out
        setGpsPermissionAction("clockOut");
        setShowGPSPermissionDialog(true);
      } else if (error?.code === 2) {
        toast.error("Unable to determine your location. Please try again.");
      } else if (error?.code === 3) {
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Failed to clock out. Please try again.");
      }
      setClockingOut(false);
    }
  };

  const handleConfirmClockOutOutsideGeofence = async () => {
    if (!pendingClockOutPosition) return;
    setShowClockOutGeofenceWarning(false);
    await executeClockOut(pendingClockOutPosition.lat, pendingClockOutPosition.lng, true);
    setPendingClockOutPosition(null);
    setClockOutGeofenceDistance(0);
  };

  const handleCancelClockOutGeofence = () => {
    setShowClockOutGeofenceWarning(false);
    setPendingClockOutPosition(null);
    setClockOutGeofenceDistance(0);
  };

  const handleWithdraw = async () => {
    if (!withdrawingShift || !staffProfileId) return;

    setShowShiftModal(false);
    try {
      const isAssignedShift = withdrawingShift.status === "assigned" &&
        withdrawingShift.assignedStaffId === staffProfileId;

      const application = allApplications?.find(
        (app) => app.shiftProfileId === withdrawingShift.id && app.status === "approved"
      );

      if (isAssignedShift) {
        // For assigned private shifts: revert to open, clear assignment, set isPrivate to false
        await updateShift({
          id: withdrawingShift.id || "",
          data: {
            status: "open",
            assignedStaffId: "",
            isPrivate: false,
            filledCount: 0,
          },
        });

        // Update the application to "withdrawn" if it exists
        if (application) {
          await updateShiftApplication({
            id: application.id || "",
            data: { status: "withdrawn" },
          });
        }

        toast.success("Shift assignment withdrawn. The shift is now open.");
      } else {
        // Standard flow for marketplace shifts
        if (!application) {
          toast.error("Application not found");
          return;
        }

        await updateShiftApplication({
          id: application.id || "",
          data: { status: "withdrawal_pending", withdrawalReason: withdrawReason.trim() },
        });

        toast.success("Withdrawal request submitted. Pending admin review.");
      }

      await refetchAllApplications();
      await refetchShifts();
      setShowWithdrawDialog(false);
      setWithdrawingShift(null);
      resetWithdrawForm();
    } catch {
      toast.error("Failed to submit withdrawal request");
    }
  };

  const handleFindCoverage = useCallback((shift: typeof ShiftsEntity['instanceType'], e: React.MouseEvent) => {
    e.stopPropagation();
    setFindCoverageShift(shift);
    setShowFindCoverageSheet(true);
  }, []);

  // Other upcoming approved shifts (for trade offer selection)
  const otherUpcomingShiftsForTrade = useMemo(() => {
    if (!findCoverageShift || !upcomingShifts || !facilities) return [];
    return upcomingShifts
      .filter((s) => s.id !== findCoverageShift.id)
      .map((s) => ({
        shift: s,
        facility: facilities?.find((f) => f.id === s.facilityProfileId) || null,
      }));
  }, [findCoverageShift, upcomingShifts, facilities]);

  const handleSubmitTrade = useCallback(async (data: {
    requestType: "trade" | "giveaway";
    offeredShiftId?: string;
    targetStaffEmail?: string;
    reason?: string;
    sendToAll: boolean;
  }) => {
    if (!findCoverageShift || !user.email) return;

    setSubmittingTrade(true);
    try {
      await createTrade({
        data: {
          originalShiftId: findCoverageShift.id,
          originalStaffEmail: user.email,
          requestType: data.requestType,
          offeredShiftId: data.offeredShiftId || undefined,
          targetStaffEmail: data.targetStaffEmail || undefined,
          reason: data.reason || undefined,
          status: "open",
          requestedAt: new Date().toISOString(),
        },
      });

      toast.success("Coverage request sent! Eligible staff will be notified.");
      setShowFindCoverageSheet(false);
      setFindCoverageShift(null);
      await refetchTrades();
    } catch {
      toast.error("Failed to submit coverage request. Please try again.");
    } finally {
      setSubmittingTrade(false);
    }
  }, [findCoverageShift, user.email, createTrade, refetchTrades]);

  if (loadingProfile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
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
                <p className="font-semibold">Profile Required</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please complete your staff profile to access your shifts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const modalFacility = modalShift ? getFacility(modalShift.facilityProfileId) : null;
  const modalDuration = modalShift ? getShiftDuration(modalShift.startDateTime, modalShift.endDateTime) : 0;
  const showModalClockInButton = modalShift ? canClockIn(modalShift.startDateTime) : false;
  const showModalWithdrawLink = modalShift ? canWithdraw(modalShift.startDateTime) : false;
  const modalClockInOpensAt = modalShift ? getClockInOpenTime(modalShift.startDateTime) : "";
  const isModalShiftInProgress = modalShift?.status === "in_progress";

  // In-progress facility info
  const inProgressFacility = inProgressShift ? getFacility(inProgressShift.facilityProfileId) : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Shifts</h1>
        <p className="text-sm text-muted-foreground">
          Clock in and out of your shifts
        </p>
      </div>

      <Card className="border rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="pay-period" className="relative">
              Pay Period
              {shiftCount > 0 && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {shiftCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-4 p-4">
            {loadingShifts || loadingApplications ? (
              <>
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </>
            ) : upcomingShifts.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-base">No upcoming shifts</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse available shifts to claim one!
                </p>
              </div>
            ) : (
              upcomingShifts.map((shift) => {
                const facility = getFacility(shift.facilityProfileId);
                const duration = getShiftDuration(shift.startDateTime, shift.endDateTime);
                const isWithdrawalPending = withdrawalPendingShiftIds.has(shift.id);
                const shiftIsAssigned = assignedShiftIds.has(shift.id || "");
                const showClockInButton = !isWithdrawalPending && canClockIn(shift.startDateTime);
                const showWithdrawLink = !isWithdrawalPending && canWithdraw(shift.startDateTime);

                return (
                  <UpcomingShiftCard
                    key={shift.id}
                    shift={shift}
                    facility={facility}
                    duration={duration}
                    roleBadgeColor={getRoleBadgeColor(shift.requiredRole)}
                    isWithdrawalPending={isWithdrawalPending}
                    canClockIn={showClockInButton}
                    canWithdraw={showWithdrawLink}
                    clockingIn={clockingIn}
                    isClockingThisShift={clockingIn && selectedShift?.id === shift.id}
                    currentTime={currentTime}
                    hasCoverageRequest={shiftTradeRequestMap.has(shift.id || "")}
                    shiftStaffRate={shift.shiftStaffRate}
                    isAssigned={shiftIsAssigned}
                    onCardClick={() => handleOpenShiftModal(shift, undefined, undefined, isWithdrawalPending ? "withdrawal_pending" : "upcoming")}
                    onClockIn={(e) => {
                      e.stopPropagation();
                      handleClockIn(shift);
                    }}
                    onWithdraw={(e) => {
                      e.stopPropagation();
                      setWithdrawingShift(shift);
                      setShowWithdrawDialog(true);
                    }}
                    onFindCoverage={!isWithdrawalPending ? (e) => handleFindCoverage(shift, e) : undefined}
                  />
                );
              })
            )}
          </TabsContent>

          {/* In Progress Tab */}
          <TabsContent value="in-progress" className="space-y-4 p-4">
            {loadingShifts ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : !inProgressShift || !activeTimeLog ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <Clock className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-base">No active shift</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clock in when you arrive at your facility.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Green Clock-In Confirmation Banner */}
                <InProgressShiftBanner
                  facilityName={inProgressFacility?.name || "Unknown Facility"}
                  shiftEndDateTime={inProgressShift.endDateTime || ""}
                  clockInTime={activeTimeLog.clockInTime || ""}
                  currentTime={currentTime}
                  geofenceStatus={activeTimeLog?.geofenceStatus as string | undefined}
                />

                <Card className="border">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="mb-2 flex items-center justify-center gap-2">
                          <MapPin className="h-6 w-6 text-muted-foreground" />
                          <p className="text-xl font-bold">
                            {inProgressFacility?.name || "Unknown Facility"}
                          </p>
                        </div>
                        {inProgressShift.requiredRole && (
                          <Badge className={getRoleBadgeColor(inProgressShift.requiredRole)}>
                            {inProgressShift.requiredRole}
                          </Badge>
                        )}
                      </div>

                      {/* Live Running Timer */}
                      {activeTimeLog.clockInTime && (
                        <LiveShiftTimer
                          clockInTime={activeTimeLog.clockInTime}
                          currentTime={currentTime}
                        />
                      )}

                      {/* Break Deduction Info */}
                      {activeTimeLog.clockInTime && (
                        <BreakDeductionInfo
                          clockInTime={activeTimeLog.clockInTime}
                          currentTime={currentTime}
                        />
                      )}

                      {activeTimeLog.geofenceStatus === "outside_flagged" && (
                        <Alert className="border-chart-3 bg-chart-3/10">
                          <AlertCircle className="h-4 w-4 text-chart-3" />
                          <AlertDescription className="text-chart-3">
                            You clocked in outside the facility geofence. This has been recorded.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        variant="destructive"
                        className="h-14 w-full text-base"
                        size="lg"
                        onClick={() => setShowClockOutDialog(true)}
                        disabled={clockingOut}
                      >
                        {clockingOut ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Clocking out...
                          </>
                        ) : (
                          "Clock Out"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Pay Period Tab */}
          <TabsContent value="pay-period" className="space-y-4 p-4">
            {loadingShifts || loadingApplications ? (
              <>
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </>
            ) : (
              <>
                {/* Pay Period Header Card */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {getPayPeriodLabel(currentPayPeriod)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Pay Period #{getPayPeriodNumber(currentPayPeriod)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">Current bi-weekly pay period</span>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Shifts Worked */}
                  <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-bold">
                      {payPeriodShifts.filter((s) => s.status === "completed").length}
                    </span>
                    <span className="text-xs text-muted-foreground">Shifts Worked</span>
                  </div>
                  {/* Hours Worked */}
                  <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-bold">
                      {totalHoursWorked.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">Hours Worked</span>
                  </div>
                  {/* Est. Gross Pay */}
                  <div className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => setShowGrossPay((v) => !v)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={showGrossPay ? "Hide gross pay" : "Show gross pay"}
                      >
                        {showGrossPay ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-xl font-bold">
                      {showGrossPay
                        ? estimatedGross !== null
                          ? `$${estimatedGross.toFixed(2)}`
                          : "—"
                        : "••••"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {estimatedGross === null && showGrossPay ? "Rate not set" : "Est. Gross Pay"}
                    </span>
                  </div>
                </div>

                {payPeriodShifts.length === 0 ? (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                    <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-base">No shifts this pay period</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Browse available shifts to get started
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to={getPageUrl(StaffAvailableShiftsPage)}>Browse Shifts</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Week 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Week 1</span>
                        <span className="text-xs text-muted-foreground">
                          {format(currentPayPeriod.start, "MMM d")}–{format(addDays(currentPayPeriod.start, 6), "MMM d")}
                        </span>
                      </div>
                      {week1Shifts.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-1">No shifts this week</p>
                      ) : (
                        week1Shifts.map((shift) => {
                          const facility = getFacility(shift.facilityProfileId);
                          const log = timeLogs?.find(
                            (l) => l.shiftProfileId === shift.id && l.staffProfileId === staffProfileId
                          );
                          return (
                            <PayPeriodShiftCard
                              key={shift.id}
                              shift={shift}
                              facilityName={facility?.name}
                              timeLog={log}
                              roleBadgeColor={getRoleBadgeColor(shift.requiredRole)}
                            />
                          );
                        })
                      )}
                    </div>

                    {/* Week 2 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Week 2</span>
                        <span className="text-xs text-muted-foreground">
                          {format(addDays(currentPayPeriod.start, 7), "MMM d")}–{format(currentPayPeriod.end, "MMM d")}
                        </span>
                      </div>
                      {week2Shifts.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-1">No shifts this week</p>
                      ) : (
                        week2Shifts.map((shift) => {
                          const facility = getFacility(shift.facilityProfileId);
                          const log = timeLogs?.find(
                            (l) => l.shiftProfileId === shift.id && l.staffProfileId === staffProfileId
                          );
                          return (
                            <PayPeriodShiftCard
                              key={shift.id}
                              shift={shift}
                              facilityName={facility?.name}
                              timeLog={log}
                              roleBadgeColor={getRoleBadgeColor(shift.requiredRole)}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 p-4">
            {loadingShifts || loadingApplications ? (
              <>
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </>
            ) : historyItems.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <History className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-base">No history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your completed and past shifts will appear here
                </p>
              </div>
            ) : (
              historyItems.map((item) => {
                const facility = getFacility(item.shift.facilityProfileId);

                return (
                  <HistoryShiftCard
                    key={item.application.id}
                    shift={item.shift}
                    application={item.application}
                    facility={facility}
                    timeLog={item.timeLog}
                    historyStatus={item.historyStatus}
                    roleBadgeColor={getRoleBadgeColor(item.shift.requiredRole)}
                  />
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Shift Details Modal */}
      <Sheet open={showShiftModal} onOpenChange={setShowShiftModal}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold">
              {modalFacility?.name || "Shift Details"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Full details for the selected shift
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {modalFacility && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {modalFacility.address && `${modalFacility.address}, `}
                      {modalFacility.city}
                      {modalFacility.province && `, ${modalFacility.province}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {modalShift?.startDateTime && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(modalShift.startDateTime), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {modalShift?.startDateTime && modalShift?.endDateTime && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(modalShift.startDateTime), "h:mm a")} -{" "}
                      {format(parseISO(modalShift.endDateTime), "h:mm a")}{" "}
                      <span className="text-muted-foreground/70">({modalDuration} hours)</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {modalShift?.requiredRole && (
                <Badge className={getRoleBadgeColor(modalShift.requiredRole)}>
                  {modalShift.requiredRole}
                </Badge>
              )}
              {modalShift?.id && assignedShiftIds.has(modalShift.id) && (
                <Badge className="bg-primary/20 text-primary">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Assigned
                </Badge>
              )}
              {modalShift?.isShortNotice && (
                <Badge className="bg-chart-3/20 text-chart-3">
                  <Zap className="w-3 h-3 mr-1" />
                  Short Notice
                </Badge>
              )}
              {modalType === "withdrawal_pending" && (
                <Badge className="bg-chart-3/20 text-chart-3">
                  <Clock className="w-3 h-3 mr-1" />
                  Withdrawal Pending
                </Badge>
              )}
              {modalType !== "withdrawal_pending" && modalType !== "history" && modalShift?.status && (
                <Badge variant="outline">
                  {modalShift.status === "claimed" && "Claimed"}
                  {modalShift.status === "in_progress" && "In Progress"}
                  {modalShift.status === "completed" && "Completed"}
                  {modalShift.status === "assigned" && "Assigned"}
                </Badge>
              )}
            </div>

            {/* Dynamic Orientation Status */}
            {modalShift?.requiresOrientation ? (
              <div className="rounded-lg bg-chart-3/10 border border-chart-3/20 p-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-chart-3 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-chart-3">Orientation Required</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      This shift requires facility orientation.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent">No Orientation Required</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      All compliant staff can work this shift.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {modalShift?.notes && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Shift Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {modalShift.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {modalShift?.status === "completed" && modalTimeLog && (
              <div className="grid grid-cols-3 gap-3 rounded-lg border p-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Gross Hours</p>
                  <p className="text-lg font-bold">
                    {modalTimeLog.totalHours
                      ? (modalTimeLog.totalHours + (modalTimeLog.breakMinutes || 0) / 60).toFixed(1)
                      : "0.0"}h
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Break</p>
                  <p className="text-lg font-bold">{modalTimeLog.breakMinutes || 0}min</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Net Hours</p>
                  <p className="text-lg font-bold text-accent">
                    {modalTimeLog.totalHours?.toFixed(1) || "0.0"}h
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3 pb-6">
            {/* Withdrawal Pending modal footer */}
            {modalType === "withdrawal_pending" && (
              <>
                <div className="flex items-center justify-center h-14 w-full rounded-md bg-chart-3/20 text-chart-3 font-medium text-lg">
                  <Clock className="w-5 h-5 mr-2" />
                  Withdrawal Pending
                </div>
                <button
                  onClick={handleCloseShiftModal}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {/* Upcoming modal footer */}
            {modalType === "upcoming" && (modalShift?.status === "claimed" || modalShift?.status === "open" || modalShift?.status === "assigned") && (
              <>
                {showModalClockInButton && (
                  <Button
                    className="w-full h-14 text-lg"
                    size="lg"
                    onClick={() => modalShift && handleClockIn(modalShift)}
                    disabled={clockingIn}
                  >
                    {clockingIn && selectedShift?.id === modalShift?.id ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying location...
                      </>
                    ) : (
                      "Clock In"
                    )}
                  </Button>
                )}
                {showModalWithdrawLink && (
                  <Button
                    variant="outline"
                    className="w-full h-14 text-lg"
                    onClick={() => {
                      if (modalShift) {
                        setWithdrawingShift(modalShift);
                        setShowWithdrawDialog(true);
                      }
                    }}
                  >
                    Withdraw
                  </Button>
                )}
                {!showModalClockInButton && !showModalWithdrawLink && modalClockInOpensAt && (
                  <p className="text-center text-sm text-muted-foreground">
                    Clock-in opens at {modalClockInOpensAt}
                  </p>
                )}
                <button
                  onClick={handleCloseShiftModal}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {/* In Progress modal footer */}
            {modalType === "in-progress" && isModalShiftInProgress && (
              <>
                <Button
                  variant="destructive"
                  className="w-full h-14 text-lg"
                  size="lg"
                  onClick={() => setShowClockOutDialog(true)}
                  disabled={clockingOut}
                >
                  Clock Out
                </Button>
                <button
                  onClick={handleCloseShiftModal}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {/* History / Completed modal footer / fallback close */}
            {(modalType === "completed" || modalType === "history" || (modalType !== "upcoming" && modalType !== "in-progress" && modalType !== "withdrawal_pending")) && (
              <button
                onClick={handleCloseShiftModal}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Clock Out Confirmation Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to clock out? Your hours will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowClockOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClockOut}>
              Confirm Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw (Approved Shift) Confirmation Dialog */}
      <Dialog
        open={showWithdrawDialog}
        onOpenChange={(open) => {
          setShowWithdrawDialog(open);
          if (!open) {
            setWithdrawingShift(null);
            resetWithdrawForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Please confirm you have notified all parties before withdrawing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Reason textarea */}
            <div className="space-y-2">
              <Label htmlFor="withdraw-reason">Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="withdraw-reason"
                placeholder="Explain why you need to withdraw..."
                className="min-h-[80px] w-full"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 min-h-[44px]">
                <Checkbox
                  id="informed-facility"
                  checked={withdrawInformedFacility}
                  onCheckedChange={(checked) => setWithdrawInformedFacility(checked === true)}
                />
                <Label htmlFor="informed-facility" className="cursor-pointer text-sm font-normal leading-snug">
                  I have informed the facility
                </Label>
              </div>
              <div className="flex items-center gap-3 min-h-[44px]">
                <Checkbox
                  id="informed-aljo"
                  checked={withdrawInformedALJO}
                  onCheckedChange={(checked) => setWithdrawInformedALJO(checked === true)}
                />
                <Label htmlFor="informed-aljo" className="cursor-pointer text-sm font-normal leading-snug">
                  I have informed ALJO
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowWithdrawDialog(false);
                setWithdrawingShift(null);
                resetWithdrawForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={!withdrawInformedFacility || !withdrawInformedALJO || !withdrawReason.trim()}
            >
              Confirm Withdrawal Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock-Out Geofence Warning Dialog */}
      <ClockOutGeofenceWarningDialog
        open={showClockOutGeofenceWarning}
        onOpenChange={setShowClockOutGeofenceWarning}
        distanceMeters={clockOutGeofenceDistance}
        onCancel={handleCancelClockOutGeofence}
        onConfirm={handleConfirmClockOutOutsideGeofence}
        isProcessing={clockingOut}
      />

      {/* Find Coverage Sheet */}
      <FindCoverageSheet
        open={showFindCoverageSheet}
        onOpenChange={setShowFindCoverageSheet}
        shift={findCoverageShift}
        facility={findCoverageShift ? getFacility(findCoverageShift.facilityProfileId) : null}
        otherShifts={otherUpcomingShiftsForTrade}
        isSubmitting={submittingTrade}
        onSubmit={handleSubmitTrade}
      />

      {/* GPS Permission Denied Dialog */}
      <Dialog open={showGPSPermissionDialog} onOpenChange={setShowGPSPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Location Access Required</DialogTitle>
            <DialogDescription>
              GPS location permission was denied. You can retry after enabling location access in your browser settings, or proceed without GPS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowGPSPermissionDialog(false);
                if (gpsPermissionAction === "clockIn" && gpsPendingShift) {
                  handleClockIn(gpsPendingShift);
                } else {
                  handleClockOut();
                }
              }}
            >
              Retry
            </Button>
            <Button
              onClick={async () => {
                setShowGPSPermissionDialog(false);
                if (gpsPermissionAction === "clockIn" && gpsPendingShift) {
                  // Clock in without GPS
                  try {
                    setClockingIn(true);
                    let isLateBlocked = false;
                    if (gpsPendingShift.startDateTime) {
                      const windowInfo = getClockInWindowInfo(gpsPendingShift.startDateTime, new Date());
                      isLateBlocked = windowInfo.isLateButAllowed;
                    }
                    const now = new Date().toISOString();
                    const timeLogData: Record<string, unknown> = {
                      clockInTime: now,
                      clockInLat: null,
                      clockInLng: null,
                      geofenceStatus: "outside_flagged",
                      shiftProfileId: gpsPendingShift.id,
                      staffProfileId: staffProfileId,
                      facilityProfileId: gpsPendingShift.facilityProfileId,
                    };
                    if (isLateBlocked) {
                      timeLogData.isLateBlocked = true;
                    }
                    await createTimeLog({ data: timeLogData });
                    await updateShift({
                      id: gpsPendingShift.id || "",
                      data: { status: "in_progress" },
                    });
                    toast.success("Clocked in without GPS");
                    await refetchShifts();
                    await refetchTimeLogs();
                    setShowShiftModal(false);
                    setActiveTab("in-progress");
                  } catch {
                    toast.error("Failed to clock in");
                  } finally {
                    setClockingIn(false);
                    setGpsPendingShift(null);
                  }
                } else {
                  // Clock out without GPS - never block
                  await executeClockOut(null, null, true);
                }
              }}
            >
              {gpsPermissionAction === "clockIn" ? "Clock In Without GPS" : "Clock Out Without GPS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}