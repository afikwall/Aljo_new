import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Users as UsersIcon,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { getStaffDisplayName, getStaffInitials, COMPLIANCE_BADGE_COLORS } from "@/utils/shiftApplicationUtils";
import { isRoleEligible } from "@/utils/eligibilityUtils";
import type {
  IFacilitiesEntity,
  IStaffProfilesEntity,
  IShiftApplicationsEntity,
} from "@/product-types";

interface ShiftInstance {
  id: string;
  status?: string;
  facilityProfileId?: string;
  requiredRole?: string;
  startDateTime?: string;
  endDateTime?: string;
  headcount?: number;
  filledCount?: number;
  isShortNotice?: boolean;
  isHoliday?: boolean;
  notes?: string;
}

type StaffWithId = IStaffProfilesEntity & { id: string };
type ApplicationWithId = IShiftApplicationsEntity & { id: string };
type ShiftWithId = { id: string; startDateTime?: string; endDateTime?: string; status?: string };

interface AssignStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftInstance | null;
  facility?: IFacilitiesEntity & { id: string };
  allStaff: StaffWithId[];
  allApplications: ApplicationWithId[];
  allShifts: ShiftWithId[];
  isAssigning: boolean;
  onConfirmAssignment: (staffProfileId: string) => void;
}

function hasTimeOverlap(
  startA?: string,
  endA?: string,
  startB?: string,
  endB?: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  try {
    const a0 = parseISO(startA).getTime();
    const a1 = parseISO(endA).getTime();
    const b0 = parseISO(startB).getTime();
    const b1 = parseISO(endB).getTime();
    return a0 < b1 && b0 < a1;
  } catch {
    return false;
  }
}

export const AssignStaffModal = ({
  open,
  onOpenChange,
  shift,
  facility,
  allStaff,
  allApplications,
  allShifts,
  isAssigning,
  onConfirmAssignment,
}: AssignStaffModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Reset state when modal opens/closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setSearchQuery("");
        setSelectedStaffId(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  // Build a map of shiftId -> shift for quick lookup
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftWithId>();
    allShifts.forEach((s) => map.set(s.id, s));
    return map;
  }, [allShifts]);

  // Find approved applications per staff for conflict detection
  const staffConflicts = useMemo(() => {
    if (!shift) return new Set<string>();
    const conflicts = new Set<string>();

    allApplications.forEach((app) => {
      if (app.status !== "approved" || !app.staffProfileId || !app.shiftProfileId) return;
      const appShift = shiftMap.get(app.shiftProfileId);
      if (!appShift) return;
      if (
        hasTimeOverlap(
          shift.startDateTime,
          shift.endDateTime,
          appShift.startDateTime,
          appShift.endDateTime
        )
      ) {
        conflicts.add(app.staffProfileId);
      }
    });

    return conflicts;
  }, [shift, allApplications, shiftMap]);

  // Filter eligible staff: approved onboarding, compliant, role eligible
  const eligibleStaff = useMemo(() => {
    if (!shift?.requiredRole) return [];

    return allStaff.filter((staff) => {
      if (staff.onboardingStatus !== "approved") return false;
      if (staff.complianceStatus !== "compliant") return false;
      if (!isRoleEligible(staff.roleType, shift.requiredRole)) return false;
      return true;
    });
  }, [allStaff, shift?.requiredRole]);

  // Apply search filter
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return eligibleStaff;
    const q = searchQuery.toLowerCase().trim();
    return eligibleStaff.filter((staff) => {
      const name = getStaffDisplayName(staff.firstName, staff.lastName, staff.email).toLowerCase();
      const email = (staff.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [eligibleStaff, searchQuery]);

  // Sort: non-conflict first, then alphabetical
  const sortedStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      const aConflict = staffConflicts.has(a.id) ? 1 : 0;
      const bConflict = staffConflicts.has(b.id) ? 1 : 0;
      if (aConflict !== bConflict) return aConflict - bConflict;
      const aName = getStaffDisplayName(a.firstName, a.lastName, a.email);
      const bName = getStaffDisplayName(b.firstName, b.lastName, b.email);
      return aName.localeCompare(bName);
    });
  }, [filteredStaff, staffConflicts]);

  const handleConfirm = useCallback(() => {
    if (selectedStaffId) {
      onConfirmAssignment(selectedStaffId);
    }
  }, [selectedStaffId, onConfirmAssignment]);

  // Format shift date for display
  const formattedDate = useMemo(() => {
    if (!shift?.startDateTime) return "";
    try {
      return format(parseISO(shift.startDateTime), "EEEE, MMMM d, yyyy");
    } catch {
      return "";
    }
  }, [shift?.startDateTime]);

  const formattedTimeRange = useMemo(() => {
    if (!shift?.startDateTime || !shift?.endDateTime) return "";
    try {
      const start = parseISO(shift.startDateTime);
      const end = parseISO(shift.endDateTime);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
      return `${format(start, "h:mm a")} – ${format(end, "h:mm a")} (${hours} hours)`;
    } catch {
      return "";
    }
  }, [shift?.startDateTime, shift?.endDateTime]);

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Staff to Shift</DialogTitle>
          <DialogDescription>
            Select an eligible staff member to assign to this shift.
          </DialogDescription>
        </DialogHeader>

        {/* Shift Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="font-semibold text-sm">{facility?.name || "Unknown Facility"}</p>
          {facility?.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {facility.address}{facility.city ? `, ${facility.city}` : ""}{facility.province ? `, ${facility.province}` : ""}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formattedDate}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {formattedTimeRange}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Badge className={cn("text-xs", getRoleBadgeColor(shift.requiredRole))}>
              {shift.requiredRole}
            </Badge>
            {shift.isShortNotice && (
              <Badge variant="outline" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Short Notice
              </Badge>
            )}
            {shift.isHoliday && (
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Holiday
              </Badge>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Staff List */}
        <ScrollArea className="max-h-[400px] flex-1 -mx-1 px-1">
          {sortedStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[180px] rounded-lg border border-dashed p-6 text-center">
              <UsersIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm">No eligible staff found</p>
              <p className="text-xs text-muted-foreground mt-1">
                No staff match the criteria for this shift role.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedStaff.map((staff) => {
                const hasConflict = staffConflicts.has(staff.id);
                const isSelected = selectedStaffId === staff.id;
                const name = getStaffDisplayName(staff.firstName, staff.lastName, staff.email);
                const initials = getStaffInitials(staff.firstName, staff.lastName);
                const complianceBadge = COMPLIANCE_BADGE_COLORS[staff.complianceStatus || ""] || COMPLIANCE_BADGE_COLORS.pending;

                return (
                  <button
                    key={staff.id}
                    type="button"
                    disabled={hasConflict}
                    onClick={() => setSelectedStaffId(isSelected ? null : staff.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      hasConflict
                        ? "opacity-50 bg-muted/30 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge className={cn("text-xs", getRoleBadgeColor(staff.roleType))}>
                          {staff.roleType}
                        </Badge>
                        <Badge className={cn("text-xs", complianceBadge.className)}>
                          {complianceBadge.label}
                        </Badge>
                        {hasConflict && (
                          <Badge className="text-xs bg-chart-3/20 text-chart-3">
                            Conflict
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && !hasConflict && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAssigning}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStaffId || isAssigning}
            className="h-11"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Confirm Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};