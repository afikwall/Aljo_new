import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Banknote, Info, AlertTriangle } from "lucide-react";
import {
  useExecuteAction,
  useEntityGetAll,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  GetEarlyPaySummaryAction,
  EarlyPayRequestsEntity,
} from "@/product-types";
import type { IGetEarlyPaySummaryActionOutput } from "@/product-types";
import { formatCAD } from "@/utils/earlyPayUtils";
import { RequestEarlyPaySheet } from "@/components/RequestEarlyPaySheet";
import { EarlyPayRequestHistory } from "@/components/EarlyPayRequestHistory";

interface EarlyPayCardProps {
  staffProfileId: string;
}

export const EarlyPayCard = ({ staffProfileId }: EarlyPayCardProps) => {
  const [summary, setSummary] = useState<IGetEarlyPaySummaryActionOutput | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const {
    executeFunction,
    isLoading: isSummaryLoading,
  } = useExecuteAction(GetEarlyPaySummaryAction);

  const { data: requestsRaw, isLoading: requestsLoading, refetch: refetchRequests } =
    useEntityGetAll(EarlyPayRequestsEntity, { staffProfileId });

  const requests = useMemo(
    () =>
      ((requestsRaw || []) as (typeof EarlyPayRequestsEntity.instanceType & {
        id: string;
      })[]),
    [requestsRaw]
  );

  // Fetch summary on mount and when fetchKey changes
  useEffect(() => {
    if (!staffProfileId) return;
    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const result = await executeFunction({ staffProfileId });
        if (!cancelled && result) {
          setSummary(result as IGetEarlyPaySummaryActionOutput);
        }
      } catch {
        // Silently handle error - summary will be null
      }
    };

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [staffProfileId, fetchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRequestSuccess = useCallback(() => {
    setFetchKey((k) => k + 1);
    refetchRequests();
  }, [refetchRequests]);

  const handleOpenSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const isLoading = isSummaryLoading && !summary;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  const canRequest =
    summary &&
    !summary.hasPendingRequest &&
    summary.availableForEarlyPay > 0;

  return (
    <div className="space-y-4">
      {/* Early Pay Advance Card */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-5 w-5 text-accent" />
              Early Pay Advance
            </CardTitle>
            <Button
              size="sm"
              className="h-11 shrink-0"
              disabled={!canRequest}
              onClick={handleOpenSheet}
            >
              Request Early Pay
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Pay Period */}
          {summary && (
            <>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Current Pay Period: {summary.periodLabel}
              </p>

              {/* Stat Rows */}
              <div className="space-y-2">
                <StatRow
                  label="Earned this period"
                  value={formatCAD(summary.earnedThisPeriod)}
                />
                <StatRow
                  label="Already withdrawn"
                  value={formatCAD(summary.alreadyWithdrawn)}
                />
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">
                      Available for early pay
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Up to 80% of earned wages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-bold text-accent">
                    {formatCAD(summary.availableForEarlyPay)}
                  </span>
                </div>
              </div>

              {/* Pending request banner */}
              {summary.hasPendingRequest && (
                <div className="flex items-center gap-2 rounded-lg bg-chart-3/10 border border-chart-3/20 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-chart-3 shrink-0" />
                  <p className="text-sm text-chart-3">
                    You have a pending early pay request for this period
                  </p>
                </div>
              )}

              {/* No earnings available */}
              {summary.availableForEarlyPay <= 0 &&
                !summary.hasPendingRequest && (
                  <p className="text-sm text-muted-foreground text-center py-1">
                    No earnings available for early pay yet
                  </p>
                )}
            </>
          )}

          {!summary && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Unable to load early pay summary
            </p>
          )}
        </CardContent>
      </Card>

      {/* Request History */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          Request History
        </h4>
        {requestsLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <EarlyPayRequestHistory requests={requests} />
        )}
      </div>

      {/* Request Early Pay Sheet */}
      {summary && (
        <RequestEarlyPaySheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          staffProfileId={staffProfileId}
          availableForEarlyPay={summary.availableForEarlyPay}
          periodStart={summary.periodStart}
          periodEnd={summary.periodEnd}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);