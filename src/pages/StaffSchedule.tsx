import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  useUser,
  useEntityGetAll,
  useEntityCreate,
  useEntityDelete,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffProfilesEntity,
  ShiftApplicationsEntity,
  ShiftsEntity,
  FacilitiesEntity,
  BlockedDatesEntity,
  HolidaysEntity,
  LoginPage,
} from "@/product-types";
import { getPageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarGrid } from "@/components/CalendarGrid";
import { CalendarLegend } from "@/components/CalendarLegend";
import { DayDetailSheet } from "@/components/DayDetailSheet";
import { DefaultHoursSection } from "@/components/DefaultHoursSection";
import {
  toDateKey,
  parseISO,
  isWithinInterval,
  getBlockedRecordsForDate,
} from "@/utils/calendarUtils";
import type {
  CalendarShiftEvent,
  CalendarHoliday,
  CalendarBlockedDate,
} from "@/utils/scheduleTypes";
import type { ShiftPillVariant } from "@/components/ShiftPill";

export default function StaffSchedulePage() {
  const user = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Auth redirect
  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  // ─── State ───
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  // ─── Data Fetching ───

  // 1. Staff profile
  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated }
  );
  const staffProfile = staffProfiles?.[0] ?? null;
  const staffProfileId = staffProfile?.id ?? "";
  const staffEmail = staffProfile?.email ?? user.email;

  // 2. Shift applications (pending + approved)
  const { data: allApplications, isLoading: loadingApps } = useEntityGetAll(
    ShiftApplicationsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  // Filter client-side for pending + approved
  const relevantApplications = useMemo(
    () =>
      (allApplications ?? []).filter(
        (a) => a.status === "pending" || a.status === "approved"
      ),
    [allApplications]
  );

  // 3. All shifts referenced by applications
  const { data: allShifts, isLoading: loadingShifts } = useEntityGetAll(
    ShiftsEntity,
    {},
    { enabled: relevantApplications.length > 0 }
  );

  // 4. Facilities for name lookups
  const { data: allFacilities, isLoading: loadingFacilities } =
    useEntityGetAll(FacilitiesEntity);

  // 5. Blocked dates for this staff
  const {
    data: blockedDatesRaw,
    isLoading: loadingBlocked,
    refetch: refetchBlocked,
  } = useEntityGetAll(
    BlockedDatesEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  // 6. Holidays
  const currentYear = new Date().getFullYear();
  const { data: holidaysRaw, isLoading: loadingHolidays } = useEntityGetAll(
    HolidaysEntity
  );

  // ─── Derived Data (memoized) ───

  // Facility name map
  const facilityMap = useMemo(() => {
    const map: Record<string, string> = {};
    (allFacilities ?? []).forEach((f) => {
      if (f.id && f.name) map[f.id] = f.name;
    });
    return map;
  }, [allFacilities]);

  // Shift map by shift ID
  const shiftById = useMemo(() => {
    const map: Record<string, typeof ShiftsEntity.instanceType & { id: string }> = {};
    (allShifts ?? []).forEach((s) => {
      if (s.id) map[s.id] = s as typeof ShiftsEntity.instanceType & { id: string };
    });
    return map;
  }, [allShifts]);

  // Build calendar shift events keyed by date
  const shiftsMap = useMemo(() => {
    const map: Record<string, CalendarShiftEvent[]> = {};

    for (const app of relevantApplications) {
      const shift = app.shiftProfileId ? shiftById[app.shiftProfileId] : null;
      if (!shift || !shift.startDateTime) continue;

      const facilityName =
        shift.facilityProfileId && facilityMap[shift.facilityProfileId]
          ? facilityMap[shift.facilityProfileId]
          : "Facility";

      let variant: ShiftPillVariant = "pending";
      if (app.status === "pending") {
        variant = "pending";
      } else if (app.status === "approved") {
        if (shift.status === "completed") {
          variant = "completed";
        } else {
          variant = "upcoming";
        }
      }

      const dateKey = toDateKey(parseISO(shift.startDateTime));
      const event: CalendarShiftEvent = {
        applicationId: app.id ?? "",
        shiftId: shift.id ?? "",
        facilityName,
        startDateTime: shift.startDateTime ?? "",
        endDateTime: shift.endDateTime ?? "",
        requiredRole: shift.requiredRole ?? "",
        applicationStatus: app.status ?? "",
        shiftStatus: shift.status ?? "",
        variant,
      };

      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    }

    return map;
  }, [relevantApplications, shiftById, facilityMap]);

  // Holidays keyed by date
  const holidaysMap = useMemo(() => {
    const map: Record<string, CalendarHoliday> = {};
    (holidaysRaw ?? [])
      .filter(
        (h) =>
          h.date &&
          h.year != null &&
          (h.year === currentYear || h.year === currentYear + 1)
      )
      .forEach((h) => {
        if (h.date) {
          map[h.date] = {
            date: h.date,
            name: h.name ?? "Holiday",
            multiplier: h.multiplier,
          };
        }
      });
    return map;
  }, [holidaysRaw, currentYear]);

  // Blocked dates as processed records
  const blockedDates = useMemo<CalendarBlockedDate[]>(
    () =>
      (blockedDatesRaw ?? [])
        .filter((b) => b.startDate && b.endDate && b.id)
        .map((b) => ({
          id: b.id!,
          startDate: b.startDate!,
          endDate: b.endDate!,
          reason: b.reason ?? undefined,
        })),
    [blockedDatesRaw]
  );

  // Blocked dates as a set of date keys for fast calendar lookup
  const blockedDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const range of blockedDates) {
      try {
        const start = parseISO(range.startDate);
        const end = parseISO(range.endDate);
        // Generate all keys in range
        const d = new Date(start);
        while (d <= end) {
          set.add(toDateKey(d));
          d.setDate(d.getDate() + 1);
        }
      } catch {
        // skip invalid
      }
    }
    return set;
  }, [blockedDates]);

  // ─── Day Detail Sheet Data ───
  const selectedDayShifts = useMemo(() => {
    if (!selectedDate) return [];
    return shiftsMap[toDateKey(selectedDate)] ?? [];
  }, [selectedDate, shiftsMap]);

  const selectedDayHoliday = useMemo(() => {
    if (!selectedDate) return null;
    return holidaysMap[toDateKey(selectedDate)] ?? null;
  }, [selectedDate, holidaysMap]);

  const selectedDayBlockedRecords = useMemo(() => {
    if (!selectedDate) return [];
    return getBlockedRecordsForDate(selectedDate, blockedDates);
  }, [selectedDate, blockedDates]);

  // ─── Handlers ───
  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSheetOpen(true);
  }, []);

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
  }, []);

  // Block/Unblock handlers
  const { createFunction: createBlocked } =
    useEntityCreate(BlockedDatesEntity);
  const { deleteFunction: deleteBlocked } =
    useEntityDelete(BlockedDatesEntity);

  const handleBlockSingle = useCallback(
    async (date: string) => {
      setIsBlocking(true);
      try {
        await createBlocked({
          data: {
            staffProfileId,
            staffEmail,
            startDate: date,
            endDate: date,
          },
        });
        toast.success("Date blocked successfully");
        await refetchBlocked();
        setSheetOpen(false);
      } catch (err) {
        console.error("Failed to block date:", err);
        toast.error("Failed to block date");
      } finally {
        setIsBlocking(false);
      }
    },
    [staffProfileId, staffEmail, createBlocked, refetchBlocked]
  );

  const handleBlockRange = useCallback(
    async (startDate: string, endDate: string, reason: string) => {
      setIsBlocking(true);
      try {
        await createBlocked({
          data: {
            staffProfileId,
            staffEmail,
            startDate,
            endDate,
            reason: reason || undefined,
          },
        });
        toast.success("Date range blocked successfully");
        await refetchBlocked();
        setSheetOpen(false);
      } catch (err) {
        console.error("Failed to block range:", err);
        toast.error("Failed to block date range");
      } finally {
        setIsBlocking(false);
      }
    },
    [staffProfileId, staffEmail, createBlocked, refetchBlocked]
  );

  const handleUnblock = useCallback(
    async (ids: string[]) => {
      setIsBlocking(true);
      try {
        for (const id of ids) {
          await deleteBlocked({ id });
        }
        toast.success("Date unblocked successfully");
        await refetchBlocked();
        setSheetOpen(false);
      } catch (err) {
        console.error("Failed to unblock date:", err);
        toast.error("Failed to unblock date");
      } finally {
        setIsBlocking(false);
      }
    },
    [deleteBlocked, refetchBlocked]
  );

  // ─── Loading state ───
  const isLoading =
    loadingProfile ||
    loadingApps ||
    loadingShifts ||
    loadingFacilities ||
    loadingBlocked ||
    loadingHolidays;

  // Auth guard
  if (!user.isAuthenticated) return null;

  // No staff profile found
  if (!loadingProfile && !staffProfile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Manage your availability and view your shifts
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No Staff Profile Found</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            We couldn't find a staff profile associated with your account.
            Please contact an administrator to get set up.
          </p>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Manage your availability and view your shifts
        </p>
      </div>

      {/* Calendar */}
      <CalendarGrid
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        shiftsMap={shiftsMap}
        holidaysMap={holidaysMap}
        blockedDatesSet={blockedDatesSet}
        isMobile={isMobile}
        onDayClick={handleDayClick}
      />

      {/* Legend */}
      <CalendarLegend />

      {/* Day Detail Sheet */}
      <DayDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedDate={selectedDate}
        shifts={selectedDayShifts}
        holiday={selectedDayHoliday}
        blockedRecords={selectedDayBlockedRecords}
        onBlockSingle={handleBlockSingle}
        onBlockRange={handleBlockRange}
        onUnblock={handleUnblock}
        isBlocking={isBlocking}
      />

      {/* Default Weekly Hours */}
      {staffProfileId && (
        <DefaultHoursSection
          staffProfileId={staffProfileId}
          staffEmail={staffEmail}
        />
      )}
    </div>
  );
}