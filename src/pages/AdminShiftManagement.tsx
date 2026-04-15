import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ShiftsEntity,
  FacilitiesEntity,
  StaffProfilesEntity,
  ShiftApplicationsEntity,
  AdminAssignStaffToShiftAction,
} from "@/product-types";
import type {
  IShiftsEntity,
  IFacilitiesEntity,
  IStaffProfilesEntity,
  IShiftApplicationsEntity,
} from "@/product-types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, ClipboardList } from "lucide-react";
import { parseISO } from "date-fns";
import { AdminShiftCard } from "@/components/AdminShiftCard";
import { AssignStaffModal } from "@/components/AssignStaffModal";
import { UnassignConfirmDialog } from "@/components/UnassignConfirmDialog";
import { AdminShiftFilters, type ShiftFiltersState } from "@/components/AdminShiftFilters";
import { getStaffDisplayName } from "@/utils/shiftApplicationUtils";

type ShiftWithId = IShiftsEntity & { id: string };
type FacilityWithId = IFacilitiesEntity & { id: string };
type StaffWithId = IStaffProfilesEntity & { id: string };
type ApplicationWithId = IShiftApplicationsEntity & { id: string };

export default function AdminShiftManagement() {
  const user = useUser();

  // Data fetching
  const {
    data: shiftsRaw,
    isLoading: isLoadingShifts,
    refetch: refetchShifts,
  } = useEntityGetAll(ShiftsEntity);
  const { data: facilitiesRaw, isLoading: isLoadingFacilities } =
    useEntityGetAll(FacilitiesEntity);
  const { data: staffRaw, isLoading: isLoadingStaff } =
    useEntityGetAll(StaffProfilesEntity);
  const {
    data: applicationsRaw,
    isLoading: isLoadingApplications,
    refetch: refetchApplications,
  } = useEntityGetAll(ShiftApplicationsEntity);
  // Action
  const { executeFunction: executeAssign, isLoading: isExecutingAction } =
    useExecuteAction(AdminAssignStaffToShiftAction);

  // Filter state
  const [filters, setFilters] = useState<ShiftFiltersState>({
    status: "all",
    facilityId: "all",
    role: "all",
    startDate: "",
    endDate: "",
  });

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftWithId | null>(null);

  // Unassign dialog state
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<{
    shift: ShiftWithId;
    staffName: string;
  } | null>(null);

  // Type-safe data
  const shifts = useMemo(
    () => (shiftsRaw as ShiftWithId[] | undefined) || [],
    [shiftsRaw]
  );
  const facilities = useMemo(
    () => (facilitiesRaw as FacilityWithId[] | undefined) || [],
    [facilitiesRaw]
  );
  const allStaff = useMemo(
    () => (staffRaw as StaffWithId[] | undefined) || [],
    [staffRaw]
  );
  const allApplications = useMemo(
    () => (applicationsRaw as ApplicationWithId[] | undefined) || [],
    [applicationsRaw]
  );

  // Lookup maps
  const facilityMap = useMemo(() => {
    const map = new Map<string, FacilityWithId>();
    facilities.forEach((f) => map.set(f.id, f));
    return map;
  }, [facilities]);

  const staffMap = useMemo(() => {
    const map = new Map<string, StaffWithId>();
    allStaff.forEach((s) => map.set(s.id, s));
    return map;
  }, [allStaff]);

  // Shift list for conflict detection (id + times + status)
  const shiftListForConflicts = useMemo(() => {
    return shifts.map((s) => ({
      id: s.id,
      startDateTime: s.startDateTime,
      endDateTime: s.endDateTime,
      status: s.status,
    }));
  }, [shifts]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // Status filter
      if (filters.status !== "all" && shift.status !== filters.status) return false;

      // Facility filter
      if (filters.facilityId !== "all" && shift.facilityProfileId !== filters.facilityId)
        return false;

      // Role filter
      if (filters.role !== "all" && shift.requiredRole !== filters.role) return false;

      // Date range filter
      if (filters.startDate && shift.startDateTime) {
        try {
          const shiftDate = parseISO(shift.startDateTime);
          const filterStart = new Date(filters.startDate + "T00:00:00");
          if (shiftDate < filterStart) return false;
        } catch {
          // ignore parse errors
        }
      }
      if (filters.endDate && shift.startDateTime) {
        try {
          const shiftDate = parseISO(shift.startDateTime);
          const filterEnd = new Date(filters.endDate + "T23:59:59");
          if (shiftDate > filterEnd) return false;
        } catch {
          // ignore parse errors
        }
      }

      return true;
    });
  }, [shifts, filters]);

  // Sort: open first, then assigned, then by date descending
  const sortedShifts = useMemo(() => {
    const statusOrder: Record<string, number> = {
      open: 0,
      assigned: 1,
      claimed: 2,
      in_progress: 3,
      completed: 4,
      cancelled: 5,
    };
    return [...filteredShifts].sort((a, b) => {
      const aOrder = statusOrder[a.status || ""] ?? 99;
      const bOrder = statusOrder[b.status || ""] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Within same status, sort by date descending (newest first)
      const aDate = a.startDateTime || "";
      const bDate = b.startDateTime || "";
      return bDate.localeCompare(aDate);
    });
  }, [filteredShifts]);

  // Handlers
  const handleOpenAssignModal = useCallback((shift: ShiftWithId) => {
    setSelectedShift(shift);
    setAssignModalOpen(true);
  }, []);

  const handleOpenUnassignDialog = useCallback(
    (shift: ShiftWithId, staffName: string) => {
      setUnassignTarget({ shift, staffName });
      setUnassignDialogOpen(true);
    },
    []
  );

  const handleConfirmAssignment = useCallback(
    async (staffProfileId: string) => {
      if (!selectedShift) return;
      try {
        const result = await executeAssign({
          action: "assign" as const,
          shiftId: selectedShift.id,
          staffProfileId,
          adminEmail: user.email || "",
        });
        if (result?.success) {
          toast.success("Staff assigned successfully!");
          setAssignModalOpen(false);
          setSelectedShift(null);
          refetchShifts();
          refetchApplications();
        } else {
          toast.error(result?.message || "Failed to assign staff.");
        }
      } catch (err) {
        toast.error("An error occurred while assigning staff.");
      }
    },
    [selectedShift, executeAssign, user.email, refetchShifts, refetchApplications]
  );

  const handleConfirmUnassign = useCallback(async () => {
    if (!unassignTarget) return;
    try {
      const result = await executeAssign({
        action: "unassign" as const,
        shiftId: unassignTarget.shift.id,
        adminEmail: user.email || "",
      });
      if (result?.success) {
        toast.success("Staff unassigned. Shift is now open.");
        setUnassignDialogOpen(false);
        setUnassignTarget(null);
        refetchShifts();
        refetchApplications();
      } else {
        toast.error(result?.message || "Failed to unassign staff.");
      }
    } catch (err) {
      toast.error("An error occurred while unassigning staff.");
    }
  }, [unassignTarget, executeAssign, user.email, refetchShifts, refetchApplications]);

  const isLoading =
    isLoadingShifts || isLoadingFacilities || isLoadingStaff || isLoadingApplications;

  // Get the facility for the assign modal
  const assignModalFacility = useMemo(() => {
    if (!selectedShift?.facilityProfileId) return undefined;
    return facilityMap.get(selectedShift.facilityProfileId);
  }, [selectedShift, facilityMap]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6" />
          Shift Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View all shifts and manually assign or unassign staff.
        </p>
      </div>

      {/* Filters */}
      <AdminShiftFilters
        filters={filters}
        onFiltersChange={setFilters}
        facilities={facilities}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : sortedShifts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-[180px] rounded-lg border border-dashed p-8 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-semibold">No shifts found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adjust your filters to see shifts.
          </p>
        </div>
      ) : (
        /* Shift Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedShifts.map((shift) => {
            const facility = facilityMap.get(shift.facilityProfileId || "");
            const assignedStaff = shift.assignedStaffId
              ? staffMap.get(shift.assignedStaffId) || null
              : null;

            return (
              <AdminShiftCard
                key={shift.id}
                shift={shift}
                facility={facility}
                assignedStaff={assignedStaff}
                onAssignStaff={handleOpenAssignModal as (shift: any) => void}
                onUnassignStaff={handleOpenUnassignDialog as (shift: any, name: string) => void}
              />
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && sortedShifts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {sortedShifts.length} of {shifts.length} shifts
        </p>
      )}

      {/* Assign Staff Modal */}
      <AssignStaffModal
        open={assignModalOpen}
        onOpenChange={(open) => {
          setAssignModalOpen(open);
          if (!open) setSelectedShift(null);
        }}
        shift={selectedShift}
        facility={assignModalFacility}
        allStaff={allStaff}
        allApplications={allApplications}
        allShifts={shiftListForConflicts}
        isAssigning={isExecutingAction}
        onConfirmAssignment={handleConfirmAssignment}
      />

      {/* Unassign Confirmation Dialog */}
      <UnassignConfirmDialog
        open={unassignDialogOpen}
        onOpenChange={(open) => {
          setUnassignDialogOpen(open);
          if (!open) setUnassignTarget(null);
        }}
        staffName={unassignTarget?.staffName || ""}
        isUnassigning={isExecutingAction}
        onConfirm={handleConfirmUnassign}
      />
    </div>
  );
}