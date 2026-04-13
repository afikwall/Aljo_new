import { useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { BonusesEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";

interface BonusHistoryCardProps {
  staffProfileId: string;
}

export const BonusHistoryCard = ({ staffProfileId }: BonusHistoryCardProps) => {
  const { data: bonuses, isLoading } = useEntityGetAll(
    BonusesEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const sortedBonuses = useMemo(() => {
    if (!bonuses) return [];
    return [...bonuses].sort((a, b) => {
      const dateA = a.awardedAt ? new Date(a.awardedAt).getTime() : 0;
      const dateB = b.awardedAt ? new Date(b.awardedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [bonuses]);

  const totalPending = useMemo(() => {
    if (!bonuses) return 0;
    return bonuses
      .filter((b) => b.status === "pending")
      .reduce((sum, b) => sum + (b.amount || 0), 0);
  }, [bonuses]);

  const formatPayPeriod = (start?: string, end?: string) => {
    if (!start || !end) return "—";
    try {
      return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d")}`;
    } catch {
      return "—";
    }
  };

  const formatAwardedAt = (awardedAt?: string) => {
    if (!awardedAt) return "—";
    try {
      return formatDistanceToNow(parseISO(awardedAt), { addSuffix: true });
    } catch {
      return "—";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-5 w-5 text-chart-4" />
            Bonus History
          </CardTitle>
          {totalPending > 0 && (
            <span className="inline-flex items-center rounded-full bg-chart-3/15 text-chart-3 text-xs font-semibold px-2.5 py-1">
              Pending: ${totalPending.toFixed(2)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : sortedBonuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[120px] border border-dashed rounded-lg">
            <Gift className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No bonuses awarded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBonuses.map((bonus) => (
              <div
                key={bonus.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2.5"
              >
                {/* Amount */}
                <span className="text-sm font-semibold text-accent shrink-0">
                  ${(bonus.amount || 0).toFixed(2)}
                </span>

                {/* Reason + Period */}
                <div className="flex-1 min-w-0">
                  {bonus.reason ? (
                    <p className="text-sm text-muted-foreground truncate">{bonus.reason}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No reason provided</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Period: {formatPayPeriod(bonus.payPeriodStart, bonus.payPeriodEnd)}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {bonus.status === "pending" ? (
                    <Badge className="bg-chart-3/20 text-chart-3 border-transparent text-xs">
                      Pending
                    </Badge>
                  ) : (
                    <Badge className="bg-accent/20 text-accent border-transparent text-xs">
                      Paid
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatAwardedAt(bonus.awardedAt)}
                  </span>
                </div>
              </div>
            ))}

            {/* Summary footer */}
            {totalPending > 0 && (
              <p className="text-xs text-muted-foreground pt-1 text-right">
                Total pending: <span className="font-medium text-foreground">${totalPending.toFixed(2)}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};