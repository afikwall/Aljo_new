import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityDelete,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  FacilityFavoritesEntity,
  StaffProfilesEntity,
  ShiftApplicationsEntity,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/StarRating";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { AddToFavoritesSheet } from "@/components/AddToFavoritesSheet";
import { Heart, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { getPriorityConfig } from "@/utils/ratingUtils";

interface FacilityFavoritesProps {
  facilityId: string;
}

export const FacilityFavorites = ({ facilityId }: FacilityFavoritesProps) => {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const {
    data: favorites,
    isLoading: loadingFavorites,
    refetch: refetchFavorites,
  } = useEntityGetAll(
    FacilityFavoritesEntity,
    { facilityId },
    { enabled: !!facilityId }
  );

  const { data: allStaff } = useEntityGetAll(StaffProfilesEntity);

  const { data: allApplications } = useEntityGetAll(ShiftApplicationsEntity);

  const { deleteFunction: deleteFavorite } =
    useEntityDelete(FacilityFavoritesEntity);

  // Build staff lookup
  const staffMap = useMemo(() => {
    const map = new Map<string, typeof StaffProfilesEntity["instanceType"]>();
    allStaff?.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return map;
  }, [allStaff]);

  // Build set of existing favorite staff IDs
  const existingFavoriteStaffIds = useMemo(() => {
    const set = new Set<string>();
    favorites?.forEach((f) => {
      if (f.staffProfileId) set.add(f.staffProfileId);
    });
    return set;
  }, [favorites]);

  // Count completed shifts per staff at this facility
  const staffShiftCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!allApplications) return counts;

    allApplications.forEach((app) => {
      if (app.status === "approved" && app.staffProfileId) {
        counts.set(
          app.staffProfileId,
          (counts.get(app.staffProfileId) || 0) + 1
        );
      }
    });
    return counts;
  }, [allApplications]);

  const handleRemoveFavorite = useCallback(
    async (favoriteId: string) => {
      setRemovingId(favoriteId);
      try {
        await deleteFavorite({ id: favoriteId });
        toast.success("Removed from favorites");
        refetchFavorites();
      } catch {
        toast.error("Failed to remove favorite");
      } finally {
        setRemovingId(null);
      }
    },
    [deleteFavorite, refetchFavorites]
  );

  if (loadingFavorites) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Favorites
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddSheetOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!favorites || favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
              <Heart className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No favorite staff yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add staff you love working with!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setAddSheetOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Staff
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const staff = fav.staffProfileId
                  ? staffMap.get(fav.staffProfileId)
                  : null;
                if (!staff) return null;

                const initials =
                  (
                    (staff.firstName?.[0] || "") +
                    (staff.lastName?.[0] || "")
                  ).toUpperCase() || "S";
                const shiftsCount =
                  staffShiftCounts.get(fav.staffProfileId!) || 0;
                const priorityConfig = getPriorityConfig(fav.priority);
                const isRemoving = removingId === fav.id;

                return (
                  <div
                    key={fav.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={staff.profilePhotoUrl} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {staff.firstName} {staff.lastName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {staff.roleType && (
                          <Badge
                            className={`text-xs ${getRoleBadgeColor(staff.roleType)}`}
                          >
                            {staff.roleType}
                          </Badge>
                        )}
                        {(staff.averageRating || 0) > 0 && (
                          <StarRating
                            rating={staff.averageRating || 0}
                            size="sm"
                            showNumeric
                          />
                        )}
                        <Badge className={`text-xs ${priorityConfig.className}`}>
                          {priorityConfig.label}
                        </Badge>
                        <ReliabilityBadge totalShiftsCompleted={staff.totalRatings || 0} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {shiftsCount} shift{shiftsCount !== 1 ? "s" : ""}{" "}
                          completed
                        </span>
                      </div>
                      {fav.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1 truncate">
                          {fav.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFavorite(fav.id!)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className="h-4 w-4 fill-current" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddToFavoritesSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        facilityId={facilityId}
        existingFavoriteStaffIds={existingFavoriteStaffIds}
        onSuccess={() => refetchFavorites()}
      />
    </>
  );
};