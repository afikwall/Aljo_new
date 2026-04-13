import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { DollarSign, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { parseISO, isWithinInterval } from "date-fns";

import {
  TimeLogsEntity,
  ShiftsEntity,
  FacilitiesEntity,
  StaffProfilesEntity,
  BillingRatesEntity,
  InvoicesEntity,
  TimesheetsEntity,
  GenerateInvoiceAction,
  EarlyPayRequestsEntity,
  BonusesEntity,
} from "@/product-types";
import type { IEarlyPayRequestsEntity } from "@/product-types";
import type { IBonusesEntity } from "@/product-types";
import type { IGenerateInvoiceActionOutput } from "@/product-types";

import { FrequencyToggle, type InvoiceFrequency } from "@/components/FrequencyToggle";
import { PayPeriodSelector } from "@/components/PayPeriodSelector";
import { FacilityPayrollCard } from "@/components/FacilityPayrollCard";
import { EditTimeLogSheet } from "@/components/EditTimeLogSheet";
import { InvoicePreviewModal } from "@/components/InvoicePreviewModal";
import { AdminEarlyPaySection } from "@/components/AdminEarlyPaySection";
import { PayrollSummaryCards } from "@/components/PayrollSummaryCards";
import { TimesheetList } from "@/components/TimesheetList";

import {
  type DatePreset,
  type DateRange,
  getDateRangeForPreset,
  formatDateRange,
} from "@/utils/reportUtils";
import {
  type LineItemForDisplay,
  calculateLineTotal,
  getMultiplier,
  formatDateISO,
} from "@/utils/invoiceUtils";
import { buildLookupMap, buildRateLookupMap, buildRateKey, getStaffName, getStaffInitials } from "@/utils/reportUtils";
import { type TimesheetWithRelations, calculateGrossPay } from "@/utils/timesheetUtils";

// Type aliases
type TimeLogInstance = typeof TimeLogsEntity["instanceType"] & { id?: string; createdAt?: string };
type ShiftInstance = typeof ShiftsEntity["instanceType"] & { id?: string; createdAt?: string };
type FacilityInstance = typeof FacilitiesEntity["instanceType"] & { id?: string };
type StaffInstance = typeof StaffProfilesEntity["instanceType"] & { id?: string };
type BillingRateInstance = typeof BillingRatesEntity["instanceType"] & { id?: string };
type InvoiceInstance = typeof InvoicesEntity["instanceType"] & { id?: string; createdAt?: string };
type TimesheetInstance = typeof TimesheetsEntity["instanceType"] & { id?: string };

export default function AdminPayroll() {
  const user = useUser();

  // ─── Frequency State ─────────────────────────────────────────────────────
  const [frequency, setFrequency] = useState<InvoiceFrequency>("biweekly");

  // ─── Date Range State ──────────────────────────────────────────────────────
  const [activePreset, setActivePreset] = useState<DatePreset>("this_pay_period");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const dateRange: DateRange = useMemo(() => {
    if (activePreset === "custom" && customStart && customEnd) {
      return getDateRangeForPreset("custom", new Date(customStart), new Date(customEnd + "T23:59:59"));
    }
    return getDateRangeForPreset(activePreset);
  }, [activePreset, customStart, customEnd]);

  const handlePresetChange = useCallback((preset: DatePreset) => {
    setActivePreset(preset);
    if (preset !== "custom") {
      setCustomStart("");
      setCustomEnd("");
    }
  }, []);

  const handleFrequencyChange = useCallback((newFrequency: InvoiceFrequency) => {
    setFrequency(newFrequency);
    if (newFrequency === "weekly") {
      setActivePreset("this_week");
    } else {
      setActivePreset("this_pay_period");
    }
    setCustomStart("");
    setCustomEnd("");
  }, []);

  // ─── Sheet/Modal State ─────────────────────────────────────────────────────
  const [editingTimeLog, setEditingTimeLog] = useState<LineItemForDisplay | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<IGenerateInvoiceActionOutput | null>(null);
  const [previewFacilityId, setPreviewFacilityId] = useState<string>("");
  const [previewFacilityName, setPreviewFacilityName] = useState<string>("");
  const [generatingFacilityId, setGeneratingFacilityId] = useState<string>("");

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const { data: timeLogsRaw, isLoading: loadingTimeLogs, refetch: refetchTimeLogs } = useEntityGetAll(TimeLogsEntity);
  const { data: shiftsRaw, isLoading: loadingShifts } = useEntityGetAll(ShiftsEntity);
  const { data: facilitiesRaw, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);
  const { data: staffRaw, isLoading: loadingStaff } = useEntityGetAll(StaffProfilesEntity);
  const { data: billingRatesRaw, isLoading: loadingBillingRates } = useEntityGetAll(BillingRatesEntity);
  const { data: invoicesRaw, isLoading: loadingInvoices, refetch: refetchInvoices } = useEntityGetAll(InvoicesEntity);
  const { data: timesheetsRaw, isLoading: loadingTimesheets, refetch: refetchTimesheets } = useEntityGetAll(TimesheetsEntity);

  // Fetch all early pay requests
  const { data: earlyPayRequestsRaw } = useEntityGetAll(EarlyPayRequestsEntity);

  // Fetch all bonuses
  const { data: bonusesRaw } = useEntityGetAll(BonusesEntity);

  // Timesheet update hook
  const { updateFunction: updateTimesheet, isLoading: isTimesheetUpdating } = useEntityUpdate(TimesheetsEntity);

  // Action hooks
  const {
    executeFunction: executePreview,
    isLoading: isPreviewLoading,
  } = useExecuteAction(GenerateInvoiceAction);
  const {
    executeFunction: executeGenerate,
    isLoading: isGenerateLoading,
  } = useExecuteAction(GenerateInvoiceAction);

  // Cast data
  const timeLogs = useMemo(() => (timeLogsRaw as TimeLogInstance[] | undefined) || [], [timeLogsRaw]);
  const shifts = useMemo(() => (shiftsRaw as ShiftInstance[] | undefined) || [], [shiftsRaw]);
  const facilities = useMemo(() => (facilitiesRaw as FacilityInstance[] | undefined) || [], [facilitiesRaw]);
  const staffProfiles = useMemo(() => (staffRaw as StaffInstance[] | undefined) || [], [staffRaw]);
  const billingRates = useMemo(() => (billingRatesRaw as BillingRateInstance[] | undefined) || [], [billingRatesRaw]);
  const invoices = useMemo(() => (invoicesRaw as InvoiceInstance[] | undefined) || [], [invoicesRaw]);
  const rawTimesheets = useMemo(() => (timesheetsRaw as TimesheetInstance[] | undefined) || [], [timesheetsRaw]);

  type EarlyPayRecord = IEarlyPayRequestsEntity & { id: string };

  // Cast early pay requests
  const earlyPayRequests = useMemo(
    () => (earlyPayRequestsRaw as EarlyPayRecord[] | undefined) || [],
    [earlyPayRequestsRaw]
  );

  type BonusRecord = IBonusesEntity & { id: string };
  const bonuses = useMemo(
    () => (bonusesRaw as BonusRecord[] | undefined) || [],
    [bonusesRaw]
  );

  // Lookup maps
  const staffMap = useMemo(() => buildLookupMap(staffProfiles), [staffProfiles]);
  const facilityMap = useMemo(() => buildLookupMap(facilities), [facilities]);
  const shiftMap = useMemo(() => buildLookupMap(shifts), [shifts]);
  const billingRateMap = useMemo(() => buildRateLookupMap(billingRates), [billingRates]);

  const isLoading = loadingTimeLogs || loadingShifts || loadingFacilities || loadingStaff || loadingBillingRates || loadingInvoices || loadingTimesheets;

  // ─── Enriched Timesheets ──────────────────────────────────────────────────
  const enrichedTimesheets: TimesheetWithRelations[] = useMemo(() => {
    return rawTimesheets.map((ts) => {
      const staff = ts.staffProfileId ? staffMap.get(ts.staffProfileId) : undefined;
      const facility = ts.facilityProfileId ? facilityMap.get(ts.facilityProfileId) : undefined;
      const shift = ts.shiftProfileId ? shiftMap.get(ts.shiftProfileId) : undefined;

      return {
        id: (ts as any).id || "",
        staffProfileId: ts.staffProfileId,
        facilityProfileId: ts.facilityProfileId,
        shiftProfileId: ts.shiftProfileId,
        timeLogProfileId: ts.timeLogProfileId,
        totalHours: ts.totalHours,
        hourlyRate: ts.hourlyRate,
        multiplier: ts.multiplier,
        grossPay: ts.grossPay,
        paymentStatus: ts.paymentStatus as "pending" | "approved" | "paid" | undefined,
        periodStart: ts.periodStart,
        periodEnd: ts.periodEnd,
        paidAt: ts.paidAt,
        approvedAt: ts.approvedAt,
        approvedByEmail: ts.approvedByEmail,
        adjustmentNote: ts.adjustmentNote,
        staffName: getStaffName(staff),
        staffInitials: getStaffInitials(staff),
        staffRole: staff?.roleType || shift?.requiredRole || "",
        facilityName: facility?.name || "Unknown Facility",
        shiftDate: shift?.startDateTime || "",
        earlyPayRequestId: (ts as any).earlyPayRequestId as string | undefined,
      };
    });
  }, [rawTimesheets, staffMap, facilityMap, shiftMap]);

  // ─── Timesheet Actions ────────────────────────────────────────────────────
  const handleApproveTimesheet = useCallback(
    async (id: string) => {
      try {
        await updateTimesheet({
          id,
          data: {
            paymentStatus: "approved",
            approvedAt: new Date().toISOString(),
            approvedByEmail: user?.email || "",
          },
        });
        toast.success("Timesheet approved");
        refetchTimesheets();
      } catch {
        toast.error("Failed to approve timesheet");
      }
    },
    [updateTimesheet, user?.email, refetchTimesheets]
  );

  const handleMarkPaid = useCallback(
    async (id: string) => {
      try {
        await updateTimesheet({
          id,
          data: {
            paymentStatus: "paid",
            paidAt: new Date().toISOString(),
          },
        });
        toast.success("Timesheet marked as paid");
        refetchTimesheets();
      } catch {
        toast.error("Failed to mark timesheet as paid");
      }
    },
    [updateTimesheet, refetchTimesheets]
  );

  const handleSaveAndApprove = useCallback(
    async (
      id: string,
      data: { totalHours: number; hourlyRate: number; adjustmentNote: string }
    ) => {
      try {
        const timesheet = rawTimesheets.find((ts) => (ts as any).id === id);
        const multiplier = timesheet?.multiplier || 1;
        const newGrossPay = calculateGrossPay(data.totalHours, data.hourlyRate, multiplier);

        await updateTimesheet({
          id,
          data: {
            totalHours: data.totalHours,
            hourlyRate: data.hourlyRate,
            grossPay: newGrossPay,
            adjustmentNote: data.adjustmentNote,
            paymentStatus: "approved",
            approvedAt: new Date().toISOString(),
            approvedByEmail: user?.email || "",
          },
        });
        toast.success("Timesheet adjusted and approved");
        refetchTimesheets();
      } catch {
        toast.error("Failed to save and approve timesheet");
      }
    },
    [updateTimesheet, rawTimesheets, user?.email, refetchTimesheets]
  );

  const handleBulkApprove = useCallback(
    async (ids: string[]) => {
      try {
        const now = new Date().toISOString();
        for (const id of ids) {
          await updateTimesheet({
            id,
            data: {
              paymentStatus: "approved",
              approvedAt: now,
              approvedByEmail: user?.email || "",
            },
          });
        }
        toast.success(`${ids.length} timesheet${ids.length !== 1 ? "s" : ""} approved`);
        refetchTimesheets();
      } catch {
        toast.error("Failed to approve some timesheets");
        refetchTimesheets();
      }
    },
    [updateTimesheet, user?.email, refetchTimesheets]
  );

  const handleBulkMarkPaid = useCallback(
    async (ids: string[]) => {
      try {
        const now = new Date().toISOString();
        for (const id of ids) {
          await updateTimesheet({
            id,
            data: {
              paymentStatus: "paid",
              paidAt: now,
            },
          });
        }
        toast.success(`${ids.length} timesheet${ids.length !== 1 ? "s" : ""} marked as paid`);
        refetchTimesheets();
      } catch {
        toast.error("Failed to mark some timesheets as paid");
        refetchTimesheets();
      }
    },
    [updateTimesheet, refetchTimesheets]
  );

  // ─── SECTION B: Invoice Generation (existing) ────────────────────────────
  const facilityGroups = useMemo(() => {
    const filteredLogs = timeLogs.filter((tl) => {
      if (!tl.clockOutTime) return false;
      try {
        const clockOut = parseISO(tl.clockOutTime);
        return isWithinInterval(clockOut, {
          start: dateRange.start,
          end: dateRange.end,
        });
      } catch {
        return false;
      }
    });

    const groups = new Map<string, LineItemForDisplay[]>();

    for (const tl of filteredLogs) {
      if (!tl.shiftProfileId) continue;
      const shift = shiftMap.get(tl.shiftProfileId);
      if (!shift || !shift.facilityProfileId) continue;

      const facilityId = shift.facilityProfileId;
      const staff = tl.staffProfileId ? staffMap.get(tl.staffProfileId) : undefined;
      const rateKey = buildRateKey(facilityId, shift.requiredRole || "");
      const billingRate = billingRateMap.get(rateKey);

      const rate = billingRate?.billingRate || 0;
      const shortNoticeMultiplier = billingRate?.shortNoticeMultiplier || 1.0;
      const holidayMultiplier = billingRate?.holidayMultiplier || 1.5;
      const multiplier = getMultiplier(
        shift.isShortNotice,
        shift.isHoliday,
        shortNoticeMultiplier,
        holidayMultiplier
      );

      const netHours = tl.totalHours || 0;
      const breakMinutes = tl.breakMinutes || 0;
      const grossHours = netHours + breakMinutes / 60;
      const lineTotal = calculateLineTotal(netHours, rate, multiplier);

      const lineItem: LineItemForDisplay = {
        shiftId: tl.shiftProfileId,
        timeLogId: (tl as any).id || "",
        staffProfileId: tl.staffProfileId || "",
        staffName: getStaffName(staff),
        roleType: shift.requiredRole || "",
        shiftDate: shift.startDateTime || tl.clockInTime || "",
        clockInTime: tl.clockInTime || "",
        clockOutTime: tl.clockOutTime || "",
        grossHours: Math.round(grossHours * 10) / 10,
        breakMinutes,
        netHours: Math.round(netHours * 10) / 10,
        billingRate: rate,
        multiplier,
        isShortNotice: shift.isShortNotice || false,
        isHoliday: shift.isHoliday || false,
        lineTotal,
        adminAdjusted: tl.adminAdjusted || false,
        shortNoticeMultiplier,
        holidayMultiplier,
      };

      const existing = groups.get(facilityId) || [];
      existing.push(lineItem);
      groups.set(facilityId, existing);
    }

    return groups;
  }, [timeLogs, dateRange, shiftMap, staffMap, billingRateMap]);

  const existingInvoiceMap = useMemo(() => {
    const map = new Map<string, InvoiceInstance>();
    const periodStartStr = formatDateISO(dateRange.start);
    const periodEndStr = formatDateISO(dateRange.end);

    for (const inv of invoices) {
      if (
        inv.facilityProfileId &&
        inv.periodStart === periodStartStr &&
        inv.periodEnd === periodEndStr
      ) {
        map.set(inv.facilityProfileId, inv);
      }
    }
    return map;
  }, [invoices, dateRange]);

  const sortedFacilityIds = useMemo(() => {
    return Array.from(facilityGroups.keys()).sort((a, b) => {
      const fA = facilityMap.get(a);
      const fB = facilityMap.get(b);
      return (fA?.name || "").localeCompare(fB?.name || "");
    });
  }, [facilityGroups, facilityMap]);

  // ─── Invoice Handlers ─────────────────────────────────────────────────────
  const handleEditTimeLog = useCallback((item: LineItemForDisplay) => {
    setEditingTimeLog(item);
    setEditSheetOpen(true);
  }, []);

  const handleTimeLogSaved = useCallback(() => {
    refetchTimeLogs();
  }, [refetchTimeLogs]);

  const handleGenerateInvoice = useCallback(
    async (facilityId: string) => {
      const facility = facilityMap.get(facilityId);
      if (!facility) return;

      setGeneratingFacilityId(facilityId);
      setPreviewFacilityId(facilityId);
      setPreviewFacilityName(facility.name || "Unknown Facility");

      try {
        const result = await executePreview({
          facilityId,
          periodStart: formatDateISO(dateRange.start),
          periodEnd: formatDateISO(dateRange.end),
          frequency,
          previewOnly: true,
        });

        if (result && result.success) {
          setPreviewData(result as IGenerateInvoiceActionOutput);
          setPreviewModalOpen(true);
        } else {
          toast.error((result as any)?.message || "Failed to generate preview");
        }
      } catch {
        toast.error("Failed to generate invoice preview");
      } finally {
        setGeneratingFacilityId("");
      }
    },
    [facilityMap, dateRange, executePreview, frequency]
  );

  const handleConfirmInvoice = useCallback(async () => {
    try {
      const result = await executeGenerate({
        facilityId: previewFacilityId,
        periodStart: formatDateISO(dateRange.start),
        periodEnd: formatDateISO(dateRange.end),
        frequency,
        previewOnly: false,
        invoiceNumber: previewData?.invoiceNumber,
      });

      if (result && result.success) {
        toast.success(
          `Invoice ${result.invoiceNumber} generated successfully!`
        );
        setPreviewModalOpen(false);
        setPreviewData(null);
        refetchInvoices();
      } else {
        toast.error((result as any)?.message || "Failed to generate invoice");
      }
    } catch {
      toast.error("Failed to generate invoice");
    }
  }, [previewFacilityId, dateRange, previewData, executeGenerate, refetchInvoices, frequency]);

  const periodLabel = useMemo(
    () => formatDateRange(dateRange.start, dateRange.end),
    [dateRange]
  );

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <DollarSign className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">
            Review, approve, and process staff payments
          </p>
        </div>
      </div>

      {/* Early Pay Requests Section */}
      <AdminEarlyPaySection />

      {/* Frequency Toggle */}
      <FrequencyToggle
        frequency={frequency}
        onFrequencyChange={handleFrequencyChange}
      />

      {/* Pay Period Selector */}
      <PayPeriodSelector
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        dateRange={dateRange}
        frequency={frequency}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION A: Payment Lifecycle (Timesheets) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Summary Cards */}
      <PayrollSummaryCards
        timesheets={enrichedTimesheets}
        dateRange={dateRange}
        isLoading={isLoading}
      />

      {/* Timesheet Tabs + List */}
      <TimesheetList
        timesheets={enrichedTimesheets}
        dateRange={dateRange}
        isLoading={isLoading}
        onApprove={handleApproveTimesheet}
        onMarkPaid={handleMarkPaid}
        onSaveAndApprove={handleSaveAndApprove}
        onBulkApprove={handleBulkApprove}
        onBulkMarkPaid={handleBulkMarkPaid}
        isUpdating={isTimesheetUpdating}
        earlyPayRequests={earlyPayRequests}
        bonuses={bonuses}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION B: Invoice Generation (existing functionality) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      <div className="relative">
        <Separator className="my-2" />
        <div className="flex items-center gap-2 py-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Invoice Generation</h2>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedFacilityIds.length === 0 && (
        <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-bold">
              No completed shifts found
            </p>
            <p className="text-sm text-muted-foreground">
              There are no completed shifts in the selected {frequency === "weekly" ? "week" : "pay period"}.
            </p>
          </div>
        </div>
      )}

      {/* Facility Cards */}
      {!isLoading && (
        <div className="space-y-4">
          {sortedFacilityIds.map((facilityId) => {
            const facility = facilityMap.get(facilityId);
            const lineItems = facilityGroups.get(facilityId) || [];
            const existingInvoice = existingInvoiceMap.get(facilityId);

            return (
              <FacilityPayrollCard
                key={facilityId}
                facilityId={facilityId}
                facilityName={facility?.name || "Unknown Facility"}
                facilityCity={facility?.city}
                facilityProvince={facility?.province}
                lineItems={lineItems}
                hasExistingInvoice={!!existingInvoice}
                existingInvoiceNumber={existingInvoice?.invoiceNumber}
                onGenerateInvoice={() => handleGenerateInvoice(facilityId)}
                onEditTimeLog={handleEditTimeLog}
                isGenerating={generatingFacilityId === facilityId}
              />
            );
          })}
        </div>
      )}

      {/* Edit Time Log Sheet */}
      <EditTimeLogSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        item={editingTimeLog}
        onSaved={handleTimeLogSaved}
      />

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        previewData={previewData}
        facilityName={previewFacilityName}
        periodLabel={periodLabel}
        onConfirm={handleConfirmInvoice}
        isConfirming={isGenerateLoading}
      />
    </div>
  );
}