import { useState, useMemo, useEffect } from "react";
import { useUser, useEntityGetAll, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import {
  StaffProfilesEntity,
  FacilitiesEntity,
  ShiftsEntity,
  ShiftApplicationsEntity,
  TimeLogsEntity,
  LoginPage,
  AdminDashboardPage,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, X, ShieldCheck, Loader2 } from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { getPageUrl } from "@/lib/utils";
import { TimesheetMonthSelector } from "@/components/TimesheetMonthSelector";
import { AdminTimesheetTable } from "@/components/AdminTimesheetTable";
import type { AdminTimesheetRow } from "@/components/AdminTimesheetTable";

export default function AdminTimesheetPage() {
  const user = useUser();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const { updateFunction: updateTimeLog } = useEntityUpdate(TimeLogsEntity);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
      return;
    }
    if (user.role !== "admin") {
      navigate(getPageUrl(AdminDashboardPage));
    }
  }, [user.isAuthenticated, user.role, navigate]);

  useEffect(() => {
    setSelectedStaffId("all");
    setSelectedFacilityId("all");
    setFilterFrom("");
    setFilterTo("");
  }, [selectedMonth]);

  const { data: staffProfiles, isLoading: loadingStaff } = useEntityGetAll(
    StaffProfilesEntity,
    {},
    { enabled: user.isAuthenticated && user.role === "admin" }
  );

  const { data: facilities, isLoading: loadingFacilities } = useEntityGetAll(
    FacilitiesEntity,
    {},
    { enabled: user.isAuthenticated && user.role === "admin" }
  );

  const { data: shifts, isLoading: loadingShifts } = useEntityGetAll(
    ShiftsEntity,
    {},
    { enabled: user.isAuthenticated && user.role === "admin" }
  );

  const { data: shiftApplications, isLoading: loadingApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    { status: "approved" },
    { enabled: user.isAuthenticated && user.role === "admin" }
  );

  const { data: timeLogs, isLoading: loadingTimeLogs } = useEntityGetAll(
    TimeLogsEntity,
    {},
    { enabled: user.isAuthenticated && user.role === "admin" }
  );

  const isLoading =
    loadingStaff ||
    loadingFacilities ||
    loadingShifts ||
    loadingApplications ||
    loadingTimeLogs;

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const staffById = useMemo(() => {
    const map = new Map<string, { name: string; role: string }>();
    staffProfiles?.forEach((sp) => {
      if (sp.id) {
        const name =
          sp.firstName && sp.lastName
            ? `${sp.firstName} ${sp.lastName}`
            : sp.firstName || sp.lastName || sp.email || "Unknown Staff";
        map.set(sp.id, { name, role: sp.roleType || "" });
      }
    });
    return map;
  }, [staffProfiles]);

  const facilityById = useMemo(() => {
    const map = new Map<string, string>();
    facilities?.forEach((f) => {
      if (f.id) map.set(f.id, f.name || "Unknown Facility");
    });
    return map;
  }, [facilities]);

  const staffIdByShiftId = useMemo(() => {
    const map = new Map<string, string>();
    shiftApplications?.forEach((app) => {
      if (app.shiftProfileId && app.staffProfileId) {
        map.set(app.shiftProfileId, app.staffProfileId);
      }
    });
    return map;
  }, [shiftApplications]);

  const shiftById = useMemo(() => {
    const map = new Map<string, typeof shifts extends (infer T)[] | undefined ? T : never>();
    shifts?.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return map;
  }, [shifts]);

  const monthTimeLogs = useMemo(() => {
    if (!timeLogs) return [];
    return timeLogs.filter((log) => {
      if (!log.clockInTime) return false;
      try {
        const d = parseISO(log.clockInTime);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [timeLogs, monthStart, monthEnd]);

  const allRows = useMemo((): AdminTimesheetRow[] => {
    return monthTimeLogs
      .map((log) => {
        const shiftId = log.shiftProfileId;
        if (!shiftId) return null;

        const shift = shiftById.get(shiftId);
        if (!shift) return null;

        const staffProfileId =
          log.staffProfileId || staffIdByShiftId.get(shiftId);
        if (!staffProfileId) return null;

        const staff = staffById.get(staffProfileId);
        const facilityId = shift.facilityProfileId;
        const facilityName = facilityId
          ? facilityById.get(facilityId) || "Unknown Facility"
          : "Unknown Facility";

        return {
          shiftId,
          date: log.clockInTime || shift.startDateTime || "",
          staffName: staff?.name || "Unknown Staff",
          staffRole: staff?.role || "",
          facilityName,
          facilityId: facilityId || "",
          staffProfileId,
          shiftStart: shift.startDateTime || "",
          shiftEnd: shift.endDateTime || "",
          timeLogId: log.id,
          clockInTime: log.clockInTime,
          clockOutTime: log.clockOutTime,
          breakMinutes: log.breakMinutes,
          totalHours: log.totalHours,
          isApproved: log.isApproved ?? false,
        } as AdminTimesheetRow & { facilityId: string; staffProfileId: string };
      })
      .filter(Boolean) as (AdminTimesheetRow & {
      facilityId: string;
      staffProfileId: string;
    })[];
  }, [monthTimeLogs, shiftById, staffIdByShiftId, staffById, facilityById]);

  const sortedRows = useMemo(() => {
    return [...allRows].sort((a, b) => {
      try {
        const diff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
        if (diff !== 0) return diff;
        return a.staffName.localeCompare(b.staffName);
      } catch {
        return 0;
      }
    });
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return sortedRows.filter((row) => {
      const r = row as AdminTimesheetRow & {
        staffProfileId: string;
        facilityId: string;
      };
      if (selectedStaffId !== "all" && r.staffProfileId !== selectedStaffId)
        return false;
      if (selectedFacilityId !== "all" && r.facilityId !== selectedFacilityId)
        return false;
      if (filterFrom || filterTo) {
        const clockIn = row.clockInTime || row.date;
        if (!clockIn) return false;
        if (filterFrom && clockIn < filterFrom) return false;
        if (filterTo && clockIn > filterTo) return false;
      }
      return true;
    });
  }, [sortedRows, selectedStaffId, selectedFacilityId, filterFrom, filterTo]);

  const totalHours = useMemo(() => {
    return filteredRows.reduce((sum, row) => {
      if (row.timeLogId && row.totalHours != null) return sum + row.totalHours;
      return sum;
    }, 0);
  }, [filteredRows]);

  const hasDateFilter = !!filterFrom || !!filterTo;

  const hasActiveFilters =
    selectedStaffId !== "all" || selectedFacilityId !== "all" || hasDateFilter;

  const unapprovedRows = useMemo(() => {
    return filteredRows.filter(
      (row) => row.isApproved !== true && !!row.timeLogId
    );
  }, [filteredRows]);

  const unapprovedCount = unapprovedRows.length;

  const staffOptions = useMemo(() => {
    return (staffProfiles || [])
      .filter((sp) => !!sp.id)
      .map((sp) => ({
        id: sp.id!,
        name:
          sp.firstName && sp.lastName
            ? `${sp.firstName} ${sp.lastName}`
            : sp.firstName || sp.lastName || sp.email || "Unknown",
        role: sp.roleType || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staffProfiles]);

  const facilityOptions = useMemo(() => {
    return (facilities || [])
      .filter((f) => !!f.id)
      .map((f) => ({ id: f.id!, name: f.name || "Unknown Facility" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities]);

  const handleApproveAll = async () => {
    if (unapprovedRows.length === 0) return;
    setIsApprovingAll(true);
    let failCount = 0;
    for (const row of unapprovedRows) {
      try {
        await updateTimeLog({
          id: row.timeLogId!,
          data: { isApproved: true },
        });
      } catch {
        failCount++;
      }
    }
    setIsApprovingAll(false);
    if (failCount === 0) {
      const { toast } = await import("sonner");
      toast.success(`All ${unapprovedRows.length} time logs approved and locked.`);
    } else {
      const { toast } = await import("sonner");
      toast.warning(
        `${unapprovedRows.length - failCount} approved. ${failCount} failed — please retry.`
      );
    }
  };

  const handlePrevMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleClearFilters = () => {
    setSelectedStaffId("all");
    setSelectedFacilityId("all");
    setFilterFrom("");
    setFilterTo("");
  };

  if (!user.isAuthenticated || user.role !== "admin") {
    return null;
  }

  const monthLabel = format(selectedMonth, "MMMM yyyy");

  return (
    <>
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Staff Timesheets</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all staff time logs
          </p>
        </div>
        <TimesheetMonthSelector
          selectedMonth={selectedMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            {/* Staff filter */}
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-xs text-muted-foreground font-medium">
                Filter by Staff
              </label>
              <Select
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        {s.name}
                        {s.role && (
                          <span className="text-xs text-muted-foreground">
                            ({s.role})
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Facility filter */}
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-xs text-muted-foreground font-medium">
                Filter by Facility
              </label>
              <Select
                value={selectedFacilityId}
                onValueChange={setSelectedFacilityId}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilityOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Separator-like visual break */}
            <div className="w-full sm:hidden" />

            {/* From datetime */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                From
              </label>
              <Input
                type="datetime-local"
                className="h-11 w-52"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </div>

            {/* To datetime */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                To
              </label>
              <Input
                type="datetime-local"
                className="h-11 w-52"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </div>

            {/* Clear date filter button — only when date filter is active */}
            {hasDateFilter && (
              <Button
                variant="ghost"
                className="h-11 gap-2 self-end"
                onClick={() => { setFilterFrom(""); setFilterTo(""); }}
              >
                <X className="size-4" />
                Clear Date Filter
              </Button>
            )}

            {/* Clear all filters */}
            {hasActiveFilters && !hasDateFilter && (
              <Button
                variant="ghost"
                className="h-11 gap-2 self-end"
                onClick={handleClearFilters}
              >
                <X className="size-4" />
                Clear Filters
              </Button>
            )}

            {/* Clear all when date + other filters are active */}
            {hasActiveFilters && hasDateFilter && (selectedStaffId !== "all" || selectedFacilityId !== "all") && (
              <Button
                variant="ghost"
                className="h-11 gap-2 self-end"
                onClick={handleClearFilters}
              >
                <X className="size-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main table card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[180px] py-12 px-6 text-center gap-3 border border-dashed rounded-lg m-4">
              <Clock className="size-10 text-muted-foreground" />
              <p className="font-bold text-base">No time logs found</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {hasActiveFilters
                  ? `No time logs match the current filters for ${monthLabel}. Try clearing the filters.`
                  : `No staff have clocked in or out during ${monthLabel}.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <AdminTimesheetTable rows={filteredRows} isLoading={false} />
            </div>
          )}
        </CardContent>
      </Card>

    </div>

      {/* Monthly total - sticky bottom bar */}
      {!isLoading && filteredRows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 border-t bg-background shadow-lg">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between py-4">
              {/* Left side: Approve All button */}
              <div>
                {unapprovedCount > 0 && (
                  <Button
                    variant="default"
                    className="h-9 gap-2"
                    onClick={handleApproveAll}
                    disabled={isApprovingAll}
                  >
                    {isApprovingAll ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    {isApprovingAll
                      ? "Approving…"
                      : `Approve All (${unapprovedCount})`}
                  </Button>
                )}
              </div>

              {/* Right side: monthly total */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-sm font-medium text-muted-foreground">
                    Monthly Total Hours
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {monthLabel} · {filteredRows.length} time log
                    {filteredRows.length !== 1 ? "s" : ""}
                    {hasActiveFilters ? " (filtered)" : ""}
                  </span>
                </div>
                <span className="text-3xl font-bold text-accent">
                  {Math.round(totalHours * 100) / 100} hrs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}