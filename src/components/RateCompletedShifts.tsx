import { useState, useMemo, useCallback } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ShiftsEntity,
  ShiftApplicationsEntity,
  StaffProfilesEntity,
  StaffRatingsEntity,
  TimeLogsEntity,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/StarRating";
import { RateStaffSheet } from "@/components/RateStaffSheet";
import { Star, CheckCircle, Clock } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface RateCompletedShiftsProps {
  facilityId: string;
  ratedByEmail: string;
  onRated?: () => void;
}

export const RateCompletedShifts = ({
  facilityId,
  ratedByEmail,
  onRated,
}: RateCompletedShiftsProps) => {
  const [rateSheetOpen, setRateSheetOpen] = useState(false);
  const [selectedShiftForRating, setSelectedShiftForRating] = useState<{
    shift: { id: string; requiredRole?: string; startDateTime?: string; endDateTime?: string };
    staffProfile: { id: string; firstName?: string; lastName?: string; email?: string; profilePhotoUrl?: string; roleType?: string };
  } | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch completed shifts for this facility
  const { data: allShifts, isLoading: loadingShifts } = useEntityGetAll(
    ShiftsEntity,
    { facilityProfileId: facilityId, status: "completed" },
    { enabled: !!facilityId }
  );

  // Fetch all applications to find approved staff for each shift
  const { data: allApplications, isLoading: loadingApps } = useEntityGetAll(
    ShiftApplicationsEntity,
    {},
    { enabled: !!facilityId }
  );

  // Fetch all staff profiles
  const { data: allStaff } = useEntityGetAll(StaffProfilesEntity);

  // Fetch existing ratings for this facility
  const { data: existingRatings, refetch: refetchRatings } = useEntityGetAll(
    StaffRatingsEntity,
    { facilityId },
    { enabled: !!facilityId }
  );

  // Fetch all time logs to show clock-in/clock-out times
  const { data: allTimeLogs } = useEntityGetAll(TimeLogsEntity);

  // Build time log lookup map keyed by shiftProfileId_staffProfileId
  const timeLogMap = new Map<string, typeof TimeLogsEntity["instanceType"]>();
  allTimeLogs?.forEach((log) => {
    if (log.shiftProfileId && log.staffProfileId) {
      timeLogMap.set(`${log.shiftProfileId}_${log.staffProfileId}`, log);
    }
  });

  // Build a set of shift+staff combos that are already rated
  const ratedShiftStaffSet = useMemo(() => {
    const set = new Set<string>();
    existingRatings?.forEach((r) => {
      if (r.shiftId && r.staffProfileId) {
        set.add(`${r.shiftId}_${r.staffProfileId}`);
      }
    });
    return set;
  }, [existingRatings]);

  // Get the rating for a shift+staff combo
  const getRatingForShift = useCallback(
    (shiftId: string, staffProfileId: string) => {
      return existingRatings?.find(
        (r) => r.shiftId === shiftId && r.staffProfileId === staffProfileId
      );
    },
    [existingRatings]
  );

  // Build staff lookup map
  const staffMap = useMemo(() => {
    const map = new Map<string, typeof StaffProfilesEntity["instanceType"]>();
    allStaff?.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return map;
  }, [allStaff]);

  // Get completed shifts from last 30 days with approved staff
  const completedShiftsWithStaff = useMemo(() => {
    if (!allShifts || !allApplications) return [];

    const thirtyDaysAgo = subDays(new Date(), 30);

    const recentShifts = allShifts.filter((s) => {
      if (!s.startDateTime) return false;
      try {
        return parseISO(s.startDateTime) >= thirtyDaysAgo;
      } catch {
        return false;
      }
    });

    const result: Array<{
      shift: typeof ShiftsEntity["instanceType"];
      staffProfile: typeof StaffProfilesEntity["instanceType"];
      isRated: boolean;
      existingRating?: number;
    }> = [];

    for (const shift of recentShifts) {
      const approvedApps = allApplications.filter(
        (app) =>
          app.shiftProfileId === shift.id && app.status === "approved"
      );

      for (const app of approvedApps) {
        if (!app.staffProfileId) continue;
        const staff = staffMap.get(app.staffProfileId);
        if (!staff) continue;

        const isRated = ratedShiftStaffSet.has(
          `${shift.id}_${app.staffProfileId}`
        );
        const rating = isRated
          ? getRatingForShift(shift.id!, app.staffProfileId)
          : undefined;

        result.push({
          shift,
          staffProfile: staff,
          isRated,
          existingRating: rating?.rating,
        });
      }
    }

    // Sort: unrated first, then by shift date descending
    return result.sort((a, b) => {
      if (a.isRated !== b.isRated) return a.isRated ? 1 : -1;
      const dateA = a.shift.startDateTime
        ? parseISO(a.shift.startDateTime).getTime()
        : 0;
      const dateB = b.shift.startDateTime
        ? parseISO(b.shift.startDateTime).getTime()
        : 0;
      return dateB - dateA;
    });
  }, [
    allShifts,
    allApplications,
    staffMap,
    ratedShiftStaffSet,
    getRatingForShift,
  ]);

  const displayedShifts = useMemo(() => {
    if (showAll) return completedShiftsWithStaff;
    return completedShiftsWithStaff.slice(0, 5);
  }, [completedShiftsWithStaff, showAll]);

  const handleRateStaff = useCallback(
    (
      shift: typeof ShiftsEntity["instanceType"],
      staffProfile: typeof StaffProfilesEntity["instanceType"]
    ) => {
      setSelectedShiftForRating({
        shift: {
          id: shift.id!,
          requiredRole: shift.requiredRole,
          startDateTime: shift.startDateTime,
          endDateTime: shift.endDateTime,
        },
        staffProfile: {
          id: staffProfile.id!,
          firstName: staffProfile.firstName,
          lastName: staffProfile.lastName,
          email: staffProfile.email,
          profilePhotoUrl: staffProfile.profilePhotoUrl,
          roleType: staffProfile.roleType,
        },
      });
      setRateSheetOpen(true);
    },
    []
  );

  const handleRatingSuccess = useCallback(() => {
    refetchRatings();
    onRated?.();
  }, [refetchRatings, onRated]);

  if (loadingShifts || loadingApps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rate Completed Shifts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rate Completed Shifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedShiftsWithStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No completed shifts to rate</p>
              <p className="text-sm text-muted-foreground mt-1">
                Completed shifts from the last 30 days will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedShifts.map((item, index) => {
                const initials =
                  (
                    (item.staffProfile.firstName?.[0] || "") +
                    (item.staffProfile.lastName?.[0] || "")
                  ).toUpperCase() || "S";

                const timeLogKey = `${item.shift.id}_${item.staffProfile.id}`;
                const timeLog = timeLogMap.get(timeLogKey);
                const clockInDisplay = timeLog?.clockInTime
                  ? format(parseISO(timeLog.clockInTime), "h:mm a")
                  : null;
                const clockOutDisplay = timeLog?.clockOutTime
                  ? format(parseISO(timeLog.clockOutTime), "h:mm a")
                  : null;
                const clockTimeLabel =
                  clockInDisplay && clockOutDisplay
                    ? `In: ${clockInDisplay} → Out: ${clockOutDisplay}`
                    : clockInDisplay
                    ? `In: ${clockInDisplay}`
                    : clockOutDisplay
                    ? `Out: ${clockOutDisplay}`
                    : null;

                return (
                  <div
                    key={`${item.shift.id}-${item.staffProfile.id}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={item.staffProfile.profilePhotoUrl} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.staffProfile.firstName}{" "}
                        {item.staffProfile.lastName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.staffProfile.roleType && (
                          <Badge
                            className={`text-xs ${getRoleBadgeColor(item.staffProfile.roleType)}`}
                          >
                            {item.staffProfile.roleType}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {item.shift.startDateTime
                            ? format(
                                parseISO(item.shift.startDateTime),
                                "MMM d"
                              )
                            : ""}
                        </span>
                      </div>
                      {clockTimeLabel && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{clockTimeLabel}</span>
                        </div>
                      )}
                    </div>
                    {item.isRated ? (
                      <Badge className="bg-accent/20 text-accent gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Rated {item.existingRating ? `${item.existingRating}.0` : ""}
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() =>
                          handleRateStaff(item.shift, item.staffProfile)
                        }
                      >
                        <Star className="h-3.5 w-3.5" />
                        Rate
                      </Button>
                    )}
                  </div>
                );
              })}

              {completedShiftsWithStaff.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? "Show Less"
                    : `View All (${completedShiftsWithStaff.length})`}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RateStaffSheet
        open={rateSheetOpen}
        onOpenChange={setRateSheetOpen}
        shift={selectedShiftForRating?.shift || null}
        staffProfile={selectedShiftForRating?.staffProfile || null}
        facilityId={facilityId}
        ratedByEmail={ratedByEmail}
        onSuccess={handleRatingSuccess}
      />
    </>
  );
};