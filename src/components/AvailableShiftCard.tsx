import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Zap, CheckCircle, Users, Ban, XCircle, X, Star, GraduationCap, DollarSign, Hourglass } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { StaffMyShiftsPage } from "@/product-types";
import type { ApplicationStatusType } from "@/utils/countdownUtils";
import type { OrientationStatus } from "@/utils/orientationUtils";

interface AvailableShiftCardProps {
  facilityName: string;
  facilityCity?: string;
  startDateTime?: string;
  endDateTime?: string;
  duration: number;
  requiredRole?: string;
  isShortNotice?: boolean;
  isComplianceCompliant: boolean;
  roleBadgeColor: string;
  filledCount?: number;
  headcount?: number;
  applicationStatus: ApplicationStatusType;
  appliedAt?: string;
  isShiftOpen: boolean;
  isFavorite?: boolean;
  orientationStatus?: OrientationStatus;
  orientationRequestStatus?: "requested" | "scheduled" | "none";
  shiftStaffRate?: number;
  onClick: () => void;
  onApplyAgain: (e: React.MouseEvent) => void;
}

export const AvailableShiftCard = ({
  facilityName,
  facilityCity,
  startDateTime,
  endDateTime,
  duration,
  requiredRole,
  isShortNotice,
  isComplianceCompliant,
  roleBadgeColor,
  filledCount,
  headcount,
  applicationStatus,
  isShiftOpen,
  isFavorite = false,
  orientationStatus = "not_required",
  orientationRequestStatus = "none",
  shiftStaffRate,
  onClick,
  onApplyAgain,
}: AvailableShiftCardProps) => {
  const isFullyBooked = (filledCount || 0) >= (headcount || 1);
  const showFilledIndicator = headcount != null && headcount > 1;

  const cardBg =
    applicationStatus === "approved"
      ? "bg-accent/5"
      : applicationStatus === "rejected"
        ? "bg-destructive/5"
        : applicationStatus === "withdrawn" || applicationStatus === "withdrawal_pending"
          ? "opacity-80"
          : "";

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:shadow-md border flex flex-col",
        cardBg,
        isFullyBooked && applicationStatus === "none" && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* Header: Facility name + Short Notice badge */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-tight">{facilityName}</h3>
            {isShortNotice && (
              <Badge className="bg-chart-3/20 text-chart-3 shrink-0">
                <Zap className="w-3 h-3 mr-1" />
                Short Notice
              </Badge>
            )}
          </div>
          {facilityCity && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{facilityCity}</span>
            </div>
          )}
        </div>

        {/* Date & Time */}
        {startDateTime && endDateTime && (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {format(parseISO(startDateTime), "EEE, MMM d")} •{" "}
              {format(parseISO(startDateTime), "h:mm a")} -{" "}
              {format(parseISO(endDateTime), "h:mm a")}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{duration} hours</span>
            </div>
          </div>
        )}

        {/* Role Badge + Orientation Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {requiredRole && (
            <Badge className={roleBadgeColor}>{requiredRole}</Badge>
          )}
          {shiftStaffRate != null && shiftStaffRate > 0 && (
            <Badge className="bg-accent/20 text-accent rounded-full">
              <DollarSign className="h-3 w-3 mr-0.5" />
              ${shiftStaffRate.toFixed(2)}/hr
            </Badge>
          )}
          {orientationStatus === "not_required" && (
            <Badge className="bg-accent/15 text-accent">
              <CheckCircle className="w-3 h-3 mr-1" />
              No Orientation Required
            </Badge>
          )}
          {orientationStatus === "required_and_oriented" && (
            <Badge className="bg-accent/20 text-accent">
              <GraduationCap className="w-3 h-3 mr-1" />
              Orientation Required ✓
            </Badge>
          )}
          {orientationStatus === "required_not_oriented" && orientationRequestStatus === "none" && (
            <Badge className="bg-chart-3/20 text-chart-3">
              <GraduationCap className="w-3 h-3 mr-1" />
              Orientation Required
            </Badge>
          )}
          {orientationStatus === "required_not_oriented" && orientationRequestStatus === "requested" && (
            <Badge className="bg-chart-1/20 text-chart-1">
              <Hourglass className="w-3 h-3 mr-1" />
              Orientation Requested
            </Badge>
          )}
          {orientationStatus === "required_not_oriented" && orientationRequestStatus === "scheduled" && (
            <Badge className="bg-chart-2/20 text-chart-2">
              <GraduationCap className="w-3 h-3 mr-1" />
              Orientation Scheduled
            </Badge>
          )}
          {isFullyBooked && applicationStatus === "none" && (
            <Badge className="bg-destructive/15 text-destructive">
              <Ban className="w-3 h-3 mr-1" />
              Full
            </Badge>
          )}
        </div>

        {/* Preferred Worker Badge */}
        {isFavorite && (
          <Badge className="bg-chart-3/15 text-chart-3 border border-chart-3/30 shadow-sm gap-1 w-fit">
            <Star className="h-3 w-3 fill-chart-3" />
            Preferred Worker
          </Badge>
        )}

        {/* Filled slots indicator */}
        {showFilledIndicator && (
          <div className="flex items-center gap-1.5">
            <Users
              className={cn(
                "w-3.5 h-3.5 shrink-0",
                isFullyBooked ? "text-accent" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm",
                isFullyBooked ? "text-accent font-medium" : "text-muted-foreground"
              )}
            >
              {filledCount || 0}/{headcount} filled
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status-specific footer */}
        {applicationStatus === "none" && isFullyBooked ? (
          <Badge className="w-full h-10 flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm">
            <Ban className="w-4 h-4" />
            Fully Booked
          </Badge>
        ) : applicationStatus === "none" ? (
          <div className="space-y-1.5">
            <Button
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              disabled={!isComplianceCompliant || orientationStatus === "required_not_oriented"}
            >
              Claim Shift
            </Button>
            {orientationStatus === "required_not_oriented" && orientationRequestStatus === "none" && (
              <p className="text-xs text-chart-3 text-center">
                Orientation required — tap to request
              </p>
            )}
            {orientationStatus === "required_not_oriented" && orientationRequestStatus === "requested" && (
              <p className="text-xs text-chart-1 text-center">
                Orientation requested — pending review
              </p>
            )}
            {orientationStatus === "required_not_oriented" && orientationRequestStatus === "scheduled" && (
              <p className="text-xs text-chart-2 text-center">
                Orientation scheduled — check notifications
              </p>
            )}
          </div>
        ) : applicationStatus === "approved" ? (
          <div className="space-y-1.5">
            <Badge className="w-full h-10 flex items-center justify-center gap-2 bg-accent/20 text-accent text-sm">
              <CheckCircle className="w-4 h-4" />
              Claimed ✓
            </Badge>
            <Link
              to={getPageUrl(StaffMyShiftsPage)}
              className="block text-xs text-center text-accent hover:underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Check My Shifts →
            </Link>
          </div>
        ) : applicationStatus === "rejected" ? (
          <div className="space-y-2">
            <Badge className="w-full h-10 flex items-center justify-center gap-2 bg-destructive/20 text-destructive text-sm">
              <XCircle className="w-4 h-4" />
              Not Selected
            </Badge>
            {isShiftOpen && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={onApplyAgain}
              >
                Claim Again
              </Button>
            )}
          </div>
        ) : applicationStatus === "withdrawn" || applicationStatus === "withdrawal_pending" ? (
          <div className="space-y-2">
            <Badge className="w-full h-10 flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm">
              <X className="w-4 h-4" />
              Withdrawn
            </Badge>
            {isShiftOpen && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={onApplyAgain}
              >
                Claim Again
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};