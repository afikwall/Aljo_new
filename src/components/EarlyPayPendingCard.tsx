import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  formatCAD,
  formatRequestDateTime,
  formatPeriodLabel,
} from "@/utils/earlyPayUtils";
import { ApproveEarlyPayDialog } from "@/components/ApproveEarlyPayDialog";
import { DenyEarlyPayDialog } from "@/components/DenyEarlyPayDialog";
import type { IEarlyPayRequestsEntity } from "@/product-types";

interface EarlyPayPendingCardProps {
  request: IEarlyPayRequestsEntity & { id: string };
  staffName: string;
  roleType?: string;
  onActionComplete: () => void;
}

export const EarlyPayPendingCard = ({
  request,
  staffName,
  roleType,
  onActionComplete,
}: EarlyPayPendingCardProps) => {
  const [approveOpen, setApproveOpen] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);

  const handleApproveClick = useCallback(() => {
    setApproveOpen(true);
  }, []);

  const handleDenyClick = useCallback(() => {
    setDenyOpen(true);
  }, []);

  const periodLabel = formatPeriodLabel(request.periodStart, request.periodEnd);

  return (
    <>
      <Card className="border-l-4 border-l-chart-3">
        <CardContent className="p-4 space-y-3">
          {/* Staff Name & Role */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{staffName}</span>
              {roleType && (
                <Badge className={`${getRoleBadgeColor(roleType)} text-xs`}>
                  {roleType}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRequestDateTime(request.requestedAt)}
            </div>
          </div>

          {/* Amount & Period */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Amount Requested</p>
              <p className="font-semibold text-base">
                {formatCAD(request.amountRequested || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Pay Period</p>
              <p className="font-medium">{periodLabel}</p>
            </div>
          </div>

          {/* Reason */}
          {request.reason && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Reason</p>
              <p className="text-sm">{request.reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="h-11 flex-1"
              onClick={handleApproveClick}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-11 flex-1 text-destructive hover:text-destructive"
              onClick={handleDenyClick}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Deny
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <ApproveEarlyPayDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        requestId={request.id}
        staffName={staffName}
        amountRequested={request.amountRequested || 0}
        onSuccess={onActionComplete}
      />

      {/* Deny Dialog */}
      <DenyEarlyPayDialog
        open={denyOpen}
        onOpenChange={setDenyOpen}
        requestId={request.id}
        staffName={staffName}
        amountRequested={request.amountRequested || 0}
        onSuccess={onActionComplete}
      />
    </>
  );
};