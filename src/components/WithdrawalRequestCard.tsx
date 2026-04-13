import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Clock, Loader2, MapPin, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLE_BADGE_COLORS,
  formatShiftDateTime,
  getStaffDisplayName,
  getStaffInitials,
} from "@/utils/shiftApplicationUtils";
import type { IShiftsEntity, IStaffProfilesEntity, IFacilitiesEntity } from "@/product-types";

interface WithdrawalRequestCardProps {
  applicationId: string;
  shift: (IShiftsEntity & { id: string }) | null;
  staff: (IStaffProfilesEntity & { id: string }) | null;
  facility: (IFacilitiesEntity & { id: string }) | null;
  withdrawalReason?: string;
  onApproveWithdrawal: (applicationId: string) => void;
  onDenyWithdrawal: (applicationId: string) => void;
  isProcessing: boolean;
  processingId: string | null;
  processingAction: "approve" | "deny" | null;
}

export const WithdrawalRequestCard = ({
  applicationId,
  shift,
  staff,
  facility,
  withdrawalReason,
  onApproveWithdrawal,
  onDenyWithdrawal,
  isProcessing,
  processingId,
  processingAction,
}: WithdrawalRequestCardProps) => {
  const staffName = getStaffDisplayName(staff?.firstName, staff?.lastName, staff?.email);
  const initials = getStaffInitials(staff?.firstName, staff?.lastName);
  const withdrawalCount = staff?.withdrawalCount || 0;
  const isFrequentWithdrawer = withdrawalCount >= 3;
  const isThisProcessing = processingId === applicationId;

  return (
    <Card className="border-l-4 border-l-chart-3">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Staff info row */}
          <div className="flex items-start gap-3">
            {staff?.profilePhotoUrl ? (
              <img
                src={staff.profilePhotoUrl}
                alt={staffName}
                className="h-10 w-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{staffName}</p>
                {isFrequentWithdrawer && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Frequent withdrawer ({withdrawalCount} withdrawals)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {staff?.roleType && (
                  <Badge
                    className={cn(
                      "rounded-full text-xs px-2 py-0.5",
                      ROLE_BADGE_COLORS[staff.roleType] || "bg-muted text-muted-foreground"
                    )}
                  >
                    {staff.roleType}
                  </Badge>
                )}
                {withdrawalCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {withdrawalCount} previous withdrawal{withdrawalCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Shift details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium">{facility?.name || "Unknown Facility"}</p>
              {facility?.city && (
                <span className="text-sm text-muted-foreground">• {facility.city}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{formatShiftDateTime(shift?.startDateTime, shift?.endDateTime)}</span>
            </div>
            {shift?.requiredRole && (
              <Badge
                className={cn(
                  "rounded-full text-xs px-2 py-0.5",
                  ROLE_BADGE_COLORS[shift.requiredRole] || "bg-muted text-muted-foreground"
                )}
              >
                {shift.requiredRole}
              </Badge>
            )}
          </div>

          {/* Withdrawal Reason */}
          {withdrawalReason && withdrawalReason.trim() !== "" && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Withdrawal Reason
              </p>
              <div className="bg-chart-3/10 rounded-md p-2.5 flex items-start gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-chart-3 shrink-0 mt-0.5" />
                <p className="text-sm italic text-foreground">{withdrawalReason}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => onApproveWithdrawal(applicationId)}
              disabled={isProcessing}
            >
              {isThisProcessing && processingAction === "approve" ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Withdrawal"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDenyWithdrawal(applicationId)}
              disabled={isProcessing}
            >
              {isThisProcessing && processingAction === "deny" ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Denying...
                </>
              ) : (
                "Deny Withdrawal"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};