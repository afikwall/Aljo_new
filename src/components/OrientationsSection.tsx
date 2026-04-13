import { useEntityGetAll, useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  FacilitiesEntity,
  OrientationsEntity,
  RequestOrientationAction,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, MapPin, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface OrientationsSectionProps {
  staffProfileId: string;
  staffEmail: string;
}

type OrientationStatus = "completed" | "scheduled" | "requested" | "denied" | "none";

export const OrientationsSection = ({ staffProfileId, staffEmail }: OrientationsSectionProps) => {
  const [requestingOrientations, setRequestingOrientations] = useState<Record<string, boolean>>({});

  // Fetch all facilities
  const { data: allFacilities, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);

  // Fetch all orientations for this staff member
  const { data: orientations, isLoading: loadingOrientations, refetch: refetchOrientations } = useEntityGetAll(
    OrientationsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  // Execute action hook
  const { executeFunction: requestOrientation } = useExecuteAction(RequestOrientationAction);

  // Filter to active facilities only
  const activeFacilities = useMemo(() => {
    return allFacilities?.filter((f) => f.status === "active") || [];
  }, [allFacilities]);

  // Determine orientation status for each facility
  const facilitiesWithStatus = useMemo(() => {
    return activeFacilities.map((facility) => {
      // Find all orientation records for this facility
      const facilityOrientations = orientations?.filter((o) => o.facilityId === facility.id) || [];

      // Determine status based on priority order
      let status: OrientationStatus = "none";

      if (facilityOrientations.some((o) => o.status === "completed")) {
        status = "completed";
      } else if (facilityOrientations.some((o) => o.status === "scheduled")) {
        status = "scheduled";
      } else if (facilityOrientations.some((o) => o.status === "requested")) {
        status = "requested";
      } else if (facilityOrientations.some((o) => o.status === "denied")) {
        status = "denied";
      }

      return {
        facility,
        status,
      };
    });
  }, [activeFacilities, orientations]);

  // Handle request orientation
  const handleRequestOrientation = async (facilityId: string, facilityName: string) => {
    setRequestingOrientations((prev) => ({ ...prev, [facilityId]: true }));

    try {
      const result = await requestOrientation({
        facilityId,
        staffProfileId,
        staffEmail,
      });

      if (result.alreadyRequested) {
        toast.error(result.message || "You have already requested orientation for this facility");
      } else {
        toast.success(`Orientation requested for ${facilityName}!`);
        refetchOrientations();
      }
    } catch (error) {
      toast.error("Failed to request orientation. Please try again.");
    } finally {
      setRequestingOrientations((prev) => ({ ...prev, [facilityId]: false }));
    }
  };

  // Get badge config for status
  const getStatusBadge = (status: OrientationStatus) => {
    switch (status) {
      case "completed":
        return {
          text: "Oriented ✓",
          className: "bg-accent/20 text-accent",
        };
      case "scheduled":
        return {
          text: "Scheduled",
          className: "bg-chart-1/20 text-chart-1",
        };
      case "requested":
        return {
          text: "Requested",
          className: "bg-chart-3/20 text-chart-3",
        };
      case "denied":
        return {
          text: "Denied",
          className: "bg-destructive/20 text-destructive",
        };
      default:
        return null;
    }
  };

  // Loading state
  if (loadingFacilities || loadingOrientations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Orientations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (activeFacilities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Orientations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-base">No facilities available for orientation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for available orientation opportunities
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Orientations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {facilitiesWithStatus.map(({ facility, status }) => {
          const badgeConfig = getStatusBadge(status);
          const showRequestButton = status === "none" || status === "denied";
          const isRequesting = requestingOrientations[facility.id] || false;

          return (
            <div key={facility.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{facility.name}</p>
                  {facility.city && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{facility.city}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {badgeConfig && (
                    <Badge className={`text-xs ${badgeConfig.className}`}>
                      {badgeConfig.text}
                    </Badge>
                  )}
                  {showRequestButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => handleRequestOrientation(facility.id || "", facility.name || "this facility")}
                      disabled={isRequesting || !facility.id}
                    >
                      {isRequesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
                          Requesting...
                        </>
                      ) : (
                        "Request Orientation"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};