import { useMemo, useCallback } from "react";
import { DollarSign, TrendingUp, BarChart2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard, type KpiChip } from "@/components/ReportSectionCard";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  type DateRange,
  isDateInRange,
  formatCurrency,
  formatPercent,
  formatHours,
  downloadCSV,
  getCSVFilename,
  getStaffName,
  buildRateKey,
} from "@/utils/reportUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { cn } from "@/lib/utils";

interface Timesheet {
  id?: string;
  grossPay?: number;
  totalHours?: number;
  hourlyRate?: number;
  multiplier?: number;
  staffProfileId?: string;
  facilityProfileId?: string;
  shiftProfileId?: string;
  periodStart?: string;
}

interface Shift {
  id?: string;
  requiredRole?: string;
  isShortNotice?: boolean;
  isHoliday?: boolean;
  holidayMultiplier?: number;
  facilityProfileId?: string;
  startDateTime?: string;
}

interface StaffProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  roleType?: string;
}

interface Facility {
  id?: string;
  name?: string;
}

interface BillingRate {
  facilityProfileId?: string;
  roleType?: string;
  billingRate?: number;
  shortNoticeMultiplier?: number;
  holidayMultiplier?: number;
}

interface LaborCostSectionProps {
  timesheets: Timesheet[];
  shifts: Shift[];
  staffMap: Map<string, StaffProfile>;
  facilityMap: Map<string, Facility>;
  shiftMap: Map<string, Shift>;
  billingRatesMap: Map<string, BillingRate>;
  dateRange: DateRange;
  facilityFilter: string;
  isLoading: boolean;
}

export const LaborCostSection = ({
  timesheets,
  shifts,
  staffMap,
  facilityMap,
  shiftMap,
  billingRatesMap,
  dateRange,
  facilityFilter,
  isLoading,
}: LaborCostSectionProps) => {
  // Filter timesheets by date range and facility
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(ts => {
      // Use periodStart or look up the shift's startDateTime for date filtering
      const shift = shiftMap.get(ts.shiftProfileId || "");
      const dateToCheck = shift?.startDateTime || ts.periodStart;
      if (!isDateInRange(dateToCheck, dateRange)) return false;
      if (facilityFilter !== "all" && ts.facilityProfileId !== facilityFilter) return false;
      return true;
    });
  }, [timesheets, dateRange, facilityFilter, shiftMap]);

  // Calculate billing for each timesheet
  const enrichedTimesheets = useMemo(() => {
    return filteredTimesheets.map(ts => {
      const shift = shiftMap.get(ts.shiftProfileId || "");
      const role = shift?.requiredRole || "";
      const facId = ts.facilityProfileId || shift?.facilityProfileId || "";
      const rateKey = buildRateKey(facId, role);
      const billingRateRecord = billingRatesMap.get(rateKey);
      const billingRate = billingRateRecord?.billingRate || 0;
      const hours = ts.totalHours || 0;

      // Billing calculation: hours × billingRate × (shortNotice? snMultiplier : 1) × (holiday? holMultiplier : 1)
      const snMultiplier = shift?.isShortNotice ? (billingRateRecord?.shortNoticeMultiplier || 1) : 1;
      const holMultiplier = shift?.isHoliday ? (billingRateRecord?.holidayMultiplier || shift?.holidayMultiplier || 1.5) : 1;
      const billingAmount = Math.round(hours * billingRate * snMultiplier * holMultiplier * 100) / 100;

      return {
        ...ts,
        role,
        facilityId: facId,
        billingAmount,
        staffPay: ts.grossPay || 0,
        margin: billingAmount - (ts.grossPay || 0),
      };
    });
  }, [filteredTimesheets, shiftMap, billingRatesMap]);

  // Totals
  const totalStaffPay = useMemo(
    () => enrichedTimesheets.reduce((sum, t) => sum + t.staffPay, 0),
    [enrichedTimesheets]
  );
  const totalBilling = useMemo(
    () => enrichedTimesheets.reduce((sum, t) => sum + t.billingAmount, 0),
    [enrichedTimesheets]
  );
  const profitMargin = useMemo(() => totalBilling - totalStaffPay, [totalBilling, totalStaffPay]);
  const marginPercent = useMemo(
    () => (totalBilling > 0 ? (profitMargin / totalBilling) * 100 : 0),
    [profitMargin, totalBilling]
  );

  // By facility breakdown
  const facilityBreakdown = useMemo(() => {
    const map = new Map<string, { staffPay: number; billing: number }>();
    enrichedTimesheets.forEach(t => {
      const facId = t.facilityId;
      if (!map.has(facId)) map.set(facId, { staffPay: 0, billing: 0 });
      const entry = map.get(facId)!;
      entry.staffPay += t.staffPay;
      entry.billing += t.billingAmount;
    });
    return Array.from(map.entries())
      .map(([facId, data]) => ({
        facilityId: facId,
        facilityName: facilityMap.get(facId)?.name || "Unknown Facility",
        staffPay: data.staffPay,
        billing: data.billing,
        margin: data.billing - data.staffPay,
        marginPercent: data.billing > 0 ? ((data.billing - data.staffPay) / data.billing) * 100 : 0,
      }))
      .sort((a, b) => b.billing - a.billing);
  }, [enrichedTimesheets, facilityMap]);

  // By role type breakdown
  const roleBreakdown = useMemo(() => {
    const map = new Map<string, { hours: number; staffPay: number; billing: number }>();
    enrichedTimesheets.forEach(t => {
      const role = t.role || "Unknown";
      if (!map.has(role)) map.set(role, { hours: 0, staffPay: 0, billing: 0 });
      const entry = map.get(role)!;
      entry.hours += t.totalHours || 0;
      entry.staffPay += t.staffPay;
      entry.billing += t.billingAmount;
    });
    return Array.from(map.entries())
      .map(([role, data]) => ({
        role,
        hours: data.hours,
        staffPay: data.staffPay,
        billing: data.billing,
        margin: data.billing - data.staffPay,
      }))
      .sort((a, b) => b.billing - a.billing);
  }, [enrichedTimesheets]);

  const kpis: KpiChip[] = useMemo(
    () => [
      { label: "Staff Pay", value: formatCurrency(totalStaffPay) },
      { label: "Billing", value: formatCurrency(totalBilling) },
      { label: "Margin", value: formatCurrency(profitMargin) },
      { label: "Margin %", value: formatPercent(marginPercent) },
    ],
    [totalStaffPay, totalBilling, profitMargin, marginPercent]
  );

  const handleDownloadCSV = useCallback(() => {
    const rows = enrichedTimesheets.map(t => {
      const staff = staffMap.get(t.staffProfileId || "");
      const facility = facilityMap.get(t.facilityId);
      const shift = shiftMap.get(t.shiftProfileId || "");
      return {
        facilityName: facility?.name || "Unknown",
        role: t.role,
        staffName: getStaffName(staff),
        date: shift?.startDateTime ? format(parseISO(shift.startDateTime), "yyyy-MM-dd") : "",
        hours: t.totalHours || 0,
        staffPay: t.staffPay,
        billingAmount: t.billingAmount,
        margin: t.margin,
      };
    });
    downloadCSV(rows, getCSVFilename("labor-cost", dateRange.start, dateRange.end));
    toast.success("CSV downloaded");
  }, [enrichedTimesheets, staffMap, facilityMap, shiftMap, dateRange]);

  return (
    <ReportSectionCard
      title="Labor Cost Report"
      icon={DollarSign}
      kpis={kpis}
      isLoading={isLoading}
      hasData={enrichedTimesheets.length > 0}
      emptyIcon={DollarSign}
      emptyMessage="No timesheet data found for this date range"
      onDownloadCSV={handleDownloadCSV}
    >
      <div className="space-y-6">
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-l-4 border-l-accent p-4">
            <DollarSign className="h-8 w-8 text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Staff Pay</p>
              <p className="text-2xl font-bold">{formatCurrency(totalStaffPay)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-l-4 border-l-chart-1 p-4">
            <TrendingUp className="h-8 w-8 text-chart-1 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Billing</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBilling)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-l-4 border-l-chart-4 p-4">
            <BarChart2 className="h-8 w-8 text-chart-4 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">
                {formatCurrency(profitMargin)}{" "}
                <span className={cn("text-sm font-medium", profitMargin >= 0 ? "text-accent" : "text-destructive")}>
                  ({formatPercent(marginPercent)})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* By Facility Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">By Facility</h4>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-5 gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium pb-2 border-b">
                <span>Facility</span>
                <span className="text-right">Staff Pay</span>
                <span className="text-right">Billing</span>
                <span className="text-right">Margin</span>
                <span className="text-right">Margin %</span>
              </div>
              <div className="divide-y divide-border">
                {facilityBreakdown.map(row => (
                  <div
                    key={row.facilityId}
                    className="grid grid-cols-5 gap-2 py-2 text-sm hover:bg-muted/30"
                  >
                    <span className="font-medium truncate">{row.facilityName}</span>
                    <span className="text-right">{formatCurrency(row.staffPay)}</span>
                    <span className="text-right">{formatCurrency(row.billing)}</span>
                    <span className={cn("text-right font-medium", row.margin >= 0 ? "text-accent" : "text-destructive")}>
                      {formatCurrency(row.margin)}
                    </span>
                    <span className="text-right">{formatPercent(row.marginPercent)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* By Role Type Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">By Role Type</h4>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-5 gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium pb-2 border-b">
                <span>Role</span>
                <span className="text-right">Hours</span>
                <span className="text-right">Staff Pay</span>
                <span className="text-right">Billing</span>
                <span className="text-right">Margin</span>
              </div>
              <div className="divide-y divide-border">
                {roleBreakdown.map(row => (
                  <div
                    key={row.role}
                    className="grid grid-cols-5 gap-2 py-2 text-sm hover:bg-muted/30"
                  >
                    <span>
                      <Badge className={`text-xs ${getRoleBadgeColor(row.role)}`}>
                        {row.role}
                      </Badge>
                    </span>
                    <span className="text-right">{formatHours(row.hours)}</span>
                    <span className="text-right">{formatCurrency(row.staffPay)}</span>
                    <span className="text-right">{formatCurrency(row.billing)}</span>
                    <span className={cn("text-right font-medium", row.margin >= 0 ? "text-accent" : "text-destructive")}>
                      {formatCurrency(row.margin)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Margin Explanation */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Margin Calculation:</span> Billing Amount (what facilities pay) − Staff Pay (what ALJO pays workers) = ALJO&apos;s Margin. Short notice premiums are billed to facilities but not paid to staff.
          </p>
        </div>
      </div>
    </ReportSectionCard>
  );
};