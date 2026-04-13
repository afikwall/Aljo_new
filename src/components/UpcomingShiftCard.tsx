import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Zap, Loader2, ArrowLeftRight, AlertTriangle, DollarSign, UserCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { getShiftCountdown } from "@/utils/countdownUtils";
import { getClockInWindowInfo } from "@/utils/clockInOutUtils";
import type { IShiftsEntity } from "@/product-types";
import type { IFacilitiesEntity } from "@/product-types";
import { useMemo } from "react";

interface UpcomingShiftCardProps {
  shift: IShiftsEntity & { id?: string };
  facility: (IFacilitiesEntity & { id?: string }) | null;
  duration: number;
  roleBadgeColor: string;
  isWithdrawalPending: boolean;
  canClockIn: boolean;
  canWithdraw: boolean;
  clockingIn: boolean;
  isClockingThisShift: boolean;
  currentTime: Date;
  hasCoverageRequest?: boolean;
  shiftStaffRate?: number;
  isAssigned?: boolean;
  onCardClick: () => void;
  onClockIn: (e: React.MouseEvent) => void;
  onWithdraw: (e: React.MouseEvent) => void;
  onFindCoverage?: (e: React.MouseEvent) => void;
}

export const UpcomingShiftCard = ({
  shift,
  facility,
  duration,
  roleBadgeColor,
  isWithdrawalPending,
  canClockIn,
  canWithdraw,
  clockingIn,
  isClockingThisShift,
  currentTime,
  hasCoverageRequest,
  shiftStaffRate,
  isAssigned,
  onCardClick,
  onClockIn,
  onWithdraw,
  onFindCoverage,
}: UpcomingShiftCardProps) => {
  const countdown = shift.startDateTime
    ? getShiftCountdown(shift.startDateTime, currentTime)
    : null;

  const clockInWindow = useMemo(() => {
    if (!shift.startDateTime) return null;
    return getClockInWindowInfo(shift.startDateTime, currentTime);
  }, [shift.startDateTime, currentTime]);

  // Show countdown to clock-in window opening (within 60 min)
  const showCountdownToWindow = clockInWindow?.state === "before_window" && clockInWindow.minutesUntilWindowOpens <= 60;

  return (
    <Card
      className="border cursor-pointer transition-all hover:shadow-md"
      onClick={onCardClick}
    >
      <CardContent className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-tight">
              {facility?.name || "Unknown Facility"}
            </h3>
            {shift.isShortNotice && (
              <Badge className="bg-chart-3/20 text-chart-3 shrink-0">
                <Zap className="w-3 h-3 mr-1" />
                Short Notice
              </Badge>
            )}
          </div>
          {facility?.city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{facility.city}</span>
            </div>
          )}
        </div>

        {shift.startDateTime && shift.endDateTime && (
          <div className="space-y-1">
            <p className="text-base font-medium">
              {format(parseISO(shift.startDateTime), "EEE, MMM d")} •{" "}
              {format(parseISO(shift.startDateTime), "h:mm a")} -{" "}
              {format(parseISO(shift.endDateTime), "h:mm a")}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{duration} hours</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {shift.requiredRole && (
            <Badge className={roleBadgeColor}>{shift.requiredRole}</Badge>
          )}
          {isAssigned && (
            <Badge className="bg-primary/20 text-primary">
              <UserCheck className="h-3 w-3 mr-1" />
              Assigned
            </Badge>
          )}
          {shiftStaffRate != null && shiftStaffRate > 0 && (
            <Badge className="bg-accent/20 text-accent rounded-full">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {shiftStaffRate.toFixed(0)}/hr
            </Badge>
          )}
        </div>

        {/* Countdown or Withdrawal Pending */}
        {isWithdrawalPending ? (
          <div className="flex items-center justify-center h-10 w-full rounded-md bg-chart-3/20 text-chart-3 font-medium text-sm">
            <Clock className="w-4 h-4 mr-2" />
            Withdrawal Requested
          </div>
        ) : clockInWindow?.state === "past_window" ? (
          /* Late block: more than 30 min after start */
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">
                You are more than 30 minutes late. Contact your manager.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Countdown display */}
            {countdown && countdown.text && (
              <div className="flex items-center gap-2">
                {countdown.isStartingSoon && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm",
                    countdown.isStartingSoon
                      ? "font-semibold text-accent"
                      : "font-medium text-muted-foreground"
                  )}
                >
                  {countdown.text}
                </span>
              </div>
            )}

            {/* Confirmed badge */}
            <Badge className="w-full h-10 flex items-center justify-center gap-2 bg-accent/20 text-accent text-sm">
              Confirmed
            </Badge>

            {/* Clock In button - shows in different states */}
            {canClockIn ? (
              <Button
                className="h-12 w-full text-base"
                size="lg"
                onClick={onClockIn}
                disabled={clockingIn}
              >
                {isClockingThisShift ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying location...
                  </>
                ) : (
                  "Clock In"
                )}
              </Button>
            ) : clockInWindow?.state === "before_window" ? (
              /* Disabled clock-in button before window opens */
              <div className="space-y-1">
                <Button
                  className="h-12 w-full text-base opacity-50 cursor-not-allowed"
                  size="lg"
                  disabled
                >
                  Clock In
                </Button>
                {showCountdownToWindow ? (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Clock-in opens in {clockInWindow.minutesUntilWindowOpens} min
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Clock-in opens at {clockInWindow.clockInOpensAt}
                  </p>
                )}
              </div>
            ) : null}

            {/* Coverage Requested badge OR Find Coverage button */}
            {hasCoverageRequest ? (
              <div className="flex items-center justify-center h-10 w-full rounded-md bg-chart-3/10 border border-chart-3/20 text-chart-3 font-medium text-sm">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Coverage Requested
              </div>
            ) : onFindCoverage ? (
              <Button
                variant="outline"
                className="h-11 w-full text-sm"
                onClick={onFindCoverage}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Find Coverage
              </Button>
            ) : null}

            {/* Withdraw link */}
            {canWithdraw && !hasCoverageRequest && (
              <div className="flex justify-center">
                <button
                  onClick={onWithdraw}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Withdraw
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};