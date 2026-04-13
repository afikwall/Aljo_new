import { useState, useMemo, useEffect } from "react";
import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  FacilityManagerProfilesEntity,
  StaffProfilesEntity,
  ShiftApplicationsEntity,
  ShiftsEntity,
  TimeLogsEntity,
  LoginPage,
  FacilityDashboardPage,
} from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Calendar, User, X } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { getPageUrl } from "@/lib/utils";
import { TimesheetMonthSelector } from "@/components/TimesheetMonthSelector";
import { FMTimesheetTable } from "@/components/FMTimesheetTable";
import { TimesheetFooter } from "@/components/TimesheetFooter";

export default function FMTimesheetPage() {
  const user = useUser();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  useEffect(() => {
    setSelectedStaff("all");
    setFilterFrom("");
    setFilterTo("");
  }, [selectedMonth]);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  const { data: fmProfiles, isLoading: loadingFmProfile } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated }
  );
  const fmProfile = fmProfiles?.[0];
  const facilityProfileId = fmProfile?.facilityProfileId;

  const { data: completedShifts, isLoading: loadingShifts } = useEntityGetAll(
    ShiftsEntity,
    { facilityProfileId, status: "completed" },
    { enabled: !!facilityProfileId }
  );

  const { data: shiftApplications, isLoading: loadingApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    { status: "approved" }
  );

  const { data: staffProfiles, isLoading: loadingStaffProfiles } = useEntityGetAll(
    StaffProfilesEntity
  );

  const { data: allTimeLogs, isLoading: loadingTimeLogs } = useEntityGetAll(
    TimeLogsEntity
  );

  const isLoading =
    loadingFmProfile ||
    loadingShifts ||
    loadingApplications ||
    loadingStaffProfiles ||
    loadingTimeLogs;

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthShifts = useMemo(() => {
    if (!completedShifts) return [];
    return completedShifts.filter((shift) => {
      if (!shift.startDateTime) return false;
      try {
        const shiftDate = parseISO(shift.startDateTime);
        return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [completedShifts, monthStart, monthEnd]);

  const staffIdByShiftId = useMemo(() => {
    const map = new Map<string, string>();
    shiftApplications?.forEach((app) => {
      if (app.shiftProfileId && app.staffProfileId) {
        map.set(app.shiftProfileId, app.staffProfileId);
      }
    });
    return map;
  }, [shiftApplications]);

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    staffProfiles?.forEach((sp) => {
      if (sp.id) {
        const name =
          sp.firstName && sp.lastName
            ? `${sp.firstName} ${sp.lastName}`
            : sp.firstName || sp.lastName || "Unknown Staff";
        map.set(sp.id, name);
      }
    });
    return map;
  }, [staffProfiles]);

  const facilityShiftIds = useMemo(() => {
    return new Set(completedShifts?.map((s) => s.id).filter(Boolean) ?? []);
  }, [completedShifts]);

  const timeLogByShiftId = useMemo(() => {
    const map = new Map<string, typeof allTimeLogs extends (infer T)[] | undefined ? T : never>();
    allTimeLogs?.forEach((log) => {
      if (log.shiftProfileId && facilityShiftIds.has(log.shiftProfileId)) {
        map.set(log.shiftProfileId, log);
      }
    });
    return map;
  }, [allTimeLogs, facilityShiftIds]);

  const rows = useMemo(() => {
    return monthShifts.map((shift) => {
      const staffProfileId = shift.id ? staffIdByShiftId.get(shift.id) : undefined;
      const staffName = staffProfileId
        ? staffNameById.get(staffProfileId) || "Unknown Staff"
        : "Unknown Staff";
      const timeLog = shift.id ? timeLogByShiftId.get(shift.id) : undefined;
      return {
        shiftId: shift.id || "",
        date: shift.startDateTime || "",
        staffName,
        shiftStart: shift.startDateTime || "",
        shiftEnd: shift.endDateTime || "",
        timeLogId: timeLog?.id,
        clockInTime: timeLog?.clockInTime,
        clockOutTime: timeLog?.clockOutTime,
        breakMinutes: timeLog?.breakMinutes,
        totalHours: timeLog?.totalHours,
      };
    });
  }, [monthShifts, staffIdByShiftId, staffNameById, timeLogByShiftId]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      try {
        const dateDiff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.staffName.localeCompare(b.staffName);
      } catch {
        return 0;
      }
    });
  }, [rows]);

  const uniqueStaff = useMemo(() => {
    const seen = new Map<string, string>();
    sortedRows.forEach((row) => {
      if (!seen.has(row.staffName)) {
        seen.set(row.staffName, row.staffName);
      }
    });
    return Array.from(seen.keys());
  }, [sortedRows]);

  const filteredRows = useMemo(() => {
    let result = sortedRows;
    if (selectedStaff !== "all") {
      result = result.filter((row) => row.staffName === selectedStaff);
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
  }, [sortedRows, selectedStaff, filterFrom, filterTo]);

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

  if (!isLoading && !fmProfile) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
          <Calendar className="size-12 text-muted-foreground" />
          <p className="font-medium text-base">Facility not set up</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your facility manager profile has not been configured yet. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  const monthLabel = format(selectedMonth, "MMMM yyyy");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        to={getPageUrl(FacilityDashboardPage)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Dashboard
      </Link>

      {/* Page header + month selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Facility Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            View completed shift hours for your facility
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
        {/* Staff filter */}
        {uniqueStaff.length >= 2 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <User className="size-3" />
              Staff
            </label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {uniqueStaff.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
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
              <FMTimesheetTable
                rows={filteredRows}
                isLoading={isLoading}
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
                Completed shifts will appear here once staff have clocked out.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}