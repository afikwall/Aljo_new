import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useEntityGetAll, useEntityUpdate, useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { getPageUrl } from "@/lib/utils";
import {
  BulkPostShiftsAction,
  AutoAssignFavoritesToShiftAction,
  StaffRatesEntity,
  BillingRatesEntity,
  ShiftsEntity,
  FacilityDashboardPage,
  RoleTypesEntity,
} from "@/product-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { AutoAssignCard } from "@/components/AutoAssignCard";
import { OrientationToggleCard } from "@/components/OrientationToggleCard";
import { BulkShiftPreview } from "@/components/BulkShiftPreview";
import { DayOfWeekChips } from "@/components/DayOfWeekChips";
import { toast } from "sonner";
import {
  CalendarIcon,
  Plus,
  Minus,
  Loader2,
  Eye,
  CheckCircle2,
  ArrowRight,
  Info,
  Loader,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  generateBulkShiftPreview,
  validateBulkShiftForm,
  buildBulkPostInput,
  type DayOfWeekValue,
  type BulkShiftPreviewItem,
} from "@/utils/bulkShiftUtils";
import { shouldAutoSchedule } from "@/utils/autoScheduleUtils";
import type { IFacilityManagerProfilesEntity } from "@/product-types";

interface BulkPostFormProps {
  managerProfile: IFacilityManagerProfilesEntity & { id: string };
}

export const BulkPostForm = ({ managerProfile }: BulkPostFormProps) => {
  const navigate = useNavigate();
  const facilityProfileId = managerProfile.facilityProfileId || "";

  // Fetch role types dynamically
  const { data: roleTypesData, isLoading: isLoadingRoleTypes } = useEntityGetAll(RoleTypesEntity);

  const activeRoleTypes = useMemo(() => {
    if (!roleTypesData) return [];
    return roleTypesData
      .filter((r) => r.isActive !== false)
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [roleTypesData]);

  // Form state
  const [requiredRole, setRequiredRole] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<DayOfWeekValue[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [notes, setNotes] = useState("");
  const [requiresOrientation, setRequiresOrientation] = useState(false);
  const [orientationNotes, setOrientationNotes] = useState("");
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(
    shouldAutoSchedule(managerProfile)
  );
  const [notifyFavorites, setNotifyFavorites] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Rate fields state
  const [staffRate, setStaffRate] = useState("");
  const [billingRate, setBillingRate] = useState("");

  // Fetch rate tables for rate lookup
  const { data: staffRatesData } = useEntityGetAll(
    StaffRatesEntity,
    { facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  const { data: billingRatesData } = useEntityGetAll(
    BillingRatesEntity,
    { facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  // Auto-populate rate fields when requiredRole changes
  useEffect(() => {
    if (!requiredRole) {
      setStaffRate("");
      setBillingRate("");
      return;
    }
    const matchingStaff = staffRatesData?.find(
      (r) => r.roleType === requiredRole
    );
    if (matchingStaff?.staffRate != null) {
      setStaffRate(String(matchingStaff.staffRate));
    } else {
      setStaffRate("");
    }
    const matchingBilling = billingRatesData?.find(
      (r) => r.roleType === requiredRole
    );
    if (matchingBilling?.billingRate != null) {
      setBillingRate(String(matchingBilling.billingRate));
    } else {
      setBillingRate("");
    }
  }, [requiredRole, staffRatesData, billingRatesData]);

  // For updating shifts after bulk creation with rates
  const { updateFunction: updateShift } = useEntityUpdate(ShiftsEntity);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [bulkSuccess, setBulkSuccess] = useState<{ count: number; autoAssigned: number } | null>(null);

  // Actions
  const { executeFunction: executeBulkPost } = useExecuteAction(BulkPostShiftsAction);
  const { executeFunction: executeAutoAssign } = useExecuteAction(AutoAssignFavoritesToShiftAction);

  // Preview items
  const previewItems = useMemo<BulkShiftPreviewItem[]>(() => {
    if (!startDate || !endDate || selectedDays.length === 0 || !startTime || !endTime) {
      return [];
    }
    return generateBulkShiftPreview(
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
      selectedDays,
      startTime,
      endTime
    );
  }, [startDate, endDate, selectedDays, startTime, endTime]);

  // Validation
  const validation = useMemo(() => {
    if (!staffRate || parseFloat(staffRate) <= 0) {
      return { valid: false, message: "Staff rate is required" };
    }
    return validateBulkShiftForm({
      facilityProfileId,
      requiredRole: requiredRole as "RN" | "LPN" | "CCA" | "CITR",
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      daysOfWeek: selectedDays,
      shiftStartTime: startTime,
      shiftEndTime: endTime,
      headcount,
    });
  }, [facilityProfileId, requiredRole, startDate, endDate, selectedDays, startTime, endTime, headcount, staffRate]);

  const canShowPreview = useMemo(() => {
    return !!(startDate && endDate && selectedDays.length > 0 && startTime && endTime && requiredRole);
  }, [startDate, endDate, selectedDays, startTime, endTime, requiredRole]);

  // Reset form
  const resetForm = useCallback(() => {
    setRequiredRole("");
    setStaffRate("");
    setBillingRate("");
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedDays([]);
    setStartTime("");
    setEndTime("");
    setHeadcount(1);
    setNotes("");
    setRequiresOrientation(false);
    setOrientationNotes("");
    setAutoAssignEnabled(shouldAutoSchedule(managerProfile));
    setNotifyFavorites(false);
    setShowPreview(false);
    setProgress({ current: 0, total: 0 });
  }, [managerProfile]);

  // Submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    if (previewItems.length === 0) {
      toast.error("No shifts to create. Check your date range and day selections.");
      return;
    }

    setIsSubmitting(true);
    setBulkSuccess(null);
    const totalShifts = previewItems.length;
    setProgress({ current: 0, total: totalShifts });

    try {
      const input = buildBulkPostInput({
        facilityProfileId,
        requiredRole: requiredRole as "RN" | "LPN" | "CCA" | "CITR",
        startDate: format(startDate!, "yyyy-MM-dd"),
        endDate: format(endDate!, "yyyy-MM-dd"),
        daysOfWeek: selectedDays,
        shiftStartTime: startTime,
        shiftEndTime: endTime,
        headcount,
        notes: notes.trim() || undefined,
        requiresOrientation,
        orientationNotes: requiresOrientation && orientationNotes.trim()
          ? orientationNotes.trim()
          : undefined,
      });

      const result = await executeBulkPost(input);

      if (!result) {
        toast.error("Failed to create shifts. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const shiftsCreated = result.shiftsCreated ?? 0;
      const shiftIds = result.shiftIds ?? [];
      const errors = result.errors ?? [];

      setProgress({ current: shiftsCreated, total: totalShifts });

      // Save FM-entered staffRate and auto-populated billingRate on each created shift
      const rateUpdates: Record<string, number> = {};
      if (staffRate && parseFloat(staffRate) > 0) {
        rateUpdates.shiftStaffRate = parseFloat(staffRate);
      }
      if (billingRate && parseFloat(billingRate) > 0) {
        rateUpdates.shiftBillingRate = parseFloat(billingRate);
      }

      if (Object.keys(rateUpdates).length > 0 && shiftIds.length > 0) {
        for (const sid of shiftIds) {
          try {
            await updateShift({
              id: sid,
              data: rateUpdates,
            });
          } catch {
            // Rate update failure shouldn't fail the overall operation
          }
        }
      }

      // Auto-assign if enabled
      let totalAutoAssigned = 0;
      if (autoAssignEnabled && shiftIds.length > 0) {
        for (let i = 0; i < shiftIds.length; i++) {
          try {
            const shiftDate = previewItems[i];
            const autoResult = await executeAutoAssign({
              shiftId: shiftIds[i],
              facilityId: facilityProfileId,
              requiredRole: requiredRole as "RN" | "LPN" | "CCA" | "CITR",
              headcount,
              startDateTime: shiftDate?.startDateTime || "",
              endDateTime: shiftDate?.endDateTime || "",
            });
            if (autoResult?.assignedCount) {
              totalAutoAssigned += autoResult.assignedCount;
            }
          } catch {
            // Auto-assign failure doesn't fail the overall operation
          }
        }
      }

      // Show results
      if (errors.length > 0 && shiftsCreated > 0) {
        toast.warning(
          `Created ${shiftsCreated} of ${totalShifts} shifts. ${errors.length} failed.`,
          {
            action: {
              label: "View Dashboard",
              onClick: () => navigate(getPageUrl(FacilityDashboardPage)),
            },
          }
        );
      } else if (shiftsCreated > 0) {
        const autoMsg = autoAssignEnabled && totalAutoAssigned > 0
          ? ` Auto-assigned ${totalAutoAssigned} favorite staff.`
          : "";
        toast.success(
          `${shiftsCreated} shift${shiftsCreated !== 1 ? "s" : ""} created successfully!${autoMsg}`,
          {
            action: {
              label: "View Dashboard",
              onClick: () => navigate(getPageUrl(FacilityDashboardPage)),
            },
          }
        );
      } else {
        toast.error("Failed to create shifts. Please try again.");
      }

      setBulkSuccess({ count: shiftsCreated, autoAssigned: totalAutoAssigned });
      if (shiftsCreated > 0 && errors.length === 0) {
        resetForm();
      }
    } catch (error) {
      console.error("Error creating bulk shifts:", error);
      toast.error("Failed to create shifts. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validation, previewItems, facilityProfileId, requiredRole, startDate, endDate,
    selectedDays, startTime, endTime, headcount, notes, requiresOrientation,
    orientationNotes, autoAssignEnabled, executeBulkPost, executeAutoAssign,
    navigate, resetForm, staffRate, billingRate, updateShift,
  ]);

  const handlePreviewToggle = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  const progressPercentage = useMemo(() => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }, [progress]);

  // Success state
  if (bulkSuccess && bulkSuccess.count > 0) {
    return (
      <Card className="border-chart-1/30 bg-chart-1/5">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-chart-1" />
          <div>
            <p className="text-lg font-semibold">
              {bulkSuccess.count} shift{bulkSuccess.count !== 1 ? "s" : ""} created!
            </p>
            {bulkSuccess.autoAssigned > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {bulkSuccess.autoAssigned} favorite staff auto-assigned
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setBulkSuccess(null)}
            >
              Post More Shifts
            </Button>
            <Button onClick={() => navigate(getPageUrl(FacilityDashboardPage))}>
              View Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Shift Details</CardTitle>
          <CardDescription>
            Create multiple shifts across a date range with the same settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Role */}
          <div className="space-y-2">
            <Label htmlFor="bulk-role">Required Role *</Label>
            <Select
              value={requiredRole}
              onValueChange={setRequiredRole}
              disabled={isLoadingRoleTypes}
            >
              <SelectTrigger id="bulk-role" className="h-11 text-base">
                {isLoadingRoleTypes ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading roles...
                  </span>
                ) : (
                  <SelectValue placeholder="Select role type" />
                )}
              </SelectTrigger>
              <SelectContent>
                {activeRoleTypes.length === 0 ? (
                  <div className="py-3 px-2 text-sm text-muted-foreground text-center">
                    No role types configured
                  </div>
                ) : (
                  activeRoleTypes.map((role) => (
                    <SelectItem key={role.code} value={role.code || ""}>
                      {role.code} - {role.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Rate Fields */}
          {requiredRole && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bulk-staff-rate">Staff Rate ($/hr) *</Label>
                  <Input
                    id="bulk-staff-rate"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={staffRate}
                    onChange={(e) => setStaffRate(e.target.value)}
                    placeholder="0.00"
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-billing-rate">
                    Billing Rate ($/hr){" "}
                    <span className="text-muted-foreground text-xs">(read-only)</span>
                  </Label>
                  <Input
                    id="bulk-billing-rate"
                    type="number"
                    value={billingRate}
                    disabled
                    className="h-11 text-base bg-muted/50 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                  {requiredRole && !billingRate && (
                    <p className="text-chart-3 text-xs">
                      Billing rate not configured for this role. Contact ALJO admin.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Staff rate is what the staff member earns per hour. Billing rate is what the facility is charged (managed by ALJO admin).
                </p>
              </div>
            </>
          )}

          {/* Auto-Assign Card */}
          {facilityProfileId && (
            <AutoAssignCard
              enabled={autoAssignEnabled}
              onEnabledChange={setAutoAssignEnabled}
              facilityProfileId={facilityProfileId}
              notifyFavorites={notifyFavorites}
              onNotifyFavoritesChange={setNotifyFavorites}
            />
          )}

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 text-base",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>To Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 text-base",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) =>
                      isBefore(date, startDate || startOfDay(new Date()))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label>Days of Week *</Label>
            <DayOfWeekChips
              selectedDays={selectedDays}
              onSelectedDaysChange={setSelectedDays}
            />
            {selectedDays.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select which days of the week to post shifts
              </p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-start-time">Start Time *</Label>
              <Input
                id="bulk-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-end-time">End Time *</Label>
              <Input
                id="bulk-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* Headcount */}
          <div className="space-y-2">
            <Label htmlFor="bulk-headcount">Number of Staff Needed *</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => setHeadcount(Math.max(1, headcount - 1))}
                disabled={headcount <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="bulk-headcount"
                type="number"
                min={1}
                max={20}
                value={headcount}
                onChange={(e) =>
                  setHeadcount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className="h-11 text-center text-base"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => setHeadcount(Math.min(20, headcount + 1))}
                disabled={headcount >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 1, maximum 20 staff members per shift
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="bulk-notes">Special Instructions (Optional)</Label>
            <Textarea
              id="bulk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requirements, certifications needed, or other important details..."
              className="min-h-[100px] text-base"
            />
          </div>

          {/* Requires Orientation */}
          <OrientationToggleCard
            enabled={requiresOrientation}
            onEnabledChange={setRequiresOrientation}
            notes={orientationNotes}
            onNotesChange={setOrientationNotes}
          />
        </CardContent>
      </Card>

      {/* Preview Section */}
      {canShowPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Shift Preview</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewToggle}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Hide Preview" : "Preview Shifts"}
              </Button>
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <BulkShiftPreview
                previewItems={previewItems}
                daysOfWeek={selectedDays}
                requiredRole={requiredRole}
                startTime={startTime}
                endTime={endTime}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Progress during submission */}
      {isSubmitting && (
        <Card>
          <CardContent className="py-6 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm font-medium">
                Creating shift {Math.min(progress.current + 1, progress.total)} of{" "}
                {progress.total}...
              </p>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(getPageUrl(FacilityDashboardPage))}
          className="h-12 w-full sm:w-auto"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!validation.valid || isSubmitting || previewItems.length === 0}
          className="h-12 w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting {previewItems.length} Shifts...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Post All Shifts ({previewItems.length})
            </>
          )}
        </Button>
      </div>
    </form>
  );
};