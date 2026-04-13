import { useEffect, useMemo } from "react";
import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { GetStaffActivityStatsAction, StaffMyProfilePage } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import {
  BarChart2,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  ArrowRight,
} from "lucide-react";
import { formatHoursWorked } from "@/utils/reliabilityUtils";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";

interface MyStatsCardProps {
  staffProfileId: string;
}

export const MyStatsCard = ({ staffProfileId }: MyStatsCardProps) => {
  const { executeFunction, result, isLoading, isDone } = useExecuteAction(
    GetStaffActivityStatsAction
  );

  useEffect(() => {
    if (staffProfileId) {
      executeFunction({ staffProfileId });
    }
  }, [staffProfileId, executeFunction]);

  const stats = result;

  if (isLoading || !isDone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            My Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || (stats.totalShiftsCompleted === 0 && stats.totalAcceptedShifts === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            My Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Complete shifts to start tracking your stats
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          My Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 rounded-lg p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">
                Total Shifts
              </span>
            </div>
            <p className="text-xl font-bold">{stats.totalShiftsCompleted}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-chart-1" />
              <span className="text-xs text-muted-foreground">
                Total Hours
              </span>
            </div>
            <p className="text-xl font-bold">
              {formatHoursWorked(stats.totalHoursWorked)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground">
                Reliability
              </span>
            </div>
            <p className="text-xl font-bold">
              {stats.reliabilityScore.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-chart-3" />
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
            <p className="text-xl font-bold">
              {stats.averageRating > 0
                ? `${stats.averageRating.toFixed(1)} ★`
                : "—"}
            </p>
          </div>
        </div>

        {/* ReliabilityBadge */}
        <div className="flex justify-center">
          <ReliabilityBadge
            totalShiftsCompleted={stats.totalShiftsCompleted}
            size="md"
          />
        </div>

        {/* Link to full stats */}
        <Link
          to={getPageUrl(StaffMyProfilePage)}
          className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
        >
          View Full Stats
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
};