import { useMemo, useCallback } from "react";
import { CalendarCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ReportSectionCard, type KpiChip } from "@/components/ReportSectionCard";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  type DateRange,
  isDateInRange,
  formatPercent,
  downloadCSV,
  getCSVFilename,
  getStaffName,
  getStaffInitials,
} from "@/utils/reportUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface Shift {
  id?: string;
  status?: string;
  startDateTime?: string;
  facilityProfileId?: string;
  requiredRole?: string;
}

interface ShiftApplication {
  id?: string;
  status?: string;
  staffProfileId?: string;
  shiftProfileId?: string;
  appliedAt?: string;
  respondedAt?: string;
}

interface TimeLog {
  id?: string;
  staffProfileId?: string;
  shiftProfileId?: string;
  isLateBlocked?: boolean;
  clockOutOutsideGeofence?: boolean;
  clockInTime?: string;
  clockOutTime?: string;
}

interface StaffProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  roleType?: string;
  withdrawalCount?: number;
}

interface Facility {
  id?: string;
  name?: string;
}

interface AttendanceSectionProps {
  shifts: Shift[];
  shiftApplications: ShiftApplication[];
  timeLogs: TimeLog[];
  staffMap: Map<string, StaffProfile>;
  facilityMap: Map<string, Facility>;
  dateRange: DateRange;
  facilityFilter: string;
  isLoading: boolean;
}

export const AttendanceSection = ({
  shifts,
  shiftApplications,
  timeLogs,
  staffMap,
  facilityMap,
  dateRange,
  facilityFilter,
  isLoading,
}: AttendanceSectionProps) => {
  // Filter shifts by date range and facility
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      if (!isDateInRange(s.startDateTime, dateRange)) return false;
      if (facilityFilter !== "all" && s.facilityProfileId !== facilityFilter) return false;
      return true;
    });
  }, [shifts, dateRange, facilityFilter]);

  const filteredShiftIds = useMemo(
    () => new Set(filteredShifts.map(s => s.id).filter(Boolean)),
    [filteredShifts]
  );

  // Shift status counts
  const totalScheduled = useMemo(
    () => filteredShifts.filter(s => s.status !== "cancelled").length,
    [filteredShifts]
  );
  const completedCount = useMemo(
    () => filteredShifts.filter(s => s.status === "completed").length,
    [filteredShifts]
  );
  const cancelledCount = useMemo(
    () => filteredShifts.filter(s => s.status === "cancelled").length,
    [filteredShifts]
  );

  // Applications for filtered shifts
  const relevantApps = useMemo(
    () => shiftApplications.filter(a => filteredShiftIds.has(a.shiftProfileId || "")),
    [shiftApplications, filteredShiftIds]
  );

  // Withdrawal count
  const withdrawalCount = useMemo(
    () => relevantApps.filter(a => a.status === "withdrawn" || a.status === "withdrawal_pending").length,
    [relevantApps]
  );

  // No-show: shifts that are completed but have no time log
  const filteredTimeLogShiftIds = useMemo(() => {
    const ids = new Set<string>();
    timeLogs.forEach(tl => { if (tl.shiftProfileId) ids.add(tl.shiftProfileId); });
    return ids;
  }, [timeLogs]);

  // Late clock-ins
  const lateClockIns = useMemo(
    () => timeLogs.filter(tl => tl.isLateBlocked && filteredShiftIds.has(tl.shiftProfileId || "")).length,
    [timeLogs, filteredShiftIds]
  );

  // Outside geofence clock-outs
  const outsideGeofence = useMemo(
    () => timeLogs.filter(tl => tl.clockOutOutsideGeofence && filteredShiftIds.has(tl.shiftProfileId || "")).length,
    [timeLogs, filteredShiftIds]
  );

  // Completion rate
  const completionRate = useMemo(
    () => (totalScheduled > 0 ? (completedCount / totalScheduled) * 100 : 0),
    [completedCount, totalScheduled]
  );

  // No-show rate (scheduled but not completed and not cancelled)
  const noShowCount = useMemo(() => {
    return filteredShifts.filter(s =>
      s.status !== "completed" && s.status !== "cancelled" && s.status !== "open" &&
      !filteredTimeLogShiftIds.has(s.id || "")
    ).length;
  }, [filteredShifts, filteredTimeLogShiftIds]);

  const noShowRate = useMemo(
    () => (totalScheduled > 0 ? (noShowCount / totalScheduled) * 100 : 0),
    [noShowCount, totalScheduled]
  );

  const withdrawalRate = useMemo(
    () => {
      const total = relevantApps.filter(a => a.status === "approved" || a.status === "withdrawn" || a.status === "withdrawal_pending").length;
      return total > 0 ? (withdrawalCount / total) * 100 : 0;
    },
    [withdrawalCount, relevantApps]
  );

  // Most reliable staff (highest completion rate)
  const reliableStaff = useMemo(() => {
    const staffShiftCounts = new Map<string, { total: number; completed: number }>();
    relevantApps
      .filter(a => a.status === "approved" || a.status === "withdrawn")
      .forEach(a => {
        if (!a.staffProfileId) return;
        if (!staffShiftCounts.has(a.staffProfileId)) {
          staffShiftCounts.set(a.staffProfileId, { total: 0, completed: 0 });
        }
        const entry = staffShiftCounts.get(a.staffProfileId)!;
        entry.total++;
        // Check if the shift was completed
        const shift = filteredShifts.find(s => s.id === a.shiftProfileId);
        if (shift?.status === "completed" && a.status === "approved") {
          entry.completed++;
        }
      });

    return Array.from(staffShiftCounts.entries())
      .filter(([, data]) => data.total >= 1)
      .map(([staffId, data]) => ({
        staffId,
        staff: staffMap.get(staffId),
        completionRate: (data.completed / data.total) * 100,
        total: data.total,
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  }, [relevantApps, filteredShifts, staffMap]);

  // Withdrawal leaderboard
  const withdrawalLeaderboard = useMemo(() => {
    const staffWithdrawals = new Map<string, number>();
    relevantApps
      .filter(a => a.status === "withdrawn" || a.status === "withdrawal_pending")
      .forEach(a => {
        if (!a.staffProfileId) return;
        staffWithdrawals.set(a.staffProfileId, (staffWithdrawals.get(a.staffProfileId) || 0) + 1);
      });

    return Array.from(staffWithdrawals.entries())
      .map(([staffId, count]) => ({
        staffId,
        staff: staffMap.get(staffId),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [relevantApps, staffMap]);

  const kpis: KpiChip[] = useMemo(
    () => [
      { label: "Scheduled", value: totalScheduled },
      { label: "Completed", value: completedCount },
      { label: "No-Show Rate", value: formatPercent(noShowRate) },
      { label: "Withdrawal Rate", value: formatPercent(withdrawalRate) },
    ],
    [totalScheduled, completedCount, noShowRate, withdrawalRate]
  );

  const handleDownloadCSV = useCallback(() => {
    const rows = filteredShifts.map(s => {
      const facility = facilityMap.get(s.facilityProfileId || "");
      // Find associated time log
      const tl = timeLogs.find(t => t.shiftProfileId === s.id);
      const staff = tl?.staffProfileId ? staffMap.get(tl.staffProfileId) : undefined;
      return {
        date: s.startDateTime ? format(parseISO(s.startDateTime), "yyyy-MM-dd") : "",
        facilityName: facility?.name || "Unknown",
        role: s.requiredRole || "",
        status: s.status || "",
        staffName: getStaffName(staff),
        clockIn: tl?.clockInTime || "",
        clockOut: tl?.clockOutTime || "",
        lateFlag: tl?.isLateBlocked ? "Yes" : "No",
        geofenceFlag: tl?.clockOutOutsideGeofence ? "Yes" : "No",
      };
    });
    downloadCSV(rows, getCSVFilename("attendance", dateRange.start, dateRange.end));
    toast.success("CSV downloaded");
  }, [filteredShifts, facilityMap, timeLogs, staffMap, dateRange]);

  return (
    <ReportSectionCard
      title="Attendance Report"
      icon={CalendarCheck}
      kpis={kpis}
      isLoading={isLoading}
      hasData={filteredShifts.length > 0}
      emptyIcon={CalendarCheck}
      emptyMessage="No shifts found for this date range"
      onDownloadCSV={handleDownloadCSV}
    >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Scheduled", value: totalScheduled },
            { label: "Completed", value: completedCount },
            { label: "Cancelled", value: cancelledCount },
            { label: "Withdrawals", value: withdrawalCount },
            { label: "Late Clock-ins", value: lateClockIns },
            { label: "Outside Geofence", value: outsideGeofence },
          ].map(item => (
            <div key={item.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Completion Rate Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Completion Rate</h4>
            <span className="text-sm font-semibold">{formatPercent(completionRate)}</span>
          </div>
          <Progress value={completionRate} className="h-3" />
        </div>

        {/* Most Reliable Staff */}
        {reliableStaff.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Most Reliable Staff</h4>
            <div className="space-y-2">
              {reliableStaff.map(entry => (
                <div key={entry.staffId} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-accent/10 text-accent">
                      {getStaffInitials(entry.staff)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{getStaffName(entry.staff)}</span>
                      <Badge className={`text-xs ${getRoleBadgeColor(entry.staff?.roleType)}`}>
                        {entry.staff?.roleType || "—"}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(entry.completionRate)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdrawal Leaderboard */}
        {withdrawalLeaderboard.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Withdrawal Leaderboard</h4>
            <div className="space-y-2">
              {withdrawalLeaderboard.map(entry => (
                <div key={entry.staffId} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                      {getStaffInitials(entry.staff)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{getStaffName(entry.staff)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {entry.count >= 3 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge variant="destructive" className="text-xs">
                      {entry.count} withdrawal{entry.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};