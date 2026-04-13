import { useState, useMemo, useCallback } from "react";
import {
  useUser,
  useEntityGetAll,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  OrientationsEntity,
  StaffProfilesEntity,
  ScheduleOrientationShiftAction,
  DenyOrientationRequestAction,
} from "@/product-types";
import type { IOrientationsEntity, IStaffProfilesEntity } from "@/product-types";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { OrientationRequestCard } from "@/components/OrientationRequestCard";
import { ScheduleOrientationDialog } from "@/components/ScheduleOrientationDialog";
import { DenyOrientationDialog } from "@/components/DenyOrientationDialog";

interface OrientationRequestsSectionProps {
  facilityProfileId: string;
}

export const OrientationRequestsSection = ({
  facilityProfileId,
}: OrientationRequestsSectionProps) => {
  const user = useUser();

  // Fetch orientations for this facility
  const {
    data: orientations,
    refetch: refetchOrientations,
  } = useEntityGetAll(
    OrientationsEntity,
    { facilityId: facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  // Fetch all staff profiles for name lookups
  const { data: staffProfiles } = useEntityGetAll(StaffProfilesEntity);

  // Actions
  const {
    executeFunction: scheduleOrientation,
    isLoading: isScheduling,
  } = useExecuteAction(ScheduleOrientationShiftAction);

  const {
    executeFunction: denyOrientation,
    isLoading: isDenying,
  } = useExecuteAction(DenyOrientationRequestAction);

  // Dialog state
  const [selectedForSchedule, setSelectedForSchedule] = useState<
    (IOrientationsEntity & { id: string }) | null
  >(null);
  const [selectedForDeny, setSelectedForDeny] = useState<
    (IOrientationsEntity & { id: string }) | null
  >(null);

  // Build staff lookup map
  const staffMap = useMemo(() => {
    const map = new Map<string, IStaffProfilesEntity & { id: string }>();
    if (!staffProfiles) return map;
    for (const staff of staffProfiles) {
      map.set(staff.id, staff as IStaffProfilesEntity & { id: string });
    }
    return map;
  }, [staffProfiles]);

  // Filter to only requested orientations
  const pendingOrientations = useMemo(() => {
    if (!orientations) return [];
    return orientations
      .filter((o) => o.status === "requested" || o.status === "scheduled")
      .sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      })
      .map((o) => ({ ...o, id: o.id as string }));
  }, [orientations]);

  const count = pendingOrientations.length;

  // Get staff display name
  const getStaffName = useCallback(
    (staffProfileId?: string): string => {
      if (!staffProfileId) return "Unknown Staff";
      const staff = staffMap.get(staffProfileId);
      if (!staff) return "Unknown Staff";
      if (staff.firstName && staff.lastName) {
        return `${staff.firstName} ${staff.lastName}`;
      }
      return staff.email || "Unknown Staff";
    },
    [staffMap]
  );

  // Handle schedule submit
  const handleScheduleSubmit = useCallback(
    async (data: {
      orientationId: string;
      staffProfileId: string;
      date: Date;
      startTime: string;
      endTime: string;
      conductedBy: string;
      notes: string;
    }) => {
      try {
        const dateStr = format(data.date, "yyyy-MM-dd");
        const startDateTime = `${dateStr}T${data.startTime}:00`;
        const endDateTime = `${dateStr}T${data.endTime}:00`;

        await scheduleOrientation({
          orientationId: data.orientationId,
          staffProfileId: data.staffProfileId,
          facilityId: facilityProfileId,
          startDateTime,
          endDateTime,
          orientedBy: data.conductedBy,
          notes: data.notes || undefined,
          scheduledByEmail: user.email || "",
        });

        toast.success("Orientation scheduled!");
        setSelectedForSchedule(null);
        refetchOrientations();
      } catch {
        toast.error("Failed to schedule orientation. Please try again.");
      }
    },
    [scheduleOrientation, facilityProfileId, user.email, refetchOrientations]
  );

  // Handle deny confirm
  const handleDenyConfirm = useCallback(
    async (data: { orientationId: string; reason: string }) => {
      try {
        await denyOrientation({
          orientationId: data.orientationId,
          denialReason: data.reason || undefined,
          deniedByEmail: user.email || "",
        });

        toast.success("Orientation request denied");
        setSelectedForDeny(null);
        refetchOrientations();
      } catch {
        toast.error("Failed to deny orientation request. Please try again.");
      }
    },
    [denyOrientation, user.email, refetchOrientations]
  );

  const handleOpenSchedule = useCallback(
    (orientation: IOrientationsEntity & { id: string }) => {
      setSelectedForSchedule(orientation);
    },
    []
  );

  const handleOpenDeny = useCallback(
    (orientation: IOrientationsEntity & { id: string }) => {
      setSelectedForDeny(orientation);
    },
    []
  );

  const handleCloseSchedule = useCallback((open: boolean) => {
    if (!open) setSelectedForSchedule(null);
  }, []);

  const handleCloseDeny = useCallback((open: boolean) => {
    if (!open) setSelectedForDeny(null);
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-chart-3" />
            <h2 className="text-lg font-semibold">Orientation Requests</h2>
          </div>
          <span
            className={
              count > 0
                ? "rounded-full text-xs px-2 py-0.5 bg-chart-3/20 text-chart-3 font-medium"
                : "rounded-full text-xs px-2 py-0.5 bg-muted text-muted-foreground font-medium"
            }
          >
            {count}
          </span>
        </div>

        {/* Content */}
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending or scheduled orientation requests
          </p>
        ) : (
          <div className="space-y-2">
            {pendingOrientations.map((orientation) => (
              <OrientationRequestCard
                key={orientation.id}
                orientation={orientation}
                staff={
                  orientation.staffProfileId
                    ? staffMap.get(orientation.staffProfileId) || null
                    : null
                }
                onSchedule={handleOpenSchedule}
                onDeny={handleOpenDeny}
              />
            ))}
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      <ScheduleOrientationDialog
        orientation={selectedForSchedule}
        staffName={getStaffName(selectedForSchedule?.staffProfileId)}
        open={!!selectedForSchedule}
        onOpenChange={handleCloseSchedule}
        onSubmit={handleScheduleSubmit}
        isSubmitting={isScheduling}
      />

      {/* Deny Dialog */}
      <DenyOrientationDialog
        orientation={selectedForDeny}
        staffName={getStaffName(selectedForDeny?.staffProfileId)}
        open={!!selectedForDeny}
        onOpenChange={handleCloseDeny}
        onConfirm={handleDenyConfirm}
        isDenying={isDenying}
      />
    </>
  );
};