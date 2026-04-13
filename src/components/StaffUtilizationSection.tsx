import { useMemo, useCallback } from "react";
import { BarChart3, AlertTriangle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ReportSectionCard, type KpiChip } from "@/components/ReportSectionCard";
import { toast } from "sonner";
import { format, parseISO, differenceInMinutes } from "date-fns";
import {
  type DateRange,
  isDateInRange,
  formatPercent,
  formatDuration,
  downloadCSV,
  getCSVFilename,
} from "@/utils/reportUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface Shift {
  id?: string;
  status?: string;
  requiredRole?: string;
  facilityProfileId?: string;
  startDateTime?: string;
  headcount?: number;
  filledCount?: number;
  createdAt?: string;
}

interface ShiftApplication {
  id?: string;
  status?: string;
  staffProfileId?: string;
  shiftProfileId?: string;
  appliedAt?: string;
  respondedAt?: string;
}

interface Facility {
  id?: string;
  name?: string;
}

interface StaffUtilizationSectionProps {
  shifts: Shift[];
  shiftApplications: ShiftApplication[];
  facilityMap: Map<string, Facility>;
  dateRange: DateRange;
  facilityFilter: string;
  isLoading: boolean;
}

export const StaffUtilizationSection = ({
  shifts,
  shiftApplications,
  facilityMap,
  dateRange,
  facilityFilter,
  isLoading,
}: StaffUtilizationSectionProps) => {
  // Filter shifts by date range and facility
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      if (!isDateInRange(s.startDateTime, dateRange)) return false;
      if (facilityFilter !== "all" && s.facilityProfileId !== facilityFilter) return false;
      return true;
    });
  }, [shifts, dateRange, facilityFilter]);

  // Total shifts posted & filled
  const totalPosted = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + (s.headcount || 1), 0),
    [filteredShifts]
  );
  const totalFilled = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + (s.filledCount || 0), 0),
    [filteredShifts]
  );
  const fillRate = useMemo(
    () => (totalPosted > 0 ? (totalFilled / totalPosted) * 100 : 0),
    [totalPosted, totalFilled]
  );

  // Average time to fill: from shift createdAt to first approved application respondedAt
  const avgTimeToFill = useMemo(() => {
    const filteredShiftIds = new Set(filteredShifts.map(s => s.id).filter(Boolean));
    const approvedApps = shiftApplications.filter(
      a => a.status === "approved" && a.respondedAt && filteredShiftIds.has(a.shiftProfileId || "")
    );

    // Group by shift to find the first approved per shift
    const shiftFirstApproved = new Map<string, string>();
    approvedApps.forEach(a => {
      const shiftId = a.shiftProfileId || "";
      const existing = shiftFirstApproved.get(shiftId);
      if (!existing || (a.respondedAt && a.respondedAt < existing)) {
        shiftFirstApproved.set(shiftId, a.respondedAt!);
      }
    });

    let totalMinutes = 0;
    let count = 0;
    shiftFirstApproved.forEach((respondedAt, shiftId) => {
      const shift = filteredShifts.find(s => s.id === shiftId);
      if (shift?.createdAt) {
        try {
          const created = parseISO(shift.createdAt);
          const responded = parseISO(respondedAt);
          const diffMin = differenceInMinutes(responded, created);
          if (diffMin > 0) {
            totalMinutes += diffMin;
            count++;
          }
        } catch { /* skip */ }
      }
    });

    return count > 0 ? totalMinutes / count : 0;
  }, [filteredShifts, shiftApplications]);

  // By role type
  const roleBreakdown = useMemo(() => {
    const map = new Map<string, { posted: number; filled: number }>();
    filteredShifts.forEach(s => {
      const role = s.requiredRole || "Unknown";
      if (!map.has(role)) map.set(role, { posted: 0, filled: 0 });
      const entry = map.get(role)!;
      entry.posted += s.headcount || 1;
      entry.filled += s.filledCount || 0;
    });
    return Array.from(map.entries())
      .map(([role, data]) => ({
        role,
        posted: data.posted,
        filled: data.filled,
        fillRate: data.posted > 0 ? (data.filled / data.posted) * 100 : 0,
      }))
      .sort((a, b) => a.fillRate - b.fillRate);
  }, [filteredShifts]);

  // Facilities with highest unfilled rate
  const facilityUnfilled = useMemo(() => {
    const map = new Map<string, { posted: number; filled: number }>();
    filteredShifts.forEach(s => {
      const facId = s.facilityProfileId || "unknown";
      if (!map.has(facId)) map.set(facId, { posted: 0, filled: 0 });
      const entry = map.get(facId)!;
      entry.posted += s.headcount || 1;
      entry.filled += s.filledCount || 0;
    });
    return Array.from(map.entries())
      .map(([facId, data]) => ({
        facilityId: facId,
        facilityName: facilityMap.get(facId)?.name || "Unknown Facility",
        unfilled: data.posted - data.filled,
        unfilledRate: data.posted > 0 ? ((data.posted - data.filled) / data.posted) * 100 : 0,
        total: data.posted,
      }))
      .filter(f => f.unfilled > 0)
      .sort((a, b) => b.unfilledRate - a.unfilledRate);
  }, [filteredShifts, facilityMap]);

  // Most requested roles chart data (by total applications)
  const mostRequestedData = useMemo(() => {
    const filteredShiftIds = new Set(filteredShifts.map(s => s.id).filter(Boolean));
    const roleAppCounts = new Map<string, number>();

    shiftApplications.forEach(a => {
      if (!filteredShiftIds.has(a.shiftProfileId || "")) return;
      const shift = filteredShifts.find(s => s.id === a.shiftProfileId);
      if (!shift) return;
      const role = shift.requiredRole || "Unknown";
      roleAppCounts.set(role, (roleAppCounts.get(role) || 0) + 1);
    });

    return Array.from(roleAppCounts.entries())
      .map(([role, count]) => ({ role, applications: count }))
      .sort((a, b) => b.applications - a.applications);
  }, [filteredShifts, shiftApplications]);

  const chartConfig = useMemo(
    () => ({
      applications: {
        label: "Applications",
        color: "hsl(var(--chart-1))",
      },
    }),
    []
  );

  // Most requested role label
  const mostRequestedRole = useMemo(
    () => (mostRequestedData.length > 0 ? mostRequestedData[0].role : "N/A"),
    [mostRequestedData]
  );

  const kpis: KpiChip[] = useMemo(
    () => [
      { label: "Shifts Posted", value: totalPosted },
      { label: "Fill Rate", value: formatPercent(fillRate) },
      { label: "Avg Fill Time", value: formatDuration(avgTimeToFill) },
      { label: "Top Role", value: mostRequestedRole },
    ],
    [totalPosted, fillRate, avgTimeToFill, mostRequestedRole]
  );

  const handleDownloadCSV = useCallback(() => {
    const rows = filteredShifts.map(s => {
      const facility = facilityMap.get(s.facilityProfileId || "");
      return {
        facilityName: facility?.name || "Unknown",
        role: s.requiredRole || "",
        shiftDate: s.startDateTime ? format(parseISO(s.startDateTime), "yyyy-MM-dd") : "",
        status: s.status || "",
        headcount: s.headcount || 1,
        filledCount: s.filledCount || 0,
        fillRate: (s.headcount || 1) > 0
          ? formatPercent(((s.filledCount || 0) / (s.headcount || 1)) * 100)
          : "0%",
      };
    });
    downloadCSV(rows, getCSVFilename("staff-utilization", dateRange.start, dateRange.end));
    toast.success("CSV downloaded");
  }, [filteredShifts, facilityMap, dateRange]);

  return (
    <ReportSectionCard
      title="Staff Utilization"
      icon={BarChart3}
      kpis={kpis}
      isLoading={isLoading}
      hasData={filteredShifts.length > 0}
      emptyIcon={BarChart3}
      emptyMessage="No shift data found for this date range"
      onDownloadCSV={handleDownloadCSV}
    >
      <div className="space-y-6">
        {/* Fill Rate Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Overall Fill Rate</h4>
            <span className="text-sm font-semibold">{formatPercent(fillRate)}</span>
          </div>
          <Progress value={fillRate} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {totalFilled} filled out of {totalPosted} posted slots
          </p>
        </div>

        {/* Average Time to Fill */}
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <Clock className="h-8 w-8 text-chart-1 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Average Time to Fill</p>
            <p className="text-xl font-bold">{formatDuration(avgTimeToFill)}</p>
          </div>
        </div>

        {/* By Role Type Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">Fill Rate by Role</h4>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-4 gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium pb-2 border-b">
                <span>Role</span>
                <span className="text-right">Posted</span>
                <span className="text-right">Filled</span>
                <span className="text-right">Fill Rate</span>
              </div>
              <div className="divide-y divide-border">
                {roleBreakdown.map(row => (
                  <div
                    key={row.role}
                    className="grid grid-cols-4 gap-2 py-2 text-sm hover:bg-muted/30"
                  >
                    <span>
                      <Badge className={`text-xs ${getRoleBadgeColor(row.role)}`}>
                        {row.role}
                      </Badge>
                    </span>
                    <span className="text-right">{row.posted}</span>
                    <span className="text-right">{row.filled}</span>
                    <span className="text-right font-medium">{formatPercent(row.fillRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Facilities with Highest Unfilled Rate */}
        {facilityUnfilled.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Facilities with Highest Unfilled Rate</h4>
            <div className="space-y-2">
              {facilityUnfilled.slice(0, 5).map(f => (
                <div key={f.facilityId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{f.facilityName}</span>
                    <p className="text-xs text-muted-foreground">
                      {f.unfilled} unfilled of {f.total} slots
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {f.unfilledRate > 50 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge
                      variant={f.unfilledRate > 50 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {formatPercent(f.unfilledRate)} unfilled
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Requested Roles - Horizontal Bar Chart */}
        {mostRequestedData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Most Requested Roles</h4>
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <BarChart data={mostRequestedData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="role" type="category" width={50} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="applications"
                  fill="var(--color-applications)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};