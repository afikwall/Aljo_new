import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useEntityCreate, useEntityGetAll, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { getPageUrl } from "@/lib/utils";
import {
  ShiftsEntity,
  StaffRatesEntity,
  BillingRatesEntity,
  ShiftApplicationsEntity,
  StaffProfilesEntity,
  AutoAssignFavoritesToShiftAction,
  FacilityDashboardPage,
  RoleTypesEntity,
} from "@/product-types";
import type { IFacilityManagerProfilesEntity, IStaffProfilesEntity } from "@/product-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AutoAssignCard } from "@/components/AutoAssignCard";
import { OrientationToggleCard } from "@/components/OrientationToggleCard";
import { ShiftTypeToggle } from "@/components/ShiftTypeToggle";
import { StaffPicker } from "@/components/StaffPicker";
import type { ShiftType } from "@/components/ShiftTypeToggle";
import { toast } from "sonner";
import { CalendarIcon, Plus, Minus, Loader2, Info, Loader } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { shouldAutoSchedule } from "@/utils/autoScheduleUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface SingleShiftFormProps {
  managerProfile: IFacilityManagerProfilesEntity & { id: string };
}

export const SingleShiftForm = ({ managerProfile }: SingleShiftFormProps) => {
  const navigate = useNavigate();
  const facilityProfileId = managerProfile.facilityProfileId || "";

  // Shift type toggle state
  const [shiftType, setShiftType] = useState<ShiftType>("open");

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
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [notes, setNotes] = useState("");
  const [requiresOrientation, setRequiresOrientation] = useState(false);
  const [orientationNotes, setOrientationNotes] = useState("");
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(
    shouldAutoSchedule(managerProfile)
  );
  const [notifyFavorites, setNotifyFavorites] = useState(false);

  // Rate fields state
  const [staffRate, setStaffRate] = useState("");
  const [billingRate, setBillingRate] = useState("");

  // Assign to Staff state
  const [assignedStaffId, setAssignedStaffId] = useState("");

  // Fetch all staff profiles to get the name for the success toast
  const { data: allStaffProfiles } = useEntityGetAll(StaffProfilesEntity, {
    onboardingStatus: "approved",
    complianceStatus: "compliant",
  });

  const selectedStaffName = useMemo(() => {
    if (!assignedStaffId || !allStaffProfiles) return "";
    const staff = allStaffProfiles.find(
      (s: IStaffProfilesEntity & { id?: string }) => s.id === assignedStaffId
    );
    if (!staff) return "";
    return `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
  }, [assignedStaffId, allStaffProfiles]);

  // Fetch rate tables for silent rate lookup on submission
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

  // Hooks
  const { createFunction, isLoading: isCreating } = useEntityCreate(ShiftsEntity);
  const { createFunction: createApplication } = useEntityCreate(ShiftApplicationsEntity);
  const { updateFunction: updateShift } = useEntityUpdate(ShiftsEntity);
  const { executeFunction: executeAutoAssign } = useExecuteAction(AutoAssignFavoritesToShiftAction);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  const isSubmitting = isCreating || isAutoAssigning;

  const isAssignMode = shiftType === "assign";

  // Handle shift type change
  const handleShiftTypeChange = useCallback((newType: ShiftType) => {
    setShiftType(newType);
    if (newType === "open") {
      // Clear the selected staff when switching back to open
      setAssignedStaffId("");
    }
  }, []);

  // Validation
  const validateForm = useMemo(() => {
    if (!requiredRole) return { valid: false, message: "Please select a required role" };

    if (!staffRate || parseFloat(staffRate) <= 0) {
      return { valid: false, message: "Staff rate is required" };
    }

    if (!isAssignMode) {
      if (headcount < 1 || headcount > 20) return { valid: false, message: "Headcount must be between 1 and 20" };
    }

    if (isAssignMode && !assignedStaffId) {
      return { valid: false, message: "Please select a staff member to assign" };
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      return { valid: false, message: "Please fill in all date and time fields" };
    }

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMin, 0, 0);

    const now = new Date();
    if (!isBefore(now, startDateTime)) {
      return { valid: false, message: "Start date/time must be in the future" };
    }

    if (!isBefore(startDateTime, endDateTime)) {
      return { valid: false, message: "End date/time must be after start date/time" };
    }

    return { valid: true, message: "" };
  }, [startDate, startTime, endDate, endTime, requiredRole, headcount, isAssignMode, assignedStaffId, staffRate]);

  // Reset form
  const resetForm = useCallback(() => {
    setShiftType("open");
    setRequiredRole("");
    setStaffRate("");
    setBillingRate("");
    setStartDate(undefined);
    setStartTime("");
    setEndDate(undefined);
    setEndTime("");
    setHeadcount(1);
    setNotes("");
    setRequiresOrientation(false);
    setOrientationNotes("");
    setAutoAssignEnabled(shouldAutoSchedule(managerProfile));
    setNotifyFavorites(false);
    setAssignedStaffId("");
  }, [managerProfile]);

  // Submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm.valid) {
      toast.error(validateForm.message);
      return;
    }

    if (!facilityProfileId) {
      toast.error("Facility profile not found");
      return;
    }

    try {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      const shiftStartDateTime = new Date(startDate!);
      shiftStartDateTime.setHours(startHour, startMin, 0, 0);

      const shiftEndDateTime = new Date(endDate!);
      shiftEndDateTime.setHours(endHour, endMin, 0, 0);

      if (isAssignMode) {
        // ─── Private / Assign-to-Staff flow ────────────────────────
        const newShift = await createFunction({
          data: {
            facilityProfileId,
            requiredRole: requiredRole as "RN" | "LPN" | "CCA" | "CITR",
            startDateTime: shiftStartDateTime.toISOString(),
            endDateTime: shiftEndDateTime.toISOString(),
            headcount: 1,
            filledCount: 1,
            notes: notes.trim() || undefined,
            requiresOrientation,
            ...(requiresOrientation && orientationNotes.trim()
              ? { orientationNotes: orientationNotes.trim() }
              : {}),
            status: "assigned",
            isPrivate: true,
            assignedStaffId,
          },
        });

        // Save FM-entered staffRate and auto-populated billingRate
        if (newShift?.id) {
          const rateUpdates: Record<string, number> = {};
          if (staffRate && parseFloat(staffRate) > 0) {
            rateUpdates.shiftStaffRate = parseFloat(staffRate);
          }
          if (billingRate && parseFloat(billingRate) > 0) {
            rateUpdates.shiftBillingRate = parseFloat(billingRate);
          }

          if (Object.keys(rateUpdates).length > 0) {
            try {
              await updateShift({
                id: newShift.id,
                data: rateUpdates,
              });
            } catch {
              // Rate update failure shouldn't fail the overall operation
            }
          }

          // Create an auto-approved ShiftApplication record
          try {
            const nowISO = new Date().toISOString();
            await createApplication({
              data: {
                shiftProfileId: newShift.id,
                staffProfileId: assignedStaffId,
                status: "approved",
                appliedAt: nowISO,
                respondedAt: nowISO,
              },
            });
          } catch {
            // Application creation failure is non-blocking – shift was created
          }
        }

        toast.success(
          `Shift assigned to ${selectedStaffName || "staff"} successfully!`,
          {
            action: {
              label: "View Dashboard",
              onClick: () => navigate(getPageUrl(FacilityDashboardPage)),
            },
          }
        );

        resetForm();
      } else {
        // ─── Open Shift flow (existing behaviour) ─────────────────
        const newShift = await createFunction({
          data: {
            facilityProfileId,
            requiredRole: requiredRole as "RN" | "LPN" | "CCA" | "CITR",
            startDateTime: shiftStartDateTime.toISOString(),
            endDateTime: shiftEndDateTime.toISOString(),
            headcount,
            notes: notes.trim() || undefined,
            requiresOrientation,
            ...(requiresOrientation && orientationNotes.trim()
              ? { orientationNotes: orientationNotes.trim() }
              : {}),
            status: "open",
            filledCount: 0,
          },
        });

        // Save FM-entered staffRate and auto-populated billingRate
        if (newShift?.id) {
          const rateUpdates: Record<string, number> = {};
          if (staffRate && parseFloat(staffRate) > 0) {
            rateUpdates.shiftStaffRate = parseFloat(staffRate);
          }
          if (billingRate && parseFloat(billingRate) > 0) {
            rateUpdates.shiftBillingRate = parseFloat(billingRate);
          }

          if (Object.keys(rateUpdates).length > 0) {
            try {
              await updateShift({
                id: newShift.id,
                data: rateUpdates,
              });
            } catch {
              // Rate update failure shouldn't fail the overall operation
            }
          }
        }

        // Auto-assign if enabled
        let autoAssignMsg = "";
        if (autoAssignEnabled && newShift?.id) {
          setIsAutoAssigning(true);
          try {
            const autoResult = await executeAutoAssign({
              shiftId: newShift.id,
              facilityId: facilityProfileId,
              requiredRole: requiredRole as "RN" | "LPN" | "CCA" | "CITR",
              headcount,
              startDateTime: shiftStartDateTime.toISOString(),
              endDateTime: shiftEndDateTime.toISOString(),
            });
            if (autoResult?.assignedCount && autoResult.assignedCount > 0) {
              autoAssignMsg = ` Auto-assigned ${autoResult.assignedCount} of ${headcount} slots from favorites.`;
            }
          } catch {
            // Auto-assign failure doesn't fail the overall operation
          } finally {
            setIsAutoAssigning(false);
          }
        }

        toast.success(`Shift posted successfully!${autoAssignMsg}`, {
          action: {
            label: "View Dashboard",
            onClick: () => navigate(getPageUrl(FacilityDashboardPage)),
          },
        });

        resetForm();
      }
    } catch (error) {
      console.error("Error creating shift:", error);
      toast.error("Failed to create shift. Please try again.");
    }
  }, [
    validateForm, facilityProfileId, startTime, endTime, startDate, endDate,
    requiredRole, headcount, notes, requiresOrientation, orientationNotes,
    autoAssignEnabled, isAssignMode, assignedStaffId, selectedStaffName,
    createFunction, createApplication, updateShift, executeAutoAssign,
    navigate, resetForm, staffRate, billingRate,
  ]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
          <CardDescription>Enter the shift information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shift Type Toggle */}
          <ShiftTypeToggle value={shiftType} onChange={handleShiftTypeChange} />

          {/* Required Role */}
          <div className="space-y-2">
            <Label htmlFor="required-role">Required Role *</Label>
            <Select
              value={requiredRole}
              onValueChange={setRequiredRole}
              disabled={isLoadingRoleTypes}
            >
              <SelectTrigger id="required-role" className="h-11 text-base">
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
                  <Label htmlFor="staff-rate">Staff Rate ($/hr) *</Label>
                  <Input
                    id="staff-rate"
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
                  <Label htmlFor="billing-rate">
                    Billing Rate ($/hr){" "}
                    <span className="text-muted-foreground text-xs">(read-only)</span>
                  </Label>
                  <Input
                    id="billing-rate"
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

          {/* Staff Picker - only when assigning to staff */}
          {isAssignMode && (
            <StaffPicker
              requiredRole={requiredRole}
              value={assignedStaffId}
              onChange={setAssignedStaffId}
              facilityProfileId={facilityProfileId}
            />
          )}

          {/* Auto-Assign Card - only for open shifts */}
          {!isAssignMode && facilityProfileId && (
            <AutoAssignCard
              enabled={autoAssignEnabled}
              onEnabledChange={setAutoAssignEnabled}
              facilityProfileId={facilityProfileId}
              notifyFavorites={notifyFavorites}
              onNotifyFavoritesChange={setNotifyFavorites}
            />
          )}

          {/* Start Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date *</Label>
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
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
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
              <Label htmlFor="start-time">Start Time *</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>End Date *</Label>
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
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time *</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* Headcount - only for open shifts */}
          {!isAssignMode && (
            <div className="space-y-2">
              <Label htmlFor="headcount">Number of Staff Needed *</Label>
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
                  id="headcount"
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
                Minimum 1, maximum 20 staff members
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
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
          disabled={!validateForm.valid || isSubmitting}
          className="h-12 w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isAutoAssigning ? "Auto-assigning favorites..." : isAssignMode ? "Assigning..." : "Posting..."}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {isAssignMode ? "Assign Shift" : "Post Shift"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};