import { useMemo, useCallback } from "react";
import { Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ReportSectionCard, type KpiChip } from "@/components/ReportSectionCard";
import { toast } from "sonner";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import {
  type DateRange,
  isDateInRange,
  formatHours,
  downloadCSV,
  getCSVFilename,
  getStaffName,
  getStaffInitials,
} from "@/utils/reportUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface TimeLog {
  id?: string;
  totalHours?: number;
  clockInTime?: string;
  clockOutTime?: string;
  breakMinutes?: number;
  staffProfileId?: string;
  shiftProfileId?: string;
}

interface StaffProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  roleType?: string;
  orientedFacilityIds?: string[];
}

interface Facility {
  id?: string;
  name?: string;
}

interface Shift {
  id?: string;
  facilityProfileId?: string;
}

interface HoursSummarySectionProps {
  timeLogs: TimeLog[];
  staffMap: Map<string, StaffProfile>;
  facilityMap: Map<string, Facility>;
  shiftMap: Map<string, Shift>;
  dateRange: DateRange;
  facilityFilter: string;
  isLoading: boolean;
}

export const HoursSummarySection = ({
  timeLogs,
  staffMap,
  facilityMap,
  shiftMap,
  dateRange,
  facilityFilter,
  isLoading,
}: HoursSummarySectionProps) => {
  // Filter time logs by date range and facility
  const filteredLogs = useMemo(() => {
    return timeLogs.filter(log => {
      if (!isDateInRange(log.clockInTime, dateRange)) return false;
      if (facilityFilter !== "all") {
        const shift = shiftMap.get(log.shiftProfileId || "");
        if (!shift || shift.facilityProfileId !== facilityFilter) return false;
      }
      return true;
    });
  }, [timeLogs, dateRange, facilityFilter, shiftMap]);

  // Compute metrics
  const totalHours = useMemo(
    () => filteredLogs.reduce((sum, l) => sum + (l.totalHours || 0), 0),
    [filteredLogs]
  );

  const uniqueStaffIds = useMemo(() => {
    const ids = new Set<string>();
    filteredLogs.forEach(l => { if (l.staffProfileId) ids.add(l.staffProfileId); });
    return ids;
  }, [filteredLogs]);

  const avgHoursPerStaff = useMemo(
    () => (uniqueStaffIds.size > 0 ? totalHours / uniqueStaffIds.size : 0),
    [totalHours, uniqueStaffIds]
  );

  // Staff hours aggregation
  const staffHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach(l => {
      if (l.staffProfileId) {
        map.set(l.staffProfileId, (map.get(l.staffProfileId) || 0) + (l.totalHours || 0));
      }
    });
    return map;
  }, [filteredLogs]);

  const sortedStaffByHours = useMemo(() => {
    return Array.from(staffHoursMap.entries())
      .map(([id, hours]) => ({ id, hours, staff: staffMap.get(id) }))
      .sort((a, b) => b.hours - a.hours);
  }, [staffHoursMap, staffMap]);

  const topStaffHours = useMemo(() => sortedStaffByHours[0]?.hours || 0, [sortedStaffByHours]);

  // Daily chart data
  const dailyChartData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    const dayMap = new Map<string, number>();
    days.forEach(d => dayMap.set(format(d, "yyyy-MM-dd"), 0));

    filteredLogs.forEach(l => {
      if (l.clockInTime) {
        try {
          const key = format(parseISO(l.clockInTime), "yyyy-MM-dd");
          if (dayMap.has(key)) {
            dayMap.set(key, (dayMap.get(key) || 0) + (l.totalHours || 0));
          }
        } catch { /* skip invalid dates */ }
      }
    });

    return days.map(d => {
      const key = format(d, "yyyy-MM-dd");
      return {
        date: format(d, "MMM d"),
        hours: Math.round((dayMap.get(key) || 0) * 10) / 10,
      };
    });
  }, [filteredLogs, dateRange]);

  // By facility data
  const facilityData = useMemo(() => {
    const map = new Map<string, { hours: number; staffIds: Set<string> }>();
    filteredLogs.forEach(l => {
      const shift = shiftMap.get(l.shiftProfileId || "");
      const facId = shift?.facilityProfileId || "unknown";
      if (!map.has(facId)) map.set(facId, { hours: 0, staffIds: new Set() });
      const entry = map.get(facId)!;
      entry.hours += l.totalHours || 0;
      if (l.staffProfileId) entry.staffIds.add(l.staffProfileId);
    });
    return Array.from(map.entries())
      .map(([facId, data]) => ({
        facilityId: facId,
        facilityName: facilityMap.get(facId)?.name || "Unknown Facility",
        totalHours: Math.round(data.hours * 10) / 10,
        staffCount: data.staffIds.size,
        avgHours: data.staffIds.size > 0 ? Math.round((data.hours / data.staffIds.size) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredLogs, shiftMap, facilityMap]);

  const chartConfig = useMemo(
    () => ({
      hours: {
        label: "Hours",
        color: "hsl(var(--chart-1))",
      },
    }),
    []
  );

  // KPIs
  const kpis: KpiChip[] = useMemo(
    () => [
      { label: "Total Hours", value: formatHours(totalHours) },
      { label: "Avg/Staff", value: formatHours(avgHoursPerStaff) },
      { label: "Top Earner", value: formatHours(topStaffHours) },
      { label: "Staff Count", value: uniqueStaffIds.size },
    ],
    [totalHours, avgHoursPerStaff, topStaffHours, uniqueStaffIds]
  );

  const handleDownloadCSV = useCallback(() => {
    const rows = filteredLogs.map(log => {
      const staff = staffMap.get(log.staffProfileId || "");
      const shift = shiftMap.get(log.shiftProfileId || "");
      const facility = facilityMap.get(shift?.facilityProfileId || "");
      return {
        staffName: getStaffName(staff),
        facilityName: facility?.name || "Unknown",
        date: log.clockInTime ? format(parseISO(log.clockInTime), "yyyy-MM-dd") : "",
        totalHours: log.totalHours || 0,
        breakMinutes: log.breakMinutes || 0,
        netHours: log.totalHours || 0,
      };
    });
    downloadCSV(rows, getCSVFilename("hours-summary", dateRange.start, dateRange.end));
    toast.success("CSV downloaded");
  }, [filteredLogs, staffMap, shiftMap, facilityMap, dateRange]);

  const maxStaffHours = useMemo(() => {
    if (sortedStaffByHours.length === 0) return 0;
    return sortedStaffByHours[0].hours;
  }, [sortedStaffByHours]);

  return (
    <ReportSectionCard
      title="Hours Summary"
      icon={Clock}
      kpis={kpis}
      isLoading={isLoading}
      hasData={filteredLogs.length > 0}
      emptyIcon={Clock}
      emptyMessage="No time logs found for this date range"
      onDownloadCSV={handleDownloadCSV}
    >
      <div className="space-y-6">
        {/* Daily Hours Bar Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Daily Hours</h4>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" minTickGap={30} className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* By Facility Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">By Facility</h4>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-4 gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium pb-2 border-b">
                <span>Facility</span>
                <span className="text-right">Total Hours</span>
                <span className="text-right">Staff Count</span>
                <span className="text-right">Avg Hrs/Staff</span>
              </div>
              <div className="divide-y divide-border">
                {facilityData.map(row => (
                  <div
                    key={row.facilityId}
                    className="grid grid-cols-4 gap-2 py-2 text-sm hover:bg-muted/30"
                  >
                    <span className="font-medium truncate">{row.facilityName}</span>
                    <span className="text-right">{formatHours(row.totalHours)}</span>
                    <span className="text-right">{row.staffCount}</span>
                    <span className="text-right">{formatHours(row.avgHours)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Staff by Hours */}
        {sortedStaffByHours.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Top 5 Staff by Hours</h4>
            <div className="space-y-2">
              {sortedStaffByHours.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getStaffInitials(entry.staff)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{getStaffName(entry.staff)}</span>
                      <Badge className={`text-xs ${getRoleBadgeColor(entry.staff?.roleType)}`}>
                        {entry.staff?.roleType || "—"}
                      </Badge>
                    </div>
                    <Progress
                      value={maxStaffHours > 0 ? (entry.hours / maxStaffHours) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatHours(entry.hours)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom 5 Staff by Hours */}
        {sortedStaffByHours.length > 5 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Bottom 5 Staff by Hours</h4>
            <div className="space-y-2">
              {sortedStaffByHours.slice(-5).reverse().map(entry => (
                <div key={entry.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {getStaffInitials(entry.staff)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{getStaffName(entry.staff)}</span>
                      <Badge className={`text-xs ${getRoleBadgeColor(entry.staff?.roleType)}`}>
                        {entry.staff?.roleType || "—"}
                      </Badge>
                    </div>
                    <Progress
                      value={maxStaffHours > 0 ? (entry.hours / maxStaffHours) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatHours(entry.hours)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};