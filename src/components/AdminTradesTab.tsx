import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ShiftTradesEntity,
  ShiftsEntity,
  FacilitiesEntity,
  StaffProfilesEntity,
  ProcessShiftTradeAction,
} from "@/product-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, ChevronDown, ChevronUp } from "lucide-react";
import { subDays, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";
import { TradeReviewCard } from "@/components/TradeReviewCard";

export const AdminTradesTab = () => {
  const user = useUser();
  const [showRecent, setShowRecent] = useState(false);
  const [processingTradeId, setProcessingTradeId] = useState<string | null>(null);

  const {
    data: allTrades,
    isLoading: loadingTrades,
    refetch: refetchTrades,
  } = useEntityGetAll(ShiftTradesEntity);
  const { data: allShifts, isLoading: loadingShifts } = useEntityGetAll(ShiftsEntity);
  const { data: allFacilities } = useEntityGetAll(FacilitiesEntity);
  const { data: allStaffProfiles } = useEntityGetAll(StaffProfilesEntity);

  const { executeFunction: processShiftTrade } = useExecuteAction(ProcessShiftTradeAction);

  const isLoading = loadingTrades || loadingShifts;

  // Build lookup maps
  const shiftMap = useMemo(() => {
    const map = new Map<string, typeof ShiftsEntity.instanceType & { id: string }>();
    allShifts?.forEach((s) => {
      if (s.id) map.set(s.id, s as typeof ShiftsEntity.instanceType & { id: string });
    });
    return map;
  }, [allShifts]);

  const facilityMap = useMemo(() => {
    const map = new Map<string, typeof FacilitiesEntity.instanceType & { id: string }>();
    allFacilities?.forEach((f) => {
      if (f.id) map.set(f.id, f as typeof FacilitiesEntity.instanceType & { id: string });
    });
    return map;
  }, [allFacilities]);

  const staffByEmail = useMemo(() => {
    const map = new Map<string, typeof StaffProfilesEntity.instanceType & { id: string }>();
    allStaffProfiles?.forEach((s) => {
      if (s.email) map.set(s.email, s as typeof StaffProfilesEntity.instanceType & { id: string });
    });
    return map;
  }, [allStaffProfiles]);

  // Pending trades
  const pendingTrades = useMemo(() => {
    if (!allTrades) return [];
    return allTrades
      .filter((t) => t.status === "pending")
      .sort((a, b) => {
        const aTime = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const bTime = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [allTrades]);

  // Recent decisions (last 30 days)
  const recentDecisions = useMemo(() => {
    if (!allTrades) return [];
    const thirtyDaysAgo = subDays(new Date(), 30);
    return allTrades
      .filter((t) => {
        if (t.status !== "admin_approved" && t.status !== "rejected") return false;
        if (!t.approvedAt) return false;
        try {
          return isAfter(parseISO(t.approvedAt), thirtyDaysAgo);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aTime = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
        const bTime = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [allTrades]);

  const getShift = useCallback(
    (shiftId?: string) => {
      if (!shiftId) return null;
      return shiftMap.get(shiftId) || null;
    },
    [shiftMap]
  );

  const getFacility = useCallback(
    (facilityId?: string) => {
      if (!facilityId) return null;
      return facilityMap.get(facilityId) || null;
    },
    [facilityMap]
  );

  const getStaffByEmail = useCallback(
    (email?: string) => {
      if (!email) return null;
      return staffByEmail.get(email) || null;
    },
    [staffByEmail]
  );

  const handleApprove = useCallback(
    async (tradeId: string) => {
      setProcessingTradeId(tradeId);
      try {
        const result = await processShiftTrade({
          tradeId,
          action: "approve",
          approvedByEmail: user.email || "",
        });
        if (result.success) {
          toast.success("Trade approved! Shifts have been reassigned.");
        } else {
          toast.error(result.message || "Failed to approve trade.");
        }
        await refetchTrades();
      } catch {
        toast.error("Failed to approve trade. Please try again.");
      } finally {
        setProcessingTradeId(null);
      }
    },
    [processShiftTrade, user.email, refetchTrades]
  );

  const handleReject = useCallback(
    async (tradeId: string, reason: string) => {
      setProcessingTradeId(tradeId);
      try {
        const result = await processShiftTrade({
          tradeId,
          action: "reject",
          approvedByEmail: user.email || "",
          rejectionReason: reason || undefined,
        });
        if (result.success) {
          toast.success("Trade rejected.");
        } else {
          toast.error(result.message || "Failed to reject trade.");
        }
        await refetchTrades();
      } catch {
        toast.error("Failed to reject trade. Please try again.");
      } finally {
        setProcessingTradeId(null);
      }
    },
    [processShiftTrade, user.email, refetchTrades]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Pending Approval
          {pendingTrades.length > 0 && (
            <span className="bg-chart-3 text-white text-xs px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
              {pendingTrades.length}
            </span>
          )}
        </h3>

        {pendingTrades.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <ArrowLeftRight className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-base">No pending trade requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              Trade requests needing approval will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTrades.map((trade) => {
              const tradeId = (trade as { id: string }).id;
              const originalShift = getShift(trade.originalShiftId);
              const originalFacility = getFacility(originalShift?.facilityProfileId);
              const offeredShift = getShift(trade.offeredShiftId);
              const offeredFacility = getFacility(offeredShift?.facilityProfileId);
              const requesterProfile = getStaffByEmail(trade.originalStaffEmail);
              const acceptorProfile = getStaffByEmail(trade.acceptedByEmail);

              return (
                <TradeReviewCard
                  key={tradeId}
                  trade={trade as ITradeWithId}
                  originalShift={originalShift}
                  originalFacility={originalFacility}
                  offeredShift={offeredShift}
                  offeredFacility={offeredFacility}
                  requesterProfile={requesterProfile}
                  acceptorProfile={acceptorProfile}
                  isPending={true}
                  isProcessing={processingTradeId === tradeId}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Decisions section */}
      {recentDecisions.length > 0 && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground p-0 h-auto"
            onClick={() => setShowRecent(!showRecent)}
          >
            {showRecent ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Show Recent ({recentDecisions.length})
          </Button>

          {showRecent && (
            <div className="space-y-3">
              {recentDecisions.map((trade) => {
                const tradeId = (trade as { id: string }).id;
                const originalShift = getShift(trade.originalShiftId);
                const originalFacility = getFacility(originalShift?.facilityProfileId);
                const offeredShift = getShift(trade.offeredShiftId);
                const offeredFacility = getFacility(offeredShift?.facilityProfileId);
                const requesterProfile = getStaffByEmail(trade.originalStaffEmail);
                const acceptorProfile = getStaffByEmail(trade.acceptedByEmail);

                return (
                  <TradeReviewCard
                    key={tradeId}
                    trade={trade as ITradeWithId}
                    originalShift={originalShift}
                    originalFacility={originalFacility}
                    offeredShift={offeredShift}
                    offeredFacility={offeredFacility}
                    requesterProfile={requesterProfile}
                    acceptorProfile={acceptorProfile}
                    isPending={false}
                    isProcessing={false}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper type alias
type ITradeWithId = typeof ShiftTradesEntity.instanceType & { id?: string };