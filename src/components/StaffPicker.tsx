import { useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffProfilesEntity, ShiftApplicationsEntity, ShiftsEntity, OrientationsEntity } from "@/product-types";
import type { IStaffProfilesEntity } from "@/product-types";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserX } from "lucide-react";
import { isRoleEligible } from "@/utils/eligibilityUtils";

interface StaffPickerProps {
  requiredRole: string;
  value: string;
  onChange: (staffId: string) => void;
  facilityProfileId?: string;
}

const getRoleBadgeColor = (role?: string) => {
  if (role === "RN") return "bg-chart-1/20 text-chart-1";
  if (role === "LPN") return "bg-chart-2/20 text-chart-2";
  if (role === "CCA") return "bg-chart-3/20 text-chart-3";
  if (role === "CITR") return "bg-chart-4/20 text-chart-4";
  return "bg-muted text-muted-foreground";
};

export const StaffPicker = ({ requiredRole, value, onChange, facilityProfileId }: StaffPickerProps) => {
  const filterByFacility = !!facilityProfileId;

  // Fetch all approved + compliant staff profiles
  const { data: allStaff, isLoading: isLoadingStaff } = useEntityGetAll(StaffProfilesEntity, {
    onboardingStatus: "approved",
    complianceStatus: "compliant",
  });

  // Fetch all shifts at this facility to build a set of shift IDs
  const { data: facilityShifts, isLoading: isLoadingShifts } = useEntityGetAll(
    ShiftsEntity,
    { facilityProfileId },
    { enabled: filterByFacility }
  );

  // Fetch all shift applications (needed to cross-reference with facility shifts)
  const { data: allApplications, isLoading: isLoadingApplications } = useEntityGetAll(
    ShiftApplicationsEntity,
    {},
    { enabled: filterByFacility }
  );

  // Fetch orientations for this facility
  const { data: facilityOrientations, isLoading: isLoadingOrientations } = useEntityGetAll(
    OrientationsEntity,
    { facilityId: facilityProfileId },
    { enabled: filterByFacility }
  );

  const isLoading =
    isLoadingStaff ||
    (filterByFacility && (isLoadingShifts || isLoadingApplications || isLoadingOrientations));

  // Build a set of familiar staff profile IDs
  const familiarStaffIds = useMemo(() => {
    if (!filterByFacility) return null;

    const familiarIds = new Set<string>();

    // Build set of shift IDs at this facility
    const facilityShiftIds = new Set<string>(
      (facilityShifts || []).map((s: { id?: string }) => s.id).filter(Boolean) as string[]
    );

    // Check approved applications for shifts at this facility
    (allApplications || []).forEach((app) => {
      if (
        app.status === "approved" &&
        app.staffProfileId &&
        app.shiftProfileId &&
        facilityShiftIds.has(app.shiftProfileId)
      ) {
        familiarIds.add(app.staffProfileId);
      }
    });

    // Check orientations at this facility (any status counts)
    (facilityOrientations || []).forEach((orientation) => {
      if (orientation.staffProfileId) {
        familiarIds.add(orientation.staffProfileId);
      }
    });

    // Check orientedFacilityIds on staff profiles
    (allStaff || []).forEach((staff: IStaffProfilesEntity & { id?: string }) => {
      if (
        staff.id &&
        staff.orientedFacilityIds?.includes(facilityProfileId!)
      ) {
        familiarIds.add(staff.id);
      }
    });

    return familiarIds;
  }, [filterByFacility, facilityShifts, allApplications, facilityOrientations, allStaff, facilityProfileId]);

  // Filter by role eligibility and facility familiarity
  const eligibleStaff = useMemo(() => {
    if (!allStaff) return [];
    return allStaff
      .filter((staff: IStaffProfilesEntity & { id?: string }) => {
        if (!staff.id) return false;
        // If no role selected yet, show all compliant+approved staff
        if (!requiredRole) {
          if (filterByFacility && familiarStaffIds !== null) {
            return familiarStaffIds.has(staff.id);
          }
          return true;
        }
        if (!isRoleEligible(staff.roleType, requiredRole)) return false;
        // Apply facility familiarity filter
        if (filterByFacility && familiarStaffIds !== null) {
          return familiarStaffIds.has(staff.id);
        }
        return true;
      })
      .sort((a, b) => {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [allStaff, requiredRole, filterByFacility, familiarStaffIds]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Label>Select Staff Member *</Label>
        {filterByFacility && (
          <p className="text-xs text-muted-foreground">
            Only showing staff who have previously worked at or completed orientation at your facility
          </p>
        )}
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Select Staff Member *</Label>
      {filterByFacility && (
        <p className="text-xs text-muted-foreground">
          Only showing staff who have previously worked at or completed orientation at your facility
        </p>
      )}
      {eligibleStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6">
          <UserX className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {filterByFacility
              ? "No familiar staff found for this role. Staff who have worked here or completed orientation will appear here."
              : `No eligible staff found${requiredRole ? ` for ${requiredRole} shifts` : ""}`}
          </p>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-11 text-base">
            <SelectValue placeholder="Choose a staff member..." />
          </SelectTrigger>
          <SelectContent>
            {eligibleStaff.map((staff: IStaffProfilesEntity & { id?: string }) => (
              <SelectItem key={staff.id} value={staff.id!}>
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {staff.firstName || ""} {staff.lastName || ""}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <Badge className={`${getRoleBadgeColor(staff.roleType)} text-xs px-1.5 py-0`}>
                    {staff.roleType || "—"}
                  </Badge>
                  <span className="text-muted-foreground">·</span>
                  <Badge className="bg-accent/20 text-accent text-xs px-1.5 py-0">
                    Compliant
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};