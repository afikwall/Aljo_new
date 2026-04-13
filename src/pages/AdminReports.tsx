import { useState, useMemo, useCallback } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { BarChart2 } from "lucide-react";

import {
  TimeLogsEntity,
  TimesheetsEntity,
  ShiftsEntity,
  ShiftApplicationsEntity,
  StaffProfilesEntity,
  FacilitiesEntity,
  StaffRatesEntity,
  BillingRatesEntity,
  StaffDocumentsEntity,
  RoleUpgradeApplicationsEntity,
} from "@/product-types";

import { ReportFilterBar } from "@/components/ReportFilterBar";
import { HoursSummarySection } from "@/components/HoursSummarySection";
import { LaborCostSection } from "@/components/LaborCostSection";
import { AttendanceSection } from "@/components/AttendanceSection";
import { ComplianceSection } from "@/components/ComplianceSection";
import { StaffUtilizationSection } from "@/components/StaffUtilizationSection";

import {
  type DatePreset,
  type DateRange,
  getDateRangeForPreset,
  formatDateRange,
  buildLookupMap,
  buildRateLookupMap,
} from "@/utils/reportUtils";

// Type aliases for entity instances
type TimeLogInstance = typeof TimeLogsEntity["instanceType"] & { id?: string; createdAt?: string };
type TimesheetInstance = typeof TimesheetsEntity["instanceType"] & { id?: string; createdAt?: string };
type ShiftInstance = typeof ShiftsEntity["instanceType"] & { id?: string; createdAt?: string };
type ShiftAppInstance = typeof ShiftApplicationsEntity["instanceType"] & { id?: string; createdAt?: string };
type StaffInstance = typeof StaffProfilesEntity["instanceType"] & { id?: string; createdAt?: string };
type FacilityInstance = typeof FacilitiesEntity["instanceType"] & { id?: string; createdAt?: string };
type StaffRateInstance = typeof StaffRatesEntity["instanceType"] & { id?: string };
type BillingRateInstance = typeof BillingRatesEntity["instanceType"] & { id?: string };
type StaffDocInstance = typeof StaffDocumentsEntity["instanceType"] & { id?: string };
type RoleUpgradeInstance = typeof RoleUpgradeApplicationsEntity["instanceType"] & { id?: string };

export default function AdminReports() {
  // ─── Date Range & Filter State ──────────────────────────────────────────
  const [activePreset, setActivePreset] = useState<DatePreset>("this_pay_period");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("all");

  const dateRange: DateRange = useMemo(() => {
    if (activePreset === "custom" && customStart && customEnd) {
      return getDateRangeForPreset("custom", new Date(customStart), new Date(customEnd + "T23:59:59"));
    }
    return getDateRangeForPreset(activePreset);
  }, [activePreset, customStart, customEnd]);

  const dateRangeLabel = useMemo(
    () => formatDateRange(dateRange.start, dateRange.end),
    [dateRange]
  );

  const handlePresetChange = useCallback((preset: DatePreset) => {
    setActivePreset(preset);
    if (preset !== "custom") {
      setCustomStart("");
      setCustomEnd("");
    }
  }, []);

  // ─── Data Fetching ──────────────────────────────────────────────────────
  const { data: timeLogsRaw, isLoading: loadingTimeLogs } = useEntityGetAll(TimeLogsEntity);
  const { data: timesheetsRaw, isLoading: loadingTimesheets } = useEntityGetAll(TimesheetsEntity);
  const { data: shiftsRaw, isLoading: loadingShifts } = useEntityGetAll(ShiftsEntity);
  const { data: shiftAppsRaw, isLoading: loadingShiftApps } = useEntityGetAll(ShiftApplicationsEntity);
  const { data: staffRaw, isLoading: loadingStaff } = useEntityGetAll(StaffProfilesEntity);
  const { data: facilitiesRaw, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);
  const { data: staffRatesRaw, isLoading: loadingStaffRates } = useEntityGetAll(StaffRatesEntity);
  const { data: billingRatesRaw, isLoading: loadingBillingRates } = useEntityGetAll(BillingRatesEntity);
  const { data: staffDocsRaw, isLoading: loadingStaffDocs } = useEntityGetAll(StaffDocumentsEntity);
  const { data: roleUpgradesRaw, isLoading: loadingRoleUpgrades } = useEntityGetAll(RoleUpgradeApplicationsEntity);

  // Cast data
  const timeLogs = useMemo(() => (timeLogsRaw as TimeLogInstance[] | undefined) || [], [timeLogsRaw]);
  const timesheets = useMemo(() => (timesheetsRaw as TimesheetInstance[] | undefined) || [], [timesheetsRaw]);
  const shifts = useMemo(() => (shiftsRaw as ShiftInstance[] | undefined) || [], [shiftsRaw]);
  const shiftApps = useMemo(() => (shiftAppsRaw as ShiftAppInstance[] | undefined) || [], [shiftAppsRaw]);
  const staffProfiles = useMemo(() => (staffRaw as StaffInstance[] | undefined) || [], [staffRaw]);
  const facilities = useMemo(() => (facilitiesRaw as FacilityInstance[] | undefined) || [], [facilitiesRaw]);
  const billingRates = useMemo(() => (billingRatesRaw as BillingRateInstance[] | undefined) || [], [billingRatesRaw]);
  const staffDocs = useMemo(() => (staffDocsRaw as StaffDocInstance[] | undefined) || [], [staffDocsRaw]);
  const roleUpgrades = useMemo(() => (roleUpgradesRaw as RoleUpgradeInstance[] | undefined) || [], [roleUpgradesRaw]);

  // ─── Lookup Maps ────────────────────────────────────────────────────────
  const staffMap = useMemo(() => buildLookupMap(staffProfiles), [staffProfiles]);
  const facilityMap = useMemo(() => buildLookupMap(facilities), [facilities]);
  const shiftMap = useMemo(() => buildLookupMap(shifts), [shifts]);
  const billingRatesMap = useMemo(() => buildRateLookupMap(billingRates), [billingRates]);

  // Facility options for filter
  const facilityOptions = useMemo(
    () =>
      facilities
        .filter(f => f.name)
        .map(f => ({ id: f.id || "", name: f.name || "" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [facilities]
  );

  // ─── Loading State ──────────────────────────────────────────────────────
  const isLoadingCore = loadingTimeLogs || loadingTimesheets || loadingShifts || loadingShiftApps || loadingStaff || loadingFacilities;
  const isLoadingRates = loadingStaffRates || loadingBillingRates;
  const isLoadingCompliance = loadingStaff || loadingStaffDocs || loadingRoleUpgrades;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <BarChart2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Platform analytics and operational insights
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        facilityId={facilityFilter}
        onFacilityChange={setFacilityFilter}
        facilities={facilityOptions}
        dateRangeLabel={dateRangeLabel}
      />

      {/* Report Sections */}
      <div className="space-y-4">
        {/* Section 1: Hours Summary */}
        <HoursSummarySection
          timeLogs={timeLogs}
          staffMap={staffMap}
          facilityMap={facilityMap}
          shiftMap={shiftMap}
          dateRange={dateRange}
          facilityFilter={facilityFilter}
          isLoading={isLoadingCore}
        />

        {/* Section 2: Labor Cost Report */}
        <LaborCostSection
          timesheets={timesheets}
          shifts={shifts}
          staffMap={staffMap}
          facilityMap={facilityMap}
          shiftMap={shiftMap}
          billingRatesMap={billingRatesMap}
          dateRange={dateRange}
          facilityFilter={facilityFilter}
          isLoading={isLoadingCore || isLoadingRates}
        />

        {/* Section 3: Attendance Report */}
        <AttendanceSection
          shifts={shifts}
          shiftApplications={shiftApps}
          timeLogs={timeLogs}
          staffMap={staffMap}
          facilityMap={facilityMap}
          dateRange={dateRange}
          facilityFilter={facilityFilter}
          isLoading={isLoadingCore}
        />

        {/* Section 4: Compliance Report (not filtered by date) */}
        <ComplianceSection
          staffProfiles={staffProfiles}
          staffDocuments={staffDocs}
          roleUpgradeApps={roleUpgrades}
          staffMap={staffMap}
          facilityMap={facilityMap}
          facilityFilter={facilityFilter}
          dateRange={dateRange}
          isLoading={isLoadingCompliance}
        />

        {/* Section 5: Staff Utilization */}
        <StaffUtilizationSection
          shifts={shifts}
          shiftApplications={shiftApps}
          facilityMap={facilityMap}
          dateRange={dateRange}
          facilityFilter={facilityFilter}
          isLoading={isLoadingCore}
        />
      </div>
    </div>
  );
}