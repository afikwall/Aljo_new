import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  OrientationsEntity,
  StaffProfilesEntity,
  CompleteOrientationAction,
} from "@/product-types";
import type { IStaffProfilesEntity } from "@/product-types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { OrientationTable } from "@/components/OrientationTable";
import { OrientationMobileCard } from "@/components/OrientationMobileCard";
import { MarkOrientedSheet } from "@/components/MarkOrientedSheet";
import { StaffProfilePopup } from "@/components/StaffProfilePopup";

interface OrientationManagementSectionProps {
  facilityProfileId: string;
}

export const OrientationManagementSection = ({
  facilityProfileId,
}: OrientationManagementSectionProps) => {
  const user = useUser();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Fetch orientations for this facility
  const {
    data: orientations,
    isLoading: loadingOrientations,
    refetch: refetchOrientations,
  } = useEntityGetAll(
    OrientationsEntity,
    { facilityId: facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  // Fetch all staff profiles for name lookups
  const { data: staffProfiles, isLoading: loadingStaff } =
    useEntityGetAll(StaffProfilesEntity);

  // Create orientation record
  const { createFunction: createOrientation, isLoading: isCreating } =
    useEntityCreate(OrientationsEntity);

  // Update staff profile to add orientedFacilityIds
  const { updateFunction: updateStaffProfile } =
    useEntityUpdate(StaffProfilesEntity);

  // CompleteOrientation action
  const { executeFunction: executeCompleteOrientation, isLoading: isCompleting } =
    useExecuteAction(CompleteOrientationAction);
  const [completingOrientationId, setCompletingOrientationId] = useState<string | null>(null);

  // Build staff map: staffProfileId -> staff profile
  const staffMap = useMemo(() => {
    const map = new Map<string, IStaffProfilesEntity & { id: string }>();
    if (!staffProfiles) return map;
    for (const staff of staffProfiles) {
      map.set(staff.id, staff as IStaffProfilesEntity & { id: string });
    }
    return map;
  }, [staffProfiles]);

  // Sort orientations by completedAt descending
  const sortedOrientations = useMemo(() => {
    if (!orientations) return [];
    return [...orientations]
      .sort((a, b) => {
        const dateA = a.completedAt
          ? new Date(a.completedAt).getTime()
          : 0;
        const dateB = b.completedAt
          ? new Date(b.completedAt).getTime()
          : 0;
        return dateB - dateA;
      })
      .map((o) => ({ ...o, id: o.id as string }));
  }, [orientations]);

  const typedStaffProfiles = useMemo(() => {
    return (
      (staffProfiles as (IStaffProfilesEntity & { id: string })[]) || []
    );
  }, [staffProfiles]);

  // Compute staff profiles that have a "requested" orientation at this facility
  const requestingStaffProfiles = useMemo(() => {
    if (!orientations) return [];
    return orientations
      .filter((o) => o.status === "requested" && o.staffProfileId)
      .map((o) => staffMap.get(o.staffProfileId!))
      .filter((s): s is IStaffProfilesEntity & { id: string } => !!s);
  }, [orientations, staffMap]);

  const getStaffDisplayName = useCallback(
    (staffId: string): string => {
      const staff = staffMap.get(staffId);
      if (!staff) return "Unknown Staff";
      if (staff.firstName && staff.lastName) {
        return `${staff.firstName} ${staff.lastName}`;
      }
      return staff.email || "Unknown Staff";
    },
    [staffMap]
  );

  const handleSubmitOrientation = useCallback(
    async (data: {
      staffProfileId: string;
      orientationDate: Date;
      orientedBy: string;
      notes: string;
    }) => {
      try {
        // Format date to ISO at noon
        const year = data.orientationDate.getFullYear();
        const month = String(data.orientationDate.getMonth() + 1).padStart(
          2,
          "0"
        );
        const day = String(data.orientationDate.getDate()).padStart(2, "0");
        const completedAt = `${year}-${month}-${day}T12:00:00`;

        // Create the orientation record
        await createOrientation({
          data: {
            staffProfileId: data.staffProfileId,
            facilityId: facilityProfileId,
            status: "completed",
            completedAt,
            orientedBy: data.orientedBy,
            notes: data.notes || undefined,
          },
        });

        // Update staff profile's orientedFacilityIds
        const staff = staffMap.get(data.staffProfileId);
        if (staff) {
          const existingIds = staff.orientedFacilityIds || [];
          if (!existingIds.includes(facilityProfileId)) {
            await updateStaffProfile({
              id: data.staffProfileId,
              data: {
                orientedFacilityIds: [...existingIds, facilityProfileId],
              },
            });
          }
        }

        const staffName = getStaffDisplayName(data.staffProfileId);
        toast.success(`Orientation recorded for ${staffName}!`);
        setSheetOpen(false);
        refetchOrientations();
      } catch {
        toast.error("Failed to record orientation. Please try again.");
      }
    },
    [
      facilityProfileId,
      createOrientation,
      updateStaffProfile,
      staffMap,
      getStaffDisplayName,
      refetchOrientations,
    ]
  );

  const handleOpenSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const handleMarkComplete = useCallback(
    async (orientationId: string, staffProfileId: string) => {
      setCompletingOrientationId(orientationId);
      try {
        const result = await executeCompleteOrientation({
          orientationId,
          staffProfileId,
          facilityId: facilityProfileId,
          completedByEmail: user.email || "",
        });
        if (result?.success) {
          const staffName = getStaffDisplayName(staffProfileId);
          toast.success(`Orientation marked as complete for ${staffName}!`);
          refetchOrientations();
        } else {
          toast.error(result?.message || "Failed to complete orientation.");
        }
      } catch {
        toast.error("Failed to complete orientation. Please try again.");
      } finally {
        setCompletingOrientationId(null);
      }
    },
    [executeCompleteOrientation, facilityProfileId, user.email, getStaffDisplayName, refetchOrientations]
  );

  const handleStaffClick = useCallback((staffProfileId: string) => {
    setSelectedStaffId(staffProfileId);
  }, []);

  const selectedStaff = selectedStaffId ? staffMap.get(selectedStaffId) ?? null : null;

  const isLoading = loadingOrientations || loadingStaff;
  const hasOrientations = sortedOrientations.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-chart-3" />
            <CardTitle className="text-lg">Orientation Management</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSheet}
          >
            <Plus className="mr-1 h-4 w-4" />
            Mark as Oriented
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !hasOrientations ? (
            /* Empty State */
            <div className="border border-dashed rounded-lg min-h-[180px] flex flex-col items-center justify-center gap-3 p-6">
              <GraduationCap className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                No orientations recorded yet
              </p>
              <Button onClick={handleOpenSheet}>
                Mark First Staff as Oriented
              </Button>
            </div>
          ) : isMobile ? (
            /* Mobile: stacked cards */
            <div className="space-y-3">
              {sortedOrientations.map((orientation) => (
                <OrientationMobileCard
                  key={orientation.id}
                  orientation={orientation}
                  staff={
                    orientation.staffProfileId
                      ? staffMap.get(orientation.staffProfileId)
                      : null
                  }
                  onMarkComplete={
                  orientation.status === "scheduled" && orientation.staffProfileId
                    ? () => handleMarkComplete(orientation.id, orientation.staffProfileId!)
                    : undefined
                }
                isMarkingComplete={completingOrientationId === orientation.id}
                onClick={
                    orientation.staffProfileId
                      ? () => handleStaffClick(orientation.staffProfileId!)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            /* Desktop: table */
            <OrientationTable
              orientations={sortedOrientations}
              staffMap={staffMap}
              onStaffClick={handleStaffClick}
              onMarkComplete={handleMarkComplete}
              completingOrientationId={completingOrientationId}
            />
          )}
        </CardContent>
      </Card>

      {/* Mark as Oriented Sheet */}
      <MarkOrientedSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        staffProfiles={requestingStaffProfiles}
        onSubmit={handleSubmitOrientation}
        isSubmitting={isCreating}
      />

      {/* Staff Profile Popup */}
      <StaffProfilePopup
        open={!!selectedStaffId}
        onOpenChange={(open) => {
          if (!open) setSelectedStaffId(null);
        }}
        staff={selectedStaff}
      />
    </>
  );
};