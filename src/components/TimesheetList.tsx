import { useState, useMemo, useCallback, useRef } from "react";
import { CheckCircle, CreditCard, ClipboardList, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TimesheetStaffGroup } from "@/components/TimesheetStaffGroup";
import { StaffOutstandingBalances } from "@/components/StaffOutstandingBalances";
import { MarkAllPaidDialog } from "@/components/MarkAllPaidDialog";
import {
  type TimesheetWithRelations,
  type TimesheetTabValue,
  filterTimesheetsByTab,
  filterTimesheetsByStaff,
  filterTimesheetsByPeriod,
  filterTimesheetsByDateRange,
  groupTimesheetsByStaff,
  getUniqueStaffFromTimesheets,
  formatCAD,
} from "@/utils/timesheetUtils";
import type { DateRange } from "@/utils/reportUtils";
import type { IEarlyPayRequestsEntity, IBonusesEntity } from "@/product-types";

type EarlyPayRecord = IEarlyPayRequestsEntity & { id: string };
type BonusRecord = IBonusesEntity & { id: string };

interface TimesheetListProps {
  timesheets: TimesheetWithRelations[];
  dateRange: DateRange;
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  onSaveAndApprove: (
    id: string,
    data: { totalHours: number; hourlyRate: number; adjustmentNote: string }
  ) => Promise<void>;
  onBulkApprove: (ids: string[]) => Promise<void>;
  onBulkMarkPaid: (ids: string[]) => Promise<void>;
  isUpdating: boolean;
  earlyPayRequests?: EarlyPayRecord[];
  bonuses?: BonusRecord[];
}

export const TimesheetList = ({
  timesheets,
  dateRange,
  isLoading,
  onApprove,
  onMarkPaid,
  onSaveAndApprove,
  onBulkApprove,
  onBulkMarkPaid,
  isUpdating,
  earlyPayRequests,
  bonuses,
}: TimesheetListProps) => {
  const [activeTab, setActiveTab] = useState<TimesheetTabValue>("pending");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [markAllPaidOpen, setMarkAllPaidOpen] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Tab counts reflect only timesheets within the selected pay period
  const periodTimesheets = useMemo(
    () => filterTimesheetsByPeriod(timesheets, dateRange),
    [timesheets, dateRange]
  );

  // Count per tab
  const tabCounts = useMemo(() => {
    return {
      pending: periodTimesheets.filter((ts) => ts.paymentStatus === "pending").length,
      approved: periodTimesheets.filter((ts) => ts.paymentStatus === "approved").length,
      paid: periodTimesheets.filter((ts) => ts.paymentStatus === "paid").length,
      all: periodTimesheets.length,
    };
  }, [periodTimesheets]);

  // Filter by tab
  const tabFilteredTimesheets = useMemo(
    () => filterTimesheetsByTab(timesheets, activeTab),
    [timesheets, activeTab]
  );

  // Filter by pay period (the dateRange from PayPeriodSelector) — applied right after tab filter
  const periodFilteredTimesheets = useMemo(
    () => filterTimesheetsByPeriod(tabFilteredTimesheets, dateRange),
    [tabFilteredTimesheets, dateRange]
  );

  // Unique staff from ALL period timesheets (before tab filter), so dropdown never goes empty when switching tabs
  const staffOptions = useMemo(
    () => getUniqueStaffFromTimesheets(periodTimesheets),
    [periodTimesheets]
  );

  // Filter by staff
  const staffFilteredTimesheets = useMemo(
    () =>
      filterTimesheetsByStaff(
        periodFilteredTimesheets,
        staffFilter === "all" ? null : staffFilter
      ),
    [periodFilteredTimesheets, staffFilter]
  );

  // Filter by date range (applied after staff filter)
  const dateFilteredTimesheets = useMemo(
    () =>
      filterTimesheetsByDateRange(
        staffFilteredTimesheets,
        filterFrom || null,
        filterTo || null
      ),
    [staffFilteredTimesheets, filterFrom, filterTo]
  );

  // Group by staff
  const allStaffGroups = useMemo(
    () => groupTimesheetsByStaff(dateFilteredTimesheets),
    [dateFilteredTimesheets]
  );

  // Filter groups by search query
  const staffGroups = useMemo(() => {
    if (!searchQuery.trim()) return allStaffGroups;
    const query = searchQuery.trim().toLowerCase();
    return allStaffGroups.filter((group) =>
      group.staffName?.toLowerCase().includes(query)
    );
  }, [allStaffGroups, searchQuery]);

  // Bulk action data (in period for bulk operations)
  const periodPendingTimesheets = useMemo(
    () =>
      filterTimesheetsByPeriod(
        timesheets.filter((ts) => ts.paymentStatus === "pending"),
        dateRange
      ),
    [timesheets, dateRange]
  );

  const periodApprovedTimesheets = useMemo(
    () =>
      filterTimesheetsByPeriod(
        timesheets.filter((ts) => ts.paymentStatus === "approved"),
        dateRange
      ),
    [timesheets, dateRange]
  );

  const periodApprovedTotal = useMemo(
    () =>
      periodApprovedTimesheets.reduce(
        (sum, ts) => sum + (ts.grossPay || 0),
        0
      ),
    [periodApprovedTimesheets]
  );

  const handleBulkApprove = useCallback(async () => {
    const ids = periodPendingTimesheets.map((ts) => ts.id);
    if (ids.length === 0) return;
    await onBulkApprove(ids);
  }, [periodPendingTimesheets, onBulkApprove]);

  const handleBulkMarkPaid = useCallback(async () => {
    const ids = periodApprovedTimesheets.map((ts) => ts.id);
    if (ids.length === 0) return;
    await onBulkMarkPaid(ids);
    setMarkAllPaidOpen(false);
  }, [periodApprovedTimesheets, onBulkMarkPaid]);

  const handleStaffFilterFromBalances = useCallback((staffProfileId: string) => {
    setStaffFilter(staffProfileId);
    setActiveTab("all");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleStaffFilterChange = useCallback((value: string) => {
    setStaffFilter(value);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TimesheetTabValue);
    setStaffFilter("all");
    setSearchQuery("");
  }, []);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  return (
    <div className="space-y-4" ref={tabsRef}>
      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="border-b px-4 pt-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending" className="gap-1.5">
                Pending
                {tabCounts.pending > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-xs rounded-full bg-chart-3/20 text-chart-3"
                  >
                    {tabCounts.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-1.5">
                Approved
                {tabCounts.approved > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-xs rounded-full bg-chart-1/20 text-chart-1"
                  >
                    {tabCounts.approved}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="paid" className="gap-1.5">
                Paid
                {tabCounts.paid > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-xs rounded-full bg-accent/20 text-accent"
                  >
                    {tabCounts.paid}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1.5">
                All
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1.5 text-xs rounded-full"
                >
                  {tabCounts.all}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters and Bulk Actions */}
          <div className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b">
            <Select value={staffFilter} onValueChange={handleStaffFilterChange}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 inline-flex items-center justify-center rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-muted-foreground font-medium pl-0.5">From</label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-muted-foreground font-medium pl-0.5">To</label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {(filterFrom || filterTo) && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-transparent select-none">Clear</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFilterFrom(""); setFilterTo(""); }}
                    className="h-9 px-2"
                    title="Clear date filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1" />

            {activeTab === "pending" && periodPendingTimesheets.length > 0 && (
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {isUpdating ? "Approving…" : `Approve All (${periodPendingTimesheets.length})`}
              </Button>
            )}

            {activeTab === "approved" && periodApprovedTimesheets.length > 0 && (
              <Button
                size="sm"
                onClick={() => setMarkAllPaidOpen(true)}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Mark All as Paid ({periodApprovedTimesheets.length})
              </Button>
            )}
          </div>

          {/* Tab Content */}
          {(["pending", "approved", "paid", "all"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {staffGroups.length === 0 ? (
                <div className="flex min-h-[140px] items-center justify-center">
                  <div className="text-center py-8">
                    <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">
                      No {tab === "all" ? "" : tab} timesheets found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery.trim()
                        ? "No staff match your search"
                        : (filterFrom || filterTo)
                        ? "Try clearing the date filter or adjusting the date range"
                        : staffFilter !== "all"
                        ? "Try clearing the staff filter"
                        : "Timesheets will appear here when they are created"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {staffGroups.map((group) => (
                    <TimesheetStaffGroup
                      key={group.staffProfileId}
                      group={group}
                      onApprove={onApprove}
                      onMarkPaid={onMarkPaid}
                      onSaveAndApprove={onSaveAndApprove}
                      isUpdating={isUpdating}
                      earlyPayRequests={earlyPayRequests}
                      bonuses={bonuses}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Staff Outstanding Balances */}
      <StaffOutstandingBalances
        timesheets={timesheets}
        onSelectStaff={handleStaffFilterFromBalances}
      />

      {/* Mark All Paid Dialog */}
      <MarkAllPaidDialog
        open={markAllPaidOpen}
        onOpenChange={setMarkAllPaidOpen}
        count={periodApprovedTimesheets.length}
        totalAmount={periodApprovedTotal}
        onConfirm={handleBulkMarkPaid}
        isLoading={isUpdating}
      />
    </div>
  );
};