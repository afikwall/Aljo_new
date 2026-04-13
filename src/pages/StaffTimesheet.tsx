import { useState, useMemo, useEffect } from "react";
import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  StaffProfilesEntity,
  ShiftApplicationsEntity,
  ShiftsEntity,
  TimeLogsEntity,
  FacilitiesEntity,
  LoginPage,
  StaffDashboardPage,
} from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Calendar, Building2, X } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { getPageUrl } from "@/lib/utils";
import { TimesheetMonthSelector } from "@/components/TimesheetMonthSelector";
import { TimesheetTable } from "@/components/TimesheetTable";
import { TimesheetFooter } from "@/components/TimesheetFooter";

export default function StaffTimesheetPage() {
  const user = useUser();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  useEffect(() => {
    setSelectedFacility("all");
    setFilterFrom("");
    setFilterTo("");
  }, [selectedMonth]);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email }
  );
  const staffProfile = staffProfiles?.[0];

  const { data: shiftApplications, isLoading: loadingApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    { staffProfileId: staffProfile?.id, status: "approved" },
    { enabled: !!staffProfile?.id }
  );

  const { data: completedShifts, isLoading: loadingShifts } = useEntityGetAll(
    ShiftsEntity,
    { status: "completed" }
  );

  const { data: timeLogs, isLoading: loadingTimeLogs, refetch: refetchTimeLogs } = useEntityGetAll(
    TimeLogsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  const { data: facilities, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);

  const isLoading =
    loadingProfile ||
    loadingApplications ||
    loadingShifts ||
    loadingTimeLogs ||
    loadingFacilities;

  const approvedShiftIds = useMemo(() => {
    return new Set(shiftApplications?.map((app) => app.shiftProfileId) ?? []);
  }, [shiftApplications]);

  const myCompletedShifts = useMemo(() => {
    if (!completedShifts) return [];
    return completedShifts.filter((shift) => approvedShiftIds.has(shift.id));
  }, [completedShifts, approvedShiftIds]);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthShifts = useMemo(() => {
    return myCompletedShifts.filter((shift) => {
      if (!shift.startDateTime) return false;
      try {
        const shiftDate = parseISO(shift.startDateTime);
        return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [myCompletedShifts, monthStart, monthEnd]);

  const timeLogByShiftId = useMemo(() => {
    const map = new Map<string, typeof timeLogs extends (infer T)[] | undefined ? T : never>();
    timeLogs?.forEach((log) => {
      if (log.shiftProfileId) {
        map.set(log.shiftProfileId, log);
      }
    });
    return map;
  }, [timeLogs]);

  const facilityNameById = useMemo(() => {
    const map = new Map<string, string>();
    facilities?.forEach((f) => {
      if (f.id) {
        map.set(f.id, f.name || "Unknown Facility");
      }
    });
    return map;
  }, [facilities]);

  const rows = useMemo(() => {
    return monthShifts.map((shift) => {
      const timeLog = shift.id ? timeLogByShiftId.get(shift.id) : undefined;
      return {
        shiftId: shift.id || "",
        date: shift.startDateTime || "",
        facilityProfileId: shift.facilityProfileId || "",
        facilityName: shift.facilityProfileId
          ? facilityNameById.get(shift.facilityProfileId) || "Unknown Facility"
          : "Unknown Facility",
        shiftStart: shift.startDateTime || "",
        shiftEnd: shift.endDateTime || "",
        timeLogId: timeLog?.id,
        clockInTime: timeLog?.clockInTime,
        clockOutTime: timeLog?.clockOutTime,
        breakMinutes: timeLog?.breakMinutes,
        totalHours: timeLog?.totalHours,
        isApproved: timeLog?.isApproved ?? false,
      };
    });
  }, [monthShifts, timeLogByShiftId, facilityNameById]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      try {
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      } catch {
        return 0;
      }
    });
  }, [rows]);

  const uniqueFacilities = useMemo(() => {
    const seen = new Map<string, string>();
    sortedRows.forEach((row) => {
      if (row.facilityProfileId && !seen.has(row.facilityProfileId)) {
        seen.set(row.facilityProfileId, row.facilityName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ facilityProfileId: id, facilityName: name }));
  }, [sortedRows]);

  const filteredRows = useMemo(() => {
    let result = sortedRows;
    if (selectedFacility !== "all") {
      result = result.filter((row) => row.facilityName === selectedFacility);
    }
    if (filterFrom || filterTo) {
      result = result.filter((row) => {
        const clockIn = row.clockInTime || row.shiftStart;
        if (!clockIn) return false;
        if (filterFrom && clockIn < filterFrom) return false;
        if (filterTo && clockIn > filterTo) return false;
        return true;
      });
    }
    return result;
  }, [sortedRows, selectedFacility, filterFrom, filterTo]);

  const totalHours = useMemo(() => {
    return filteredRows.reduce((sum, row) => {
      if (row.timeLogId && row.totalHours != null) {
        return sum + row.totalHours;
      }
      return sum;
    }, 0);
  }, [filteredRows]);

  const hasDateFilter = !!filterFrom || !!filterTo;

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (!user.isAuthenticated) {
    return null;
  }

  const monthLabel = format(selectedMonth, "MMMM yyyy");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        to={getPageUrl(StaffDashboardPage)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Dashboard
      </Link>

      {/* Page header + month selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">My Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your completed shift hours
          </p>
        </div>
        <TimesheetMonthSelector
          selectedMonth={selectedMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Facility filter */}
        {uniqueFacilities.length >= 2 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Building2 className="size-3" />
              Facility
            </label>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {uniqueFacilities.map((f) => (
                  <SelectItem key={f.facilityProfileId} value={f.facilityName}>
                    {f.facilityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* From datetime */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium">From</label>
          <Input
            type="datetime-local"
            className="h-9 w-52"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>

        {/* To datetime */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground font-medium">To</label>
          <Input
            type="datetime-local"
            className="h-9 w-52"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>

        {/* Clear date filter */}
        {hasDateFilter && (
          <Button
            variant="ghost"
            className="h-9 gap-1.5 self-end"
            onClick={() => { setFilterFrom(""); setFilterTo(""); }}
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Main card */}
      <Card>
        <CardContent className="p-0">
          {isLoading || sortedRows.length > 0 ? (
            <>
              <TimesheetTable
                rows={filteredRows}
                isLoading={isLoading}
                onTimeLogUpdated={() => refetchTimeLogs()}
              />
              {!isLoading && (
                <TimesheetFooter
                  totalHours={totalHours}
                  shiftCount={filteredRows.length}
                  isFiltered={hasDateFilter}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <Calendar className="size-12 text-muted-foreground" />
              <p className="font-medium text-base">No completed shifts for {monthLabel}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Completed shifts will appear here after you clock out.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}