import { useState, useCallback, useMemo } from "react";
import {
  useEntityGetAll,
  useEntityDelete,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  FacilityManagerProfilesEntity,
  UsersEntity,
  FacilitiesEntity,
} from "@/product-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { FMListRow } from "@/components/FMListRow";
import { AddFacilityManagerDialog } from "@/components/AddFacilityManagerDialog";
import { RemoveFMDialog } from "@/components/RemoveFMDialog";

interface ManageLoginsSectionProps {
  facilityId: string;
  facilityName: string;
  allFMProfiles: Array<
    typeof FacilityManagerProfilesEntity["instanceType"] & { id: string }
  >;
  isLoadingFM: boolean;
  refetchFMProfiles: () => void;
}

export const ManageLoginsSection = ({
  facilityId,
  facilityName,
  allFMProfiles,
  isLoadingFM,
  refetchFMProfiles,
}: ManageLoginsSectionProps) => {
  const { data: users } = useEntityGetAll(UsersEntity);
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);
  const { deleteFunction: deleteFMProfile, isLoading: isDeletingFM } =
    useEntityDelete(FacilityManagerProfilesEntity);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogState, setRemoveDialogState] = useState<{
    open: boolean;
    profileId: string;
    email: string;
  }>({ open: false, profileId: "", email: "" });

  const facilityFMs = useMemo(() => {
    return allFMProfiles.filter((p) => p.facilityProfileId === facilityId);
  }, [allFMProfiles, facilityId]);

  const usersByEmail = useMemo(() => {
    const map = new Map<
      string,
      { name?: string; firstName?: string; lastName?: string }
    >();
    users?.forEach((u) => {
      if (u.email) {
        map.set(u.email.toLowerCase(), {
          name: u.name,
          firstName: u.firstName,
          lastName: u.lastName,
        });
      }
    });
    return map;
  }, [users]);

  const facilityNamesById = useMemo(() => {
    const map = new Map<string, string>();
    facilities?.forEach((f) => {
      if (f.id && f.name) {
        map.set(f.id, f.name);
      }
    });
    return map;
  }, [facilities]);

  const getLinkedFacilities = useCallback(
    (email?: string): string[] => {
      if (!email) return [];
      return allFMProfiles
        .filter(
          (p) =>
            p.email?.toLowerCase() === email.toLowerCase() &&
            p.facilityProfileId !== facilityId
        )
        .map((p) =>
          p.facilityProfileId
            ? facilityNamesById.get(p.facilityProfileId) || "Unknown Facility"
            : "Unknown Facility"
        );
    },
    [allFMProfiles, facilityId, facilityNamesById]
  );

  const getDisplayName = useCallback(
    (fmProfile: typeof FacilityManagerProfilesEntity["instanceType"]) => {
      const email = fmProfile.email?.toLowerCase();
      if (!email) return undefined;
      const user = usersByEmail.get(email);
      if (user?.name) return user.name;
      if (user?.firstName || user?.lastName) {
        return [user.firstName, user.lastName].filter(Boolean).join(" ");
      }
      return fmProfile.title || undefined;
    },
    [usersByEmail]
  );

  const handleRemoveFM = useCallback(async () => {
    try {
      await deleteFMProfile({ id: removeDialogState.profileId });
      toast.success(`Removed ${removeDialogState.email} from ${facilityName}`);
      setRemoveDialogState({ open: false, profileId: "", email: "" });
      refetchFMProfiles();
    } catch {
      toast.error("Failed to remove facility manager");
    }
  }, [
    deleteFMProfile,
    removeDialogState.profileId,
    removeDialogState.email,
    facilityName,
    refetchFMProfiles,
  ]);

  const handleAddSuccess = useCallback(() => {
    refetchFMProfiles();
  }, [refetchFMProfiles]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Manage Logins</CardTitle>
                <CardDescription>
                  Facility manager accounts for {facilityName}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <UserPlus className="h-4 w-4" />
              Add Facility Manager
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFM ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : facilityFMs.length === 0 ? (
            <div className="border border-dashed rounded-lg min-h-[120px] flex flex-col items-center justify-center text-center p-6">
              <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No facility managers yet. Add one to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {facilityFMs.map((fm, index) => (
                <FMListRow
                  key={fm.id || index}
                  email={fm.email}
                  name={getDisplayName(fm)}
                  phone={fm.phone}
                  linkedFacilities={getLinkedFacilities(fm.email)}
                  onRemove={() =>
                    setRemoveDialogState({
                      open: true,
                      profileId: fm.id,
                      email: fm.email || "",
                    })
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddFacilityManagerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        facilityId={facilityId}
        facilityName={facilityName}
        onSuccess={handleAddSuccess}
      />

      <RemoveFMDialog
        open={removeDialogState.open}
        onOpenChange={(open) =>
          setRemoveDialogState((prev) => ({ ...prev, open }))
        }
        email={removeDialogState.email}
        facilityName={facilityName}
        isRemoving={isDeletingFM}
        onConfirm={handleRemoveFM}
      />
    </>
  );
};