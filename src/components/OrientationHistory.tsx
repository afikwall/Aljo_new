import { useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { OrientationsEntity, FacilitiesEntity } from "@/product-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, CheckCircle, Clock, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface OrientationHistoryProps {
  staffId: string;
}

export function OrientationHistory({ staffId }: OrientationHistoryProps) {
  const { data: orientations, isLoading: loadingOrientations } =
    useEntityGetAll(
      OrientationsEntity,
      { staffProfileId: staffId },
      { enabled: !!staffId }
    );

  const { data: facilities, isLoading: loadingFacilities } =
    useEntityGetAll(FacilitiesEntity);

  const facilityMap = useMemo(() => {
    const map = new Map<
      string,
      typeof FacilitiesEntity["instanceType"]
    >();
    if (facilities) {
      for (const facility of facilities) {
        map.set(facility.id, facility);
      }
    }
    return map;
  }, [facilities]);

  const sortedOrientations = useMemo(() => {
    if (!orientations) return [];
    return [...orientations].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [orientations]);

  const isLoading = loadingOrientations || loadingFacilities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-chart-3" />
          Orientation History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : sortedOrientations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <GraduationCap className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No orientation records found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Orientations are recorded by facility managers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrientations.map((orientation) => {
              const facility = orientation.facilityId
                ? facilityMap.get(orientation.facilityId)
                : undefined;
              const facilityName = facility?.name || "Unknown Facility";

              return (
                <div
                  key={orientation.id}
                  className="rounded-lg border p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {facilityName}
                    </p>
                    <OrientationStatusBadge status={orientation.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {orientation.completedAt
                        ? format(parseISO(orientation.completedAt), "MMM d, yyyy")
                        : "Not completed"}
                    </span>
                    {orientation.orientedBy && (
                      <span>Conducted by: {orientation.orientedBy}</span>
                    )}
                  </div>
                  {orientation.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {orientation.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrientationStatusBadge({
  status,
}: {
  status?: "scheduled" | "completed" | "expired";
}) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-accent/20 text-accent gap-1 border-transparent shrink-0">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "scheduled":
      return (
        <Badge className="bg-chart-1/20 text-chart-1 gap-1 border-transparent shrink-0">
          <Clock className="h-3 w-3" />
          Scheduled
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-destructive/20 text-destructive gap-1 border-transparent shrink-0">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}