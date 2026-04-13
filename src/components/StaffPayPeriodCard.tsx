import { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isWithinInterval } from "date-fns";
import {
  getCurrentPayPeriod,
  getPayPeriodLabel,
  type DateRange,
} from "@/utils/reportUtils";

interface StaffPayPeriodCardProps {
  /** Time logs for this staff member (all logs, will be filtered to current period) */
  timeLogs:
    | {
        clockOutTime?: string;
        totalHours?: number;
        staffProfileId?: string;
      }[]
    | undefined;
  /** The staff's roleType (e.g. "RN", "LPN", "CCA", "CITR") */
  staffRoleType: string | undefined;
  /** All staff rates — the component will match by roleType */
  staffRates:
    | {
        roleType?: string;
        staffRate?: number;
      }[]
    | undefined;
  /** The staff profile ID to filter time logs */
  staffProfileId: string | undefined;
  /** Whether data is still loading */
  isLoading: boolean;
}

export const StaffPayPeriodCard = ({
  timeLogs,
  staffRoleType,
  staffRates,
  staffProfileId,
  isLoading,
}: StaffPayPeriodCardProps) => {
  const currentPeriod = useMemo(() => getCurrentPayPeriod(), []);
  const periodLabel = useMemo(() => getPayPeriodLabel(currentPeriod), [currentPeriod]);

  // Sum hours from time logs that fall within the current pay period
  const hoursWorked = useMemo(() => {
    if (!timeLogs || !staffProfileId) return 0;

    return timeLogs.reduce((sum, log) => {
      if (log.staffProfileId !== staffProfileId) return sum;
      if (!log.clockOutTime) return sum;
      try {
        const clockOut = parseISO(log.clockOutTime);
        if (isWithinInterval(clockOut, { start: currentPeriod.start, end: currentPeriod.end })) {
          return sum + (log.totalHours || 0);
        }
      } catch {
        // Skip invalid dates
      }
      return sum;
    }, 0);
  }, [timeLogs, staffProfileId, currentPeriod]);

  // Find staff rate by matching roleType
  const staffRate = useMemo(() => {
    if (!staffRates || !staffRoleType) return null;
    const match = staffRates.find(
      (r) => r.roleType === staffRoleType
    );
    return match?.staffRate ?? null;
  }, [staffRates, staffRoleType]);

  const estimatedPay = useMemo(() => {
    if (staffRate === null) return null;
    return hoursWorked * staffRate;
  }, [hoursWorked, staffRate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-48 mb-3" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pay Period
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{periodLabel}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Hours</p>
            <p className="text-xl font-bold">{hoursWorked.toFixed(1)} hrs worked</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated Pay</p>
            <p className="text-xl font-bold">
              {estimatedPay !== null
                ? `Est. $${estimatedPay.toFixed(2)}`
                : "—"}
            </p>
            {estimatedPay !== null && (
              <p className="text-xs text-muted-foreground italic mt-1">
                Gross pay only. Tax deductions are the responsibility of the individual contractor.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};