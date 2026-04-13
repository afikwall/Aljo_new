import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftRight,
  Gift,
  MapPin,
  Clock,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";
import {
  getTradeTypeBadge,
  getRelativeTradeTime,
  getRoleBadgeColor,
  getStaffName,
  getStaffInitials,
  TRADE_STATUS_STYLES,
} from "@/utils/tradeUtils";
import type {
  IShiftTradesEntity,
  IShiftsEntity,
  IFacilitiesEntity,
  IStaffProfilesEntity,
} from "@/product-types";

interface TradeReviewCardProps {
  trade: IShiftTradesEntity & { id?: string };
  originalShift: (IShiftsEntity & { id?: string }) | null;
  originalFacility: (IFacilitiesEntity & { id?: string }) | null;
  offeredShift: (IShiftsEntity & { id?: string }) | null;
  offeredFacility: (IFacilitiesEntity & { id?: string }) | null;
  requesterProfile: (IStaffProfilesEntity & { id?: string }) | null;
  acceptorProfile: (IStaffProfilesEntity & { id?: string }) | null;
  /** If true, show approve/reject buttons (pending state) */
  isPending: boolean;
  isProcessing: boolean;
  onApprove: (tradeId: string) => void;
  onReject: (tradeId: string, reason: string) => void;
}

export const TradeReviewCard = ({
  trade,
  originalShift,
  originalFacility,
  offeredShift,
  offeredFacility,
  requesterProfile,
  acceptorProfile,
  isPending,
  isProcessing,
  onApprove,
  onReject,
}: TradeReviewCardProps) => {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const typeBadge = useMemo(() => getTradeTypeBadge(trade.requestType), [trade.requestType]);
  const relativeTime = useMemo(() => getRelativeTradeTime(trade.requestedAt), [trade.requestedAt]);

  const requesterName = useMemo(
    () => getStaffName(requesterProfile?.firstName, requesterProfile?.lastName, trade.originalStaffEmail),
    [requesterProfile, trade.originalStaffEmail]
  );
  const requesterInitials = useMemo(
    () => getStaffInitials(requesterProfile?.firstName, requesterProfile?.lastName),
    [requesterProfile]
  );

  const acceptorName = useMemo(
    () => getStaffName(acceptorProfile?.firstName, acceptorProfile?.lastName, trade.acceptedByEmail),
    [acceptorProfile, trade.acceptedByEmail]
  );
  const acceptorInitials = useMemo(
    () => getStaffInitials(acceptorProfile?.firstName, acceptorProfile?.lastName),
    [acceptorProfile]
  );

  const originalDuration = useMemo(() => {
    if (!originalShift?.startDateTime || !originalShift?.endDateTime) return 0;
    try {
      return differenceInHours(parseISO(originalShift.endDateTime), parseISO(originalShift.startDateTime));
    } catch {
      return 0;
    }
  }, [originalShift]);

  const offeredDuration = useMemo(() => {
    if (!offeredShift?.startDateTime || !offeredShift?.endDateTime) return 0;
    try {
      return differenceInHours(parseISO(offeredShift.endDateTime), parseISO(offeredShift.startDateTime));
    } catch {
      return 0;
    }
  }, [offeredShift]);

  const statusStyle = useMemo(
    () => TRADE_STATUS_STYLES[trade.status || "open"] || TRADE_STATUS_STYLES.open,
    [trade.status]
  );

  const handleApprove = useCallback(() => {
    if (trade.id) onApprove(trade.id);
  }, [trade.id, onApprove]);

  const handleReject = useCallback(() => {
    if (trade.id) {
      onReject(trade.id, rejectReason);
      setShowRejectInput(false);
      setRejectReason("");
    }
  }, [trade.id, rejectReason, onReject]);

  return (
    <Card className="border rounded-lg">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge className={typeBadge.className}>
            {trade.requestType === "giveaway" ? (
              <Gift className="h-3 w-3 mr-1" />
            ) : (
              <ArrowLeftRight className="h-3 w-3 mr-1" />
            )}
            {typeBadge.label}
          </Badge>
          <div className="flex items-center gap-2">
            {!isPending && (
              <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
            )}
            {relativeTime && (
              <span className="text-xs text-muted-foreground">{relativeTime}</span>
            )}
          </div>
        </div>

        {/* Requester row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-chart-1/20 text-chart-1">
                {requesterInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{requesterName}</p>
              <p className="text-xs text-muted-foreground">Requester</p>
            </div>
            {requesterProfile?.roleType && (
              <Badge className={getRoleBadgeColor(requesterProfile.roleType)}>
                {requesterProfile.roleType}
              </Badge>
            )}
          </div>

          {/* Requester's shift */}
          {originalShift && (
            <div className="rounded-lg bg-muted/30 p-3 space-y-1.5 ml-10">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm font-medium">
                  {originalFacility?.name || "Unknown Facility"}
                </p>
              </div>
              {originalShift.startDateTime && originalShift.endDateTime && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(originalShift.startDateTime), "EEE, MMM d • h:mm a")} –{" "}
                    {format(parseISO(originalShift.endDateTime), "h:mm a")}{" "}
                    <span className="text-muted-foreground/70">({originalDuration}h)</span>
                  </p>
                </div>
              )}
              {originalShift.requiredRole && (
                <Badge className={getRoleBadgeColor(originalShift.requiredRole)}>
                  {originalShift.requiredRole}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Acceptor row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-chart-2/20 text-chart-2">
                {acceptorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{acceptorName}</p>
              <p className="text-xs text-muted-foreground">Accepting staff</p>
            </div>
            {acceptorProfile?.roleType && (
              <Badge className={getRoleBadgeColor(acceptorProfile.roleType)}>
                {acceptorProfile.roleType}
              </Badge>
            )}
          </div>

          {/* Acceptor's shift (trade only) */}
          {trade.requestType === "trade" && offeredShift ? (
            <div className="rounded-lg bg-muted/30 p-3 space-y-1.5 ml-10">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm font-medium">
                  {offeredFacility?.name || "Unknown Facility"}
                </p>
              </div>
              {offeredShift.startDateTime && offeredShift.endDateTime && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(offeredShift.startDateTime), "EEE, MMM d • h:mm a")} –{" "}
                    {format(parseISO(offeredShift.endDateTime), "h:mm a")}{" "}
                    <span className="text-muted-foreground/70">({offeredDuration}h)</span>
                  </p>
                </div>
              )}
              {offeredShift.requiredRole && (
                <Badge className={getRoleBadgeColor(offeredShift.requiredRole)}>
                  {offeredShift.requiredRole}
                </Badge>
              )}
            </div>
          ) : trade.requestType === "giveaway" ? (
            <p className="text-sm text-muted-foreground ml-10 italic">
              No shift in return (giveaway)
            </p>
          ) : null}
        </div>

        {/* Reason */}
        {trade.reason && (
          <p className="text-sm text-muted-foreground italic">"{trade.reason}"</p>
        )}

        {/* Rejection reason (for already-decided trades) */}
        {trade.rejectionReason && trade.status === "rejected" && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              <span className="font-medium">Rejection reason:</span> {trade.rejectionReason}
            </p>
          </div>
        )}

        {/* Approved date */}
        {trade.status === "admin_approved" && trade.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Approved on {format(parseISO(trade.approvedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
        {trade.status === "rejected" && trade.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Rejected on {format(parseISO(trade.approvedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}

        {/* Action buttons (pending only) */}
        {isPending && (
          <>
            <Separator />
            {showRejectInput ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Reason for rejection (optional)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason("");
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-11"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Confirm Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-11 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowRejectInput(true)}
                  disabled={isProcessing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};