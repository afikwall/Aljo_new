import { useMemo, useCallback, useState } from "react";
import {
  useEntityGetAll,
  useEntityDelete,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  FacilityFavoritesEntity,
  StaffProfilesEntity,
  FacilitiesEntity,
} from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/StarRating";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { Heart, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { getPriorityConfig } from "@/utils/ratingUtils";

export const AdminFavoritesTab = () => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const {
    data: allFavorites,
    isLoading: loadingFavorites,
    refetch: refetchFavorites,
  } = useEntityGetAll(FacilityFavoritesEntity);

  const { data: allStaff } = useEntityGetAll(StaffProfilesEntity);
  const { data: allFacilities } = useEntityGetAll(FacilitiesEntity);

  const { deleteFunction: deleteFavorite } =
    useEntityDelete(FacilityFavoritesEntity);

  // Build lookups
  const staffMap = useMemo(() => {
    const map = new Map<string, typeof StaffProfilesEntity["instanceType"]>();
    allStaff?.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return map;
  }, [allStaff]);

  const facilityMap = useMemo(() => {
    const map = new Map<string, typeof FacilitiesEntity["instanceType"]>();
    allFacilities?.forEach((f) => {
      if (f.id) map.set(f.id, f);
    });
    return map;
  }, [allFacilities]);

  // Group favorites by facility
  const groupedFavorites = useMemo(() => {
    if (!allFavorites) return [];

    const groups = new Map<
      string,
      {
        facilityId: string;
        facilityName: string;
        favorites: typeof allFavorites;
      }
    >();

    allFavorites.forEach((fav) => {
      const facId = fav.facilityId || "unknown";
      if (!groups.has(facId)) {
        const facility = facilityMap.get(facId);
        groups.set(facId, {
          facilityId: facId,
          facilityName: facility?.name || "Unknown Facility",
          favorites: [],
        });
      }
      groups.get(facId)!.favorites.push(fav);
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.facilityName.localeCompare(b.facilityName)
    );
  }, [allFavorites, facilityMap]);

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
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!allFavorites || allFavorites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm text-muted-foreground">
            Facility managers can add staff to their favorites from the facility
            dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedFavorites.map((group) => (
        <div key={group.facilityId} className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{group.facilityName}</h3>
            <Badge variant="outline" className="text-xs">
              {group.favorites.length} favorite
              {group.favorites.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="space-y-2">
            {group.favorites.map((fav) => {
              const staff = fav.staffProfileId
                ? staffMap.get(fav.staffProfileId)
                : null;
              if (!staff) return null;

              const initials =
                (
                  (staff.firstName?.[0] || "") + (staff.lastName?.[0] || "")
                ).toUpperCase() || "S";
              const priorityConfig = getPriorityConfig(fav.priority);
              const isRemoving = removingId === fav.id;

              return (
                <Card key={fav.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={staff.profilePhotoUrl} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {staff.firstName} {staff.lastName}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
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
                          <Badge
                            className={`text-xs ${priorityConfig.className}`}
                          >
                            {priorityConfig.label}
                          </Badge>
                          <ReliabilityBadge totalShiftsCompleted={staff.totalRatings || 0} size="sm" />
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};