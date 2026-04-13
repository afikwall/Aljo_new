import { useMemo } from "react";
import { Clock, CheckCircle, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type TimesheetWithRelations,
  calculateSummary,
  formatCAD,
} from "@/utils/timesheetUtils";
import type { DateRange } from "@/utils/reportUtils";

interface PayrollSummaryCardsProps {
  timesheets: TimesheetWithRelations[];
  dateRange: DateRange;
  isLoading: boolean;
}

export const PayrollSummaryCards = ({
  timesheets,
  dateRange,
  isLoading,
}: PayrollSummaryCardsProps) => {
  const pendingSummary = useMemo(
    () => calculateSummary(timesheets, "pending"),
    [timesheets]
  );

  const approvedSummary = useMemo(
    () => calculateSummary(timesheets, "approved"),
    [timesheets]
  );

  const paidSummary = useMemo(
    () => calculateSummary(timesheets, "paid", dateRange),
    [timesheets, dateRange]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Pending Review */}
      <Card className="p-4 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <div className="h-9 w-9 rounded-full bg-chart-3/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-chart-3" />
          </div>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Total Pending Review
        </p>
        <p className="text-3xl font-bold mt-1 text-chart-3">
          {pendingSummary.count}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatCAD(pendingSummary.total)}
        </p>
      </Card>

      {/* Approved (Awaiting Payment) */}
      <Card className="p-4 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <div className="h-9 w-9 rounded-full bg-chart-1/10 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-chart-1" />
          </div>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Approved (Awaiting Payment)
        </p>
        <p className="text-3xl font-bold mt-1 text-chart-1">
          {approvedSummary.count}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatCAD(approvedSummary.total)}
        </p>
      </Card>

      {/* Paid This Period */}
      <Card className="p-4 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Paid This Period
        </p>
        <p className="text-3xl font-bold mt-1 text-accent">
          {paidSummary.count}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatCAD(paidSummary.total)}
        </p>
      </Card>
    </div>
  );
};