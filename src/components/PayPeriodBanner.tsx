import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentPayPeriod,
  getPayPeriodLabel,
  getPayPeriodNumber,
  getPayPeriodDaysRemaining,
} from "@/utils/reportUtils";
import { useMemo } from "react";

/**
 * Prominent banner card displaying the current bi-weekly pay period.
 * Shows date range, period number, and days remaining.
 */
export const PayPeriodBanner = () => {
  const payPeriod = useMemo(() => getCurrentPayPeriod(), []);
  const periodLabel = useMemo(() => getPayPeriodLabel(payPeriod), [payPeriod]);
  const periodNumber = useMemo(() => getPayPeriodNumber(payPeriod), [payPeriod]);
  const daysRemaining = useMemo(() => getPayPeriodDaysRemaining(payPeriod), [payPeriod]);

  const daysRemainingText = useMemo(() => {
    if (daysRemaining === 0) return "Last day!";
    return `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`;
  }, [daysRemaining]);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Current Pay Period
            </p>
            <Badge className="bg-primary/15 text-primary border-primary/20">
              Pay Period #{periodNumber}
            </Badge>
          </div>
          <p className="text-xl font-bold text-primary mt-1">{periodLabel}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{daysRemainingText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};