import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ShiftTradesEntity,
  ShiftsEntity,
  FacilitiesEntity,
  StaffProfilesEntity,
} from "@/product-types";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { TradeRequestCard } from "@/components/TradeRequestCard";

export const ShiftTradesTab = () => {
  const user = useUser();
  const [acceptingTradeId, setAcceptingTradeId] = useState<string | null>(null);

  const {
    data: allTrades,
    isLoading: loadingTrades,
    refetch: refetchTrades,
  } = useEntityGetAll(ShiftTradesEntity);
  const { data: allShifts, isLoading: loadingShifts } = useEntityGetAll(ShiftsEntity);
  const { data: allFacilities } = useEntityGetAll(FacilitiesEntity);
  const { data: allStaffProfiles } = useEntityGetAll(StaffProfilesEntity);
  const { updateFunction: updateTrade } = useEntityUpdate(ShiftTradesEntity);

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

  // Filter: open or pending trades, NOT from current user
  const visibleTrades = useMemo(() => {
    if (!allTrades) return [];
    return allTrades
      .filter((t) => {
        // Show open trades (not from me) and pending trades (where I'm the acceptor)
        if (t.originalStaffEmail === user.email) return false;
        if (t.status === "open") return true;
        if (t.status === "pending" && t.acceptedByEmail === user.email) return true;
        return false;
      })
      .sort((a, b) => {
        const aTime = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const bTime = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [allTrades, user.email]);

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

  const handleAcceptTrade = useCallback(
    async (tradeId: string) => {
      setAcceptingTradeId(tradeId);
      try {
        await updateTrade({
          id: tradeId,
          data: {
            status: "pending",
            acceptedByEmail: user.email,
            respondedAt: new Date().toISOString(),
          },
        });
        toast.success("Request sent to admin for approval!");
        await refetchTrades();
      } catch {
        toast.error("Failed to accept trade. Please try again.");
      } finally {
        setAcceptingTradeId(null);
      }
    },
    [updateTrade, user.email, refetchTrades]
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (visibleTrades.length === 0) {
    return (
      <div className="p-4">
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
          <ArrowLeftRight className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-base">No open trade requests</p>
          <p className="text-sm text-muted-foreground mt-1">
            When colleagues request shift trades, they'll appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {visibleTrades.map((trade) => {
        const tradeId = (trade as { id: string }).id;
        const originalShift = getShift(trade.originalShiftId);
        const originalFacility = getFacility(originalShift?.facilityProfileId);
        const offeredShift = getShift(trade.offeredShiftId);
        const offeredFacility = getFacility(offeredShift?.facilityProfileId);
        const requesterProfile = trade.originalStaffEmail
          ? staffByEmail.get(trade.originalStaffEmail) || null
          : null;

        return (
          <TradeRequestCard
            key={tradeId}
            trade={trade as typeof ShiftTradesEntity.instanceType & { id?: string }}
            originalShift={originalShift}
            originalFacility={originalFacility}
            offeredShift={offeredShift}
            offeredFacility={offeredFacility}
            requesterProfile={requesterProfile}
            currentUserEmail={user.email || ""}
            isAccepting={acceptingTradeId === tradeId}
            onAccept={handleAcceptTrade}
          />
        );
      })}
    </div>
  );
};