import { useState, useMemo, useCallback, useEffect } from "react";
import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import {
  StaffProfilesEntity,
  TimesheetsEntity,
  ShiftsEntity,
  FacilitiesEntity,
  LoginPage,
} from "@/product-types";
import { getPageUrl } from "@/lib/utils";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Clock,
  DollarSign,
  ChevronDown,
  Download,
  Gift,
  MinusCircle,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCAD } from "@/utils/timesheetUtils";
import { downloadCSV, getCurrentPayPeriod, isDateInRange } from "@/utils/reportUtils";
import type { DateRange } from "@/utils/reportUtils";

type Timesheet = typeof TimesheetsEntity["instanceType"] & { id: string };
type Shift = typeof ShiftsEntity["instanceType"] & { id: string };
type Facility = typeof FacilitiesEntity["instanceType"] & { id: string };

type StatusFilter = "all" | "pending" | "approved" | "paid";
type DatePresetFilter =
  | "all_time"
  | "current_pay_period"
  | "previous_pay_period"
  | "this_month"
  | "last_month"
  | "custom";

interface PayPeriodGroup {
  periodStart: string;
  periodEnd: string;
  label: string;
  timesheets: Timesheet[];
  totalHours: number;
  totalGrossPay: number;
  bonusTotal: number;
  deductionTotal: number;
  netPay: number;
  status: "pending" | "approved" | "paid";
}

const STATUS_PRIORITY: Record<string, number> = { pending: 0, approved: 1, paid: 2 };

const getLowestStatus = (timesheets: Timesheet[]): "pending" | "approved" | "paid" => {
  let lowest: "pending" | "approved" | "paid" = "paid";
  for (const ts of timesheets) {
    const s = (ts.paymentStatus as "pending" | "approved" | "paid") || "pending";
    if (STATUS_PRIORITY[s] < STATUS_PRIORITY[lowest]) {
      lowest = s;
    }
  }
  return lowest;
};

const formatPeriodLabel = (start: string, end: string): string => {
  try {
    return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
  } catch {
    return `${start} – ${end}`;
  }
};

const formatShiftDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

const isBonus = (ts: Timesheet): boolean =>
  (ts.totalHours === 0 || ts.totalHours === undefined) &&
  typeof ts.adjustmentNote === "string" &&
  ts.adjustmentNote.startsWith("Bonus:");

const isDeduction = (ts: Timesheet): boolean =>
  typeof ts.grossPay === "number" && ts.grossPay < 0;

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-chart-3/20 text-chart-3",
    approved: "bg-primary/20 text-primary",
    paid: "bg-accent/20 text-accent",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    paid: "Paid",
  };
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", styles[status] || "bg-muted text-muted-foreground")}>
      {labels[status] || status}
    </Badge>
  );
};

const TypeCell = ({ ts }: { ts: Timesheet }) => {
  if (isBonus(ts)) {
    return (
      <div className="flex items-center gap-1.5">
        <Gift className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="text-xs font-medium text-accent">Bonus</span>
      </div>
    );
  }
  if (isDeduction(ts)) {
    return (
      <div className="flex items-center gap-1.5">
        <MinusCircle className="h-3.5 w-3.5 text-chart-3 shrink-0" />
        <span className="text-xs font-medium text-chart-3">Early Pay Deduction</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">Shift</span>
    </div>
  );
};

const STATUS_CHIP_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
];

const DATE_PRESET_OPTIONS: { value: DatePresetFilter; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "current_pay_period", label: "Current Pay Period" },
  { value: "previous_pay_period", label: "Previous Pay Period" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export default function StaffMyPayrolls() {
  const user = useUser();
  const navigate = useNavigate();
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePresetFilter>("all_time");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated }
  );
  const staffProfile = staffProfiles?.[0] as (typeof StaffProfilesEntity["instanceType"] & { id: string }) | undefined;
  const staffProfileId = staffProfile?.id;

  const { data: timesheetsRaw, isLoading: loadingTimesheets } = useEntityGetAll(
    TimesheetsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { data: shiftsRaw } = useEntityGetAll(ShiftsEntity, {}, { enabled: !!staffProfileId });
  const { data: facilitiesRaw } = useEntityGetAll(FacilitiesEntity, {}, { enabled: !!staffProfileId });

  const timesheets = useMemo(() => (timesheetsRaw || []) as Timesheet[], [timesheetsRaw]);
  const shifts = useMemo(() => (shiftsRaw || []) as Shift[], [shiftsRaw]);
  const facilities = useMemo(() => (facilitiesRaw || []) as Facility[], [facilitiesRaw]);

  const shiftMap = useMemo(() => {
    const m = new Map<string, Shift>();
    for (const s of shifts) m.set(s.id, s);
    return m;
  }, [shifts]);

  const facilityMap = useMemo(() => {
    const m = new Map<string, Facility>();
    for (const f of facilities) m.set(f.id, f);
    return m;
  }, [facilities]);

  const payPeriodGroups = useMemo((): PayPeriodGroup[] => {
    const groupMap = new Map<string, Timesheet[]>();
    for (const ts of timesheets) {
      if (!ts.periodStart || !ts.periodEnd) continue;
      const key = `${ts.periodStart}__${ts.periodEnd}`;
      const existing = groupMap.get(key) || [];
      existing.push(ts);
      groupMap.set(key, existing);
    }

    const groups: PayPeriodGroup[] = [];
    for (const [key, items] of groupMap.entries()) {
      const [periodStart, periodEnd] = key.split("__");
      const totalHours = items.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
      const totalGrossPay = items.reduce((sum, ts) => sum + (ts.grossPay || 0), 0);
      const bonusTotal = items.filter(isBonus).reduce((sum, ts) => sum + (ts.grossPay || 0), 0);
      const deductionTotal = items.filter(isDeduction).reduce((sum, ts) => sum + (ts.grossPay || 0), 0);
      const netPay = totalGrossPay;
      groups.push({
        periodStart,
        periodEnd,
        label: formatPeriodLabel(periodStart, periodEnd),
        timesheets: items,
        totalHours,
        totalGrossPay,
        bonusTotal,
        deductionTotal,
        netPay,
        status: getLowestStatus(items),
      });
    }

    return groups.sort((a, b) => {
      try {
        return parseISO(b.periodStart).getTime() - parseISO(a.periodStart).getTime();
      } catch {
        return 0;
      }
    });
  }, [timesheets]);

  // Summary stats — always unfiltered (lifetime totals)
  const summaryStats = useMemo(() => {
    const netEarned = timesheets.reduce((sum, ts) => sum + (ts.grossPay || 0), 0);
    const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
    const paidPeriods = payPeriodGroups.filter((g) => g.status === "paid").length;
    return { netEarned, totalHours, paidPeriods };
  }, [timesheets, payPeriodGroups]);

  // Compute the date range for the selected preset
  const activeDateRange = useMemo((): DateRange | null => {
    if (datePreset === "all_time") return null;
    if (datePreset === "current_pay_period") {
      return getCurrentPayPeriod();
    }
    if (datePreset === "previous_pay_period") {
      const current = getCurrentPayPeriod();
      const prevStart = new Date(current.start);
      prevStart.setDate(prevStart.getDate() - 14);
      const prevEnd = new Date(prevStart);
      prevEnd.setDate(prevEnd.getDate() + 13);
      prevEnd.setHours(23, 59, 59, 999);
      return { start: prevStart, end: prevEnd };
    }
    if (datePreset === "this_month") {
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (datePreset === "last_month") {
      const lastMonth = subMonths(new Date(), 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (datePreset === "custom") {
      if (!customStart && !customEnd) return null;
      const start = customStart ? new Date(customStart) : new Date(0);
      const end = customEnd ? new Date(customEnd) : new Date(8640000000000000);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return null;
  }, [datePreset, customStart, customEnd]);

  // Filtered groups (status + date, AND logic)
  const filteredGroups = useMemo(() => {
    return payPeriodGroups.filter((group) => {
      // Status filter
      if (statusFilter !== "all" && group.status !== statusFilter) return false;
      // Date filter
      if (activeDateRange) {
        if (!isDateInRange(group.periodStart, activeDateRange)) return false;
      }
      return true;
    });
  }, [payPeriodGroups, statusFilter, activeDateRange]);

  const isFiltered = statusFilter !== "all" || datePreset !== "all_time";

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setDatePreset("all_time");
    setCustomStart("");
    setCustomEnd("");
  }, []);

  const togglePeriod = useCallback((key: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDownloadCSV = useCallback(
    (group: PayPeriodGroup) => {
      const rows = group.timesheets.map((ts) => {
        if (isBonus(ts)) {
          const reason = ts.adjustmentNote?.replace(/^Bonus:\s*/, "") || "";
          return {
            Type: "Bonus",
            Date: group.periodStart,
            Facility: "-",
            Role: "Bonus",
            "Hours": "-",
            "Rate ($/hr)": "-",
            Multiplier: "-",
            "Gross Pay": formatCAD(ts.grossPay || 0),
            Status: ts.paymentStatus || "pending",
            Notes: reason,
          };
        }
        if (isDeduction(ts)) {
          return {
            Type: "Early Pay Deduction",
            Date: group.periodStart,
            Facility: "-",
            Role: "Early Pay Deduction",
            "Hours": "-",
            "Rate ($/hr)": "-",
            Multiplier: "-",
            "Gross Pay": formatCAD(ts.grossPay || 0),
            Status: ts.paymentStatus || "pending",
            Notes: ts.adjustmentNote || "",
          };
        }
        const shift = ts.shiftProfileId ? shiftMap.get(ts.shiftProfileId) : undefined;
        const facility = ts.facilityProfileId ? facilityMap.get(ts.facilityProfileId) : undefined;
        const shiftDate = shift?.startDateTime ? format(parseISO(shift.startDateTime), "yyyy-MM-dd") : group.periodStart;
        return {
          Type: "Shift",
          Date: shiftDate,
          Facility: facility?.name || "—",
          Role: shift?.requiredRole || "—",
          "Hours": ts.totalHours?.toFixed(2) || "0",
          "Rate ($/hr)": ts.hourlyRate?.toFixed(2) || "0",
          Multiplier: ts.multiplier?.toFixed(2) || "1.00",
          "Gross Pay": formatCAD(ts.grossPay || 0),
          Status: ts.paymentStatus || "pending",
          Notes: ts.adjustmentNote || "",
        };
      });

      const hasExtras = group.bonusTotal !== 0 || group.deductionTotal !== 0;
      if (hasExtras) {
        const regularGross = group.timesheets
          .filter((ts) => !isBonus(ts) && !isDeduction(ts))
          .reduce((sum, ts) => sum + (ts.grossPay || 0), 0);
        rows.push({
          Type: "— Period Total —",
          Date: "",
          Facility: "",
          Role: "",
          "Hours": group.totalHours.toFixed(2),
          "Rate ($/hr)": "",
          Multiplier: "",
          "Gross Pay": formatCAD(regularGross),
          Status: "",
          Notes: `Shift gross: ${formatCAD(regularGross)}`,
        });
        rows.push({
          Type: "— Net Pay —",
          Date: "",
          Facility: "",
          Role: "",
          "Hours": "",
          "Rate ($/hr)": "",
          Multiplier: "",
          "Gross Pay": formatCAD(group.netPay),
          Status: "",
          Notes: `Includes bonuses (${formatCAD(group.bonusTotal)}) and deductions (${formatCAD(group.deductionTotal)})`,
        });
      }

      downloadCSV(rows, `payroll-${group.periodStart}-${group.periodEnd}.csv`);
    },
    [shiftMap, facilityMap]
  );

  const isLoading = loadingProfile || loadingTimesheets;

  if (!user.isAuthenticated) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shrink-0">
          <Wallet className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Payrolls</h1>
          <p className="text-sm text-muted-foreground">Your complete payment history including bonuses & deductions</p>
        </div>
      </div>

      {/* Summary Stats Bar — always unfiltered */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs text-muted-foreground font-medium truncate">Net Earned</span>
            </div>
            <p className="text-base md:text-lg font-bold text-accent">{formatCAD(summaryStats.netEarned)}</p>
          </Card>
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium truncate">Total Hours</span>
            </div>
            <p className="text-base md:text-lg font-bold">{summaryStats.totalHours.toFixed(1)}h</p>
          </Card>
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-chart-4 shrink-0" />
              <span className="text-xs text-muted-foreground font-medium truncate">Paid Periods</span>
            </div>
            <p className="text-base md:text-lg font-bold">{summaryStats.paidPeriods}</p>
          </Card>
        </div>
      )}

      {/* Filter Bar — shown when there are records or loading */}
      {!isLoading && staffProfile && payPeriodGroups.length > 0 && (
        <div className="space-y-2">
          {/* Main filter row */}
          <Card className="p-3 bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Status chips */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {STATUS_CHIP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border transition-colors min-h-[32px] min-w-[44px]",
                      statusFilter === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Date preset select */}
              <div className="sm:w-auto w-full">
                <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePresetFilter)}>
                  <SelectTrigger className="h-9 text-xs sm:w-[180px] w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Custom date range inputs */}
          {datePreset === "custom" && (
            <Card className="p-3 bg-muted/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap w-8">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap w-8">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* No Profile State */}
      {!isLoading && !staffProfile && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-muted-foreground">Profile not found</p>
            <p className="text-sm text-muted-foreground">Complete your staff profile to view payroll records.</p>
          </CardContent>
        </Card>
      )}

      {/* True empty state — no records at all */}
      {!isLoading && staffProfile && payPeriodGroups.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No payroll records yet</p>
            <p className="text-sm text-muted-foreground">Completed shifts will appear here after payroll is processed.</p>
          </CardContent>
        </Card>
      )}

      {/* Filtered empty state — records exist but none match filters */}
      {!isLoading && staffProfile && payPeriodGroups.length > 0 && filteredGroups.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[180px] gap-3 text-center p-6">
            <Filter className="h-9 w-9 text-muted-foreground" />
            <div>
              <p className="font-semibold">No payroll records match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting or clearing your filters to see more results.</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5 mt-1">
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pay Period Cards */}
      {!isLoading && filteredGroups.length > 0 && (
        <div className="space-y-3">
          {/* Active filter indicator */}
          {isFiltered && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                Showing <span className="font-semibold text-foreground">{filteredGroups.length}</span> of{" "}
                <span className="font-semibold text-foreground">{payPeriodGroups.length}</span> pay periods
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
          )}

          {filteredGroups.map((group) => {
            const key = `${group.periodStart}__${group.periodEnd}`;
            const isOpen = expandedPeriods.has(key);
            const regularEntries = group.timesheets.filter((ts) => !isBonus(ts) && !isDeduction(ts));
            const bonusEntries = group.timesheets.filter(isBonus);
            const deductionEntries = group.timesheets.filter(isDeduction);
            const hasExtras = group.bonusTotal !== 0 || group.deductionTotal !== 0;
            const regularGrossPay = regularEntries.reduce((sum, ts) => sum + (ts.grossPay || 0), 0);

            return (
              <Collapsible key={key} open={isOpen} onOpenChange={() => togglePeriod(key)}>
                <Card className="shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm md:text-base truncate">{group.label}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {/* Hours chip */}
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {group.totalHours.toFixed(1)}h
                            </span>
                            {/* Entry count */}
                            <span className="text-xs text-muted-foreground">
                              {group.timesheets.length} {group.timesheets.length === 1 ? "entry" : "entries"}
                            </span>
                            {/* Bonus chip */}
                            {group.bonusTotal > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-accent/15 text-accent min-h-[20px]">
                                <Gift className="h-3 w-3" />
                                Bonus {formatCAD(group.bonusTotal)}
                              </span>
                            )}
                            {/* Early Pay Deduction chip */}
                            {group.deductionTotal < 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-chart-3/15 text-chart-3 min-h-[20px]">
                                <MinusCircle className="h-3 w-3" />
                                Early Pay {formatCAD(Math.abs(group.deductionTotal))}
                              </span>
                            )}
                            {/* Net Pay */}
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCAD(group.netPay)}
                              <span className="text-xs font-normal text-muted-foreground ml-0.5">net</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <StatusBadge status={group.status} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCSV(group);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">CSV</span>
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <Separator />

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Facility</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Multiplier</TableHead>
                            <TableHead className="text-right">Gross Pay</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Regular rows */}
                          {regularEntries.map((ts) => {
                            const shift = ts.shiftProfileId ? shiftMap.get(ts.shiftProfileId) : undefined;
                            const facility = ts.facilityProfileId ? facilityMap.get(ts.facilityProfileId) : undefined;
                            const shiftDate = shift?.startDateTime ? formatShiftDate(shift.startDateTime) : "—";
                            const multiplier = ts.multiplier || 1;
                            return (
                              <TableRow key={ts.id}>
                                <TableCell className="text-sm">{shiftDate}</TableCell>
                                <TableCell>
                                  <TypeCell ts={ts} />
                                </TableCell>
                                <TableCell className="text-sm">{facility?.name || "—"}</TableCell>
                                <TableCell>
                                  {shift?.requiredRole && (
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                      {shift.requiredRole}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm">{(ts.totalHours || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right text-sm">${(ts.hourlyRate || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right text-sm">
                                  {multiplier > 1 ? (
                                    <span className="text-chart-3 font-medium">×{multiplier.toFixed(1)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">×1.0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">{formatCAD(ts.grossPay || 0)}</TableCell>
                                <TableCell><StatusBadge status={ts.paymentStatus || "pending"} /></TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Bonus rows */}
                          {bonusEntries.map((ts) => {
                            const reason = ts.adjustmentNote?.replace(/^Bonus:\s*/, "") || "";
                            return (
                              <TableRow key={ts.id} className="bg-accent/5">
                                <TableCell className="text-sm text-muted-foreground">—</TableCell>
                                <TableCell>
                                  <TypeCell ts={ts} />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground italic" colSpan={2}>{reason || "Bonus payment"}</TableCell>
                                <TableCell colSpan={3} />
                                <TableCell className="text-right text-sm font-bold text-accent">{formatCAD(ts.grossPay || 0)}</TableCell>
                                <TableCell><StatusBadge status={ts.paymentStatus || "pending"} /></TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Deduction rows */}
                          {deductionEntries.map((ts) => (
                            <TableRow key={ts.id} className="bg-chart-3/5">
                              <TableCell className="text-sm text-muted-foreground">—</TableCell>
                              <TableCell>
                                <TypeCell ts={ts} />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground italic" colSpan={2}>{ts.adjustmentNote || "Early pay deduction"}</TableCell>
                              <TableCell colSpan={3} />
                              <TableCell className="text-right text-sm font-bold text-destructive">{formatCAD(ts.grossPay || 0)}</TableCell>
                              <TableCell><StatusBadge status={ts.paymentStatus || "pending"} /></TableCell>
                            </TableRow>
                          ))}

                          {/* Period Total subtotal row */}
                          <TableRow className="bg-muted/30 border-t">
                            <TableCell colSpan={4} className="font-bold text-sm">Period Total</TableCell>
                            <TableCell className="text-right font-bold text-sm">{group.totalHours.toFixed(2)}</TableCell>
                            <TableCell colSpan={2} />
                            <TableCell className="text-right font-bold text-sm">{formatCAD(regularGrossPay)}</TableCell>
                            <TableCell />
                          </TableRow>

                          {/* Net Pay row */}
                          {hasExtras && (
                            <TableRow className="bg-primary/10 border-t-2">
                              <TableCell colSpan={7} className="font-bold text-sm text-primary">
                                Net Pay <span className="font-normal text-xs text-muted-foreground">(after bonuses &amp; deductions)</span>
                              </TableCell>
                              <TableCell className="text-right font-bold text-base text-primary">{formatCAD(group.netPay)}</TableCell>
                              <TableCell />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden p-3 space-y-2">
                      {regularEntries.map((ts) => {
                        const shift = ts.shiftProfileId ? shiftMap.get(ts.shiftProfileId) : undefined;
                        const facility = ts.facilityProfileId ? facilityMap.get(ts.facilityProfileId) : undefined;
                        const shiftDate = shift?.startDateTime ? formatShiftDate(shift.startDateTime) : "—";
                        const multiplier = ts.multiplier || 1;
                        return (
                          <div key={ts.id} className="rounded-md border bg-card p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TypeCell ts={ts} />
                                <span className="text-sm font-medium">{shiftDate}</span>
                              </div>
                              <StatusBadge status={ts.paymentStatus || "pending"} />
                            </div>
                            <p className="text-xs text-muted-foreground">{facility?.name || "—"}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {shift?.requiredRole && (
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                    {shift.requiredRole}
                                  </Badge>
                                )}
                                {multiplier > 1 && (
                                  <span className="text-xs text-chart-3 font-medium">×{multiplier.toFixed(1)}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{formatCAD(ts.grossPay || 0)}</p>
                                <p className="text-xs text-muted-foreground">{(ts.totalHours || 0).toFixed(2)}h @ ${(ts.hourlyRate || 0).toFixed(2)}/hr</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {bonusEntries.map((ts) => {
                        const reason = ts.adjustmentNote?.replace(/^Bonus:\s*/, "") || "";
                        return (
                          <div key={ts.id} className="rounded-md border bg-accent/5 p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TypeCell ts={ts} />
                              </div>
                              <span className="text-sm font-bold text-accent">{formatCAD(ts.grossPay || 0)}</span>
                            </div>
                            {reason && <p className="text-xs text-muted-foreground mt-1 italic">{reason}</p>}
                          </div>
                        );
                      })}

                      {deductionEntries.map((ts) => (
                        <div key={ts.id} className="rounded-md border bg-chart-3/5 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TypeCell ts={ts} />
                            </div>
                            <span className="text-sm font-bold text-destructive">{formatCAD(ts.grossPay || 0)}</span>
                          </div>
                          {ts.adjustmentNote && <p className="text-xs text-muted-foreground mt-1 italic">{ts.adjustmentNote}</p>}
                        </div>
                      ))}

                      {/* Mobile Period Total */}
                      <div className="rounded-md bg-muted/30 border p-3 flex items-center justify-between">
                        <span className="text-sm font-bold">Period Total</span>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCAD(regularGrossPay)}</p>
                          <p className="text-xs text-muted-foreground">{group.totalHours.toFixed(2)}h</p>
                        </div>
                      </div>

                      {/* Mobile Net Pay card */}
                      {hasExtras && (
                        <div className="rounded-md bg-primary/5 border border-l-4 border-l-primary p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-primary">Net Pay</p>
                            <p className="text-xs text-muted-foreground">After bonuses &amp; deductions</p>
                          </div>
                          <p className="text-base font-bold text-primary">{formatCAD(group.netPay)}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}