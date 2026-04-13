import { useEffect, useMemo } from "react";
import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { GetStaffActivityStatsAction } from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { StarRating } from "@/components/StarRating";
import {
  BarChart2,
  CheckCircle,
  Clock,
  Building2,
  Star,
  Rocket,
} from "lucide-react";
import {
  formatHoursWorked,
  getReliabilityColor,
  getReliabilityTextColor,
} from "@/utils/reliabilityUtils";

interface ALJOActivityStatsProps {
  staffProfileId: string;
}

export const ALJOActivityStats = ({
  staffProfileId,
}: ALJOActivityStatsProps) => {
  const { executeFunction, result, isLoading, isDone } = useExecuteAction(
    GetStaffActivityStatsAction
  );

  useEffect(() => {
    if (staffProfileId) {
      executeFunction({ staffProfileId });
    }
  }, [staffProfileId, executeFunction]);

  const stats = result;

  const reliabilityBarColor = useMemo(() => {
    if (!stats) return "bg-muted";
    return getReliabilityColor(stats.reliabilityScore);
  }, [stats]);

  const reliabilityTextColor = useMemo(() => {
    if (!stats) return "text-muted-foreground";
    return getReliabilityTextColor(stats.reliabilityScore);
  }, [stats]);

  const facilityDisplay = useMemo(() => {
    if (!stats?.uniqueFacilityNames) return [];
    return stats.uniqueFacilityNames.slice(0, 5);
  }, [stats]);

  const extraFacilities = useMemo(() => {
    if (!stats?.uniqueFacilityNames) return 0;
    return Math.max(0, stats.uniqueFacilityNames.length - 5);
  }, [stats]);

  if (isLoading || !isDone) {
    return (
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">ALJO Activity</h3>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalShiftsCompleted === 0) {
    return (
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">ALJO Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Rocket className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No shifts completed yet in ALJO</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Complete your first shift to start building your track record!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">ALJO Activity</h3>
        </div>

        {/* Reliability Badge - prominent */}
        <div className="mb-4">
          <ReliabilityBadge
            totalShiftsCompleted={stats.totalShiftsCompleted}
            size="lg"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-background rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">
                Shifts Completed
              </span>
            </div>
            <p className="text-xl font-bold">{stats.totalShiftsCompleted}</p>
          </div>

          <div className="bg-background rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-chart-1" />
              <span className="text-xs text-muted-foreground">
                Hours Worked
              </span>
            </div>
            <p className="text-xl font-bold">
              {formatHoursWorked(stats.totalHoursWorked)}
            </p>
          </div>

          <div className="bg-background rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-chart-4" />
              <span className="text-xs text-muted-foreground">Facilities</span>
            </div>
            <p className="text-xl font-bold">{stats.uniqueFacilitiesCount}</p>
          </div>

          <div className="bg-background rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-chart-3" />
              <span className="text-xs text-muted-foreground">Avg Rating</span>
            </div>
            {stats.averageRating > 0 ? (
              <StarRating
                rating={stats.averageRating}
                size="sm"
                showNumeric
              />
            ) : (
              <p className="text-sm text-muted-foreground">No ratings yet</p>
            )}
          </div>
        </div>

        {/* Reliability Score */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reliability Score</span>
            <span className={`text-lg font-bold ${reliabilityTextColor}`}>
              {stats.reliabilityScore.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${reliabilityBarColor}`}
              style={{ width: `${Math.min(stats.reliabilityScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Roles Performed */}
        {stats.rolesPerformed.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Roles Performed</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.rolesPerformed.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Facilities List */}
        {facilityDisplay.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1.5">Facilities Worked</p>
            <div className="space-y-0.5">
              {facilityDisplay.map((name) => (
                <p key={name} className="text-sm text-muted-foreground">
                  {name}
                </p>
              ))}
              {extraFacilities > 0 && (
                <p className="text-xs text-muted-foreground italic">
                  +{extraFacilities} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};