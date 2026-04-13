import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityCreate,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  StaffProfilesEntity,
  FacilityFavoritesEntity,
} from "@/product-types";
import { Search, Loader2, Star, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { StarRating } from "@/components/StarRating";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";

interface AddToFavoritesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  existingFavoriteStaffIds: Set<string>;
  onSuccess?: () => void;
}

export const AddToFavoritesSheet = ({
  open,
  onOpenChange,
  facilityId,
  existingFavoriteStaffIds,
  onSuccess,
}: AddToFavoritesSheetProps) => {
  const user = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [priority, setPriority] = useState<"preferred" | "regular">("regular");
  const [notes, setNotes] = useState("");

  const { data: allStaff, isLoading: loadingStaff } =
    useEntityGetAll(StaffProfilesEntity);
  const { createFunction: createFavorite, isLoading: creating } =
    useEntityCreate(FacilityFavoritesEntity);

  const filteredStaff = useMemo(() => {
    if (!allStaff) return [];
    return allStaff.filter((s) => {
      // Exclude already favorited
      if (existingFavoriteStaffIds.has(s.id!)) return false;
      // Only approved/compliant staff
      if (s.onboardingStatus !== "approved") return false;
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch =
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(query);
        const emailMatch = s.email?.toLowerCase().includes(query);
        return nameMatch || emailMatch;
      }
      return true;
    });
  }, [allStaff, existingFavoriteStaffIds, searchQuery]);

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId || !allStaff) return null;
    return allStaff.find((s) => s.id === selectedStaffId) || null;
  }, [selectedStaffId, allStaff]);

  const handleAddFavorite = useCallback(async () => {
    if (!selectedStaffId) return;

    try {
      await createFavorite({
        data: {
          facilityId,
          staffProfileId: selectedStaffId,
          addedByEmail: user.email,
          addedAt: new Date().toISOString(),
          priority,
          notes: notes.trim() || undefined,
        },
      });

      toast.success("Staff added to favorites!");
      setSelectedStaffId(null);
      setNotes("");
      setPriority("regular");
      setSearchQuery("");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to add favorite. Please try again.");
    }
  }, [
    selectedStaffId,
    facilityId,
    user.email,
    priority,
    notes,
    createFavorite,
    onOpenChange,
    onSuccess,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add to Favorites
          </SheetTitle>
          <SheetDescription>
            Search for a staff member to add to your favorites
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          {/* Staff list */}
          {selectedStaff ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedStaff.profilePhotoUrl} />
                  <AvatarFallback>
                    {(
                      (selectedStaff.firstName?.[0] || "") +
                      (selectedStaff.lastName?.[0] || "")
                    ).toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedStaff.roleType && (
                      <Badge
                        className={getRoleBadgeColor(selectedStaff.roleType)}
                      >
                        {selectedStaff.roleType}
                      </Badge>
                    )}
                    {(selectedStaff.averageRating || 0) > 0 && (
                      <StarRating
                        rating={selectedStaff.averageRating || 0}
                        size="sm"
                        showNumeric
                      />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStaffId(null)}
                >
                  Change
                </Button>
              </div>

              {/* Priority selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as "preferred" | "regular")
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preferred">
                      Preferred (Top Tier)
                    </SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Great with dementia patients..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full h-12"
                onClick={handleAddFavorite}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-5 w-5" />
                    Add to Favorites
                  </>
                )}
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[50vh]">
              {loadingStaff ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 w-full rounded-lg bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No matching staff found"
                      : "All staff are already in your favorites"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStaff.map((staff) => {
                    const initials =
                      (
                        (staff.firstName?.[0] || "") +
                        (staff.lastName?.[0] || "")
                      ).toUpperCase() || "S";

                    return (
                      <button
                        key={staff.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setSelectedStaffId(staff.id!)}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={staff.profilePhotoUrl} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {staff.firstName} {staff.lastName}
                          </p>
                          <div className="flex items-center gap-2">
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
                            <ReliabilityBadge totalShiftsCompleted={staff.totalRatings || 0} size="sm" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};