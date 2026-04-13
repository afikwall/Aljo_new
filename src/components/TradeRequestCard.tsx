import { useMemo, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeftRight,
  Gift,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";
import {
  getTradeTypeBadge,
  getRelativeTradeTime,
  getRoleBadgeColor,
  getStaffName,
  getStaffInitials,
} from "@/utils/tradeUtils";
import type {
  IShiftTradesEntity,
  IShiftsEntity,
  IFacilitiesEntity,
  IStaffProfilesEntity,
} from "@/product-types";

interface TradeRequestCardProps {
  trade: IShiftTradesEntity & { id?: string };
  originalShift: (IShiftsEntity & { id?: string }) | null;
  originalFacility: (IFacilitiesEntity & { id?: string }) | null;
  offeredShift: (IShiftsEntity & { id?: string }) | null;
  offeredFacility: (IFacilitiesEntity & { id?: string }) | null;
  requesterProfile: (IStaffProfilesEntity & { id?: string }) | null;
  currentUserEmail: string;
  isAccepting: boolean;
  onAccept: (tradeId: string) => void;
}

export const TradeRequestCard = ({
  trade,
  originalShift,
  originalFacility,
  offeredShift,
  offeredFacility,
  requesterProfile,
  currentUserEmail,
  isAccepting,
  onAccept,
}: TradeRequestCardProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const isAwaitingApproval = trade.status === "pending" && trade.acceptedByEmail === currentUserEmail;

  const handleAcceptClick = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmAccept = useCallback(() => {
    setShowConfirmDialog(false);
    if (trade.id) {
      onAccept(trade.id);
    }
  }, [trade.id, onAccept]);

  return (
    <>
      <Card className="border rounded-lg">
        <CardContent className="p-4 space-y-4">
          {/* Header: Trade type badge + time */}
          <div className="flex items-center justify-between">
            <Badge className={typeBadge.className}>
              {trade.requestType === "giveaway" ? (
                <Gift className="h-3 w-3 mr-1" />
              ) : (
                <ArrowLeftRight className="h-3 w-3 mr-1" />
              )}
              {typeBadge.label}
            </Badge>
            {relativeTime && (
              <span className="text-xs text-muted-foreground">{relativeTime}</span>
            )}
          </div>

          {/* Requester info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-muted">
                {requesterInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">From: {requesterName}</span>
          </div>

          {/* Original shift (the shift being offered up) */}
          {originalShift && (
            <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Shift needing coverage
              </p>
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

          {/* Arrow + offered shift (trade only) */}
          {trade.requestType === "trade" && offeredShift && (
            <>
              <div className="flex justify-center">
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  In exchange for
                </p>
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
            </>
          )}

          {/* Reason/message */}
          {trade.reason && (
            <p className="text-sm text-muted-foreground italic">"{trade.reason}"</p>
          )}

          {/* Action area */}
          {isAwaitingApproval ? (
            <Badge className="w-full h-11 flex items-center justify-center bg-chart-3/20 text-chart-3">
              <Clock className="h-4 w-4 mr-2" />
              Awaiting Admin Approval
            </Badge>
          ) : trade.status === "open" ? (
            <Button
              className="w-full h-11"
              onClick={handleAcceptClick}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : trade.requestType === "giveaway" ? (
                "Accept Giveaway"
              ) : (
                "Accept Trade"
              )}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Accept this {trade.requestType === "giveaway" ? "giveaway" : "trade"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will be sent to admin for approval. Once approved, the shift will be reassigned to you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAccept}>
              Yes, Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};