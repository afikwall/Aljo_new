import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Banknote,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
} from "lucide-react";
import {
  EarlyPayRequestsEntity,
  StaffProfilesEntity,
} from "@/product-types";
import type { IEarlyPayRequestsEntity, IStaffProfilesEntity } from "@/product-types";
import { EarlyPayPendingCard } from "@/components/EarlyPayPendingCard";
import {
  getEarlyPayStatusBadge,
  formatCAD,
  formatRequestDate,
  formatPeriodLabel,
} from "@/utils/earlyPayUtils";
import { getStaffName } from "@/utils/reportUtils";

export const AdminEarlyPaySection = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(false);

  const {
    data: requestsRaw,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useEntityGetAll(EarlyPayRequestsEntity);

  const {
    data: staffRaw,
    isLoading: staffLoading,
  } = useEntityGetAll(StaffProfilesEntity);

  const requests = useMemo(
    () =>
      ((requestsRaw || []) as (IEarlyPayRequestsEntity & { id: string })[]),
    [requestsRaw]
  );

  const staffProfiles = useMemo(
    () =>
      ((staffRaw || []) as (IStaffProfilesEntity & { id: string })[]),
    [staffRaw]
  );

  const staffMap = useMemo(() => {
    const map = new Map<string, IStaffProfilesEntity & { id: string }>();
    for (const s of staffProfiles) {
      if (s.id) map.set(s.id, s);
    }
    return map;
  }, [staffProfiles]);

  // Pending requests (sorted oldest first)
  const pendingRequests = useMemo(
    () =>
      requests
        .filter((r) => r.status === "pending")
        .sort((a, b) => {
          const dateA = a.requestedAt || "";
          const dateB = b.requestedAt || "";
          return dateA.localeCompare(dateB);
        }),
    [requests]
  );

  // Recent decisions (non-pending, sorted by reviewedAt descending, last 30 days)
  const recentDecisions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    return requests
      .filter((r) => {
        if (r.status === "pending") return false;
        const reviewDate = r.reviewedAt || r.requestedAt || "";
        return reviewDate >= thirtyDaysAgoStr;
      })
      .sort((a, b) => {
        const dateA = a.reviewedAt || a.requestedAt || "";
        const dateB = b.reviewedAt || b.requestedAt || "";
        return dateB.localeCompare(dateA);
      });
  }, [requests]);

  const handleActionComplete = useCallback(() => {
    refetchRequests();
  }, [refetchRequests]);

  const isLoading = requestsLoading || staffLoading;

  const getStaffNameForRequest = useCallback(
    (request: IEarlyPayRequestsEntity) => {
      if (!request.staffProfileId) return "Unknown";
      const staff = staffMap.get(request.staffProfileId);
      return getStaffName(staff);
    },
    [staffMap]
  );

  const getStaffRole = useCallback(
    (request: IEarlyPayRequestsEntity) => {
      if (!request.staffProfileId) return undefined;
      const staff = staffMap.get(request.staffProfileId);
      return staff?.roleType;
    },
    [staffMap]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-5 w-5 text-primary" />
              Early Pay Requests
              {pendingRequests.length > 0 && (
                <Badge className="bg-chart-3/20 text-chart-3 ml-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </CardTitle>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Info note about early pay deduction */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Approved early pay advances are automatically deducted from gross pay during payroll generation.
              </p>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            )}

            {/* Pending Requests Section */}
            {!isLoading && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Pending Requests</h4>
                {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
                    <Banknote className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No pending early pay requests
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <EarlyPayPendingCard
                        key={request.id}
                        request={request}
                        staffName={getStaffNameForRequest(request)}
                        roleType={getStaffRole(request)}
                        onActionComplete={handleActionComplete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Decisions Section */}
            {!isLoading && recentDecisions.length > 0 && (
              <>
                <Separator />
                <Collapsible open={recentOpen} onOpenChange={setRecentOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h4 className="text-sm font-semibold">
                      Recent Decisions ({recentDecisions.length})
                    </h4>
                    {recentOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pt-3">
                      {recentDecisions.map((request) => {
                        const statusBadge = getEarlyPayStatusBadge(
                          request.status
                        );
                        return (
                          <RecentDecisionRow
                            key={request.id}
                            staffName={getStaffNameForRequest(request)}
                            amountRequested={request.amountRequested || 0}
                            amountApproved={request.amountApproved}
                            status={request.status}
                            statusBadge={statusBadge}
                            reviewedAt={request.reviewedAt}
                            denialReason={request.denialReason}
                          />
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const RecentDecisionRow = ({
  staffName,
  amountRequested,
  amountApproved,
  status,
  statusBadge,
  reviewedAt,
  denialReason,
}: {
  staffName: string;
  amountRequested: number;
  amountApproved?: number;
  status?: string;
  statusBadge: { className: string; label: string };
  reviewedAt?: string;
  denialReason?: string;
}) => (
  <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
    <div className="flex-1 min-w-0 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-sm">{staffName}</span>
        <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {status === "approved" || status === "paid"
          ? `Approved: ${formatCAD(amountApproved ?? amountRequested)}`
          : `Requested: ${formatCAD(amountRequested)}`}
      </p>
      {status === "denied" && denialReason && (
        <p className="text-xs text-destructive">Reason: {denialReason}</p>
      )}
    </div>
    <div className="text-right shrink-0">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatRequestDate(reviewedAt)}
      </div>
    </div>
  </div>
);