import { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, Gift, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TimesheetStatusBadge } from "@/components/TimesheetStatusBadge";
import {
  type TimesheetWithRelations,
  formatShiftDate,
  formatCAD,
  calculateGrossPay,
} from "@/utils/timesheetUtils";
import type { IEarlyPayRequestsEntity } from "@/product-types";

type EarlyPayRecord = IEarlyPayRequestsEntity & { id: string };

interface TimesheetRowProps {
  timesheet: TimesheetWithRelations;
  onApprove: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  onSaveAndApprove: (
    id: string,
    data: { totalHours: number; hourlyRate: number; adjustmentNote: string }
  ) => Promise<void>;
  isUpdating: boolean;
  earlyPayRequests?: EarlyPayRecord[];
}

export const TimesheetRow = ({
  timesheet,
  onApprove,
  onMarkPaid,
  onSaveAndApprove,
  isUpdating,
  earlyPayRequests,
}: TimesheetRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editHours, setEditHours] = useState(timesheet.totalHours || 0);
  const [editRate, setEditRate] = useState(timesheet.hourlyRate || 0);
  const [adjustmentNote, setAdjustmentNote] = useState("");

  const isBonus = useMemo(
    () => timesheet.totalHours === 0 && timesheet.adjustmentNote?.startsWith("Bonus:"),
    [timesheet.totalHours, timesheet.adjustmentNote]
  );

  const isDeduction = useMemo(
    () => (timesheet.grossPay ?? 0) < 0,
    [timesheet.grossPay]
  );

  // Use shiftDate if present, otherwise fall back to periodStart, otherwise undefined (shows "N/A")
  const displayDate = useMemo(
    () => timesheet.shiftDate || timesheet.periodStart || undefined,
    [timesheet.shiftDate, timesheet.periodStart]
  );

  const isPending = timesheet.paymentStatus === "pending";
  const isApproved = timesheet.paymentStatus === "approved";

  const calculatedGross = useMemo(
    () => calculateGrossPay(editHours, editRate, timesheet.multiplier || 1),
    [editHours, editRate, timesheet.multiplier]
  );

  const hasEdits = useMemo(
    () =>
      editHours !== (timesheet.totalHours || 0) ||
      editRate !== (timesheet.hourlyRate || 0),
    [editHours, editRate, timesheet.totalHours, timesheet.hourlyRate]
  );

  const handleToggle = useCallback(() => {
    if (isPending) {
      setExpanded((prev) => !prev);
      if (!expanded) {
        setEditHours(timesheet.totalHours || 0);
        setEditRate(timesheet.hourlyRate || 0);
        setAdjustmentNote("");
      }
    }
  }, [isPending, expanded, timesheet.totalHours, timesheet.hourlyRate]);

  const handleSaveAndApprove = useCallback(async () => {
    if (!adjustmentNote.trim()) return;
    await onSaveAndApprove(timesheet.id, {
      totalHours: editHours,
      hourlyRate: editRate,
      adjustmentNote: adjustmentNote.trim(),
    });
    setExpanded(false);
  }, [
    timesheet.id,
    editHours,
    editRate,
    adjustmentNote,
    onSaveAndApprove,
  ]);

  const handleApproveAsIs = useCallback(async () => {
    await onApprove(timesheet.id);
    setExpanded(false);
  }, [timesheet.id, onApprove]);

  const handleMarkPaid = useCallback(async () => {
    await onMarkPaid(timesheet.id);
  }, [timesheet.id, onMarkPaid]);

  const bonusReason = useMemo(() => {
    if (!isBonus) return "";
    return timesheet.adjustmentNote?.replace(/^Bonus:\s*/, "") || "";
  }, [isBonus, timesheet.adjustmentNote]);

  // Find the exact matching early pay request for this deduction row.
  // Step 1: if the timesheet has an earlyPayRequestId, use it to find the exact record.
  // Step 2: fall back to the most recent paid request for this staff member by staffProfileId.
  const matchedEarlyPay = useMemo(() => {
    if (!isDeduction || !earlyPayRequests || earlyPayRequests.length === 0) return null;

    // Step 1: exact match by earlyPayRequestId
    if (timesheet.earlyPayRequestId) {
      const exact = earlyPayRequests.find(
        (r) => r.id === timesheet.earlyPayRequestId
      );
      if (exact) return exact;
    }

    // Step 2: fallback — most recent paid request for this staff member
    const staffId = timesheet.staffProfileId;
    if (!staffId) return null;
    const matches = earlyPayRequests.filter(
      (r) => r.staffProfileId === staffId && r.status === "paid"
    );
    if (matches.length === 0) return null;
    return matches.sort((a, b) => {
      const aTime = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
      const bTime = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
      return bTime - aTime;
    })[0];
  }, [isDeduction, earlyPayRequests, timesheet.earlyPayRequestId, timesheet.staffProfileId]);

  // // ── Bonus Row ────────────────────────────────────────────────────────────
  // if (isBonus) {
  //   return (
  //     <div className="pl-4 md:pl-8 border-b py-3 bg-accent/5">
  //       {/* Desktop */}
  //       <div className="hidden md:flex items-center gap-3">
  //         <Gift className="h-4 w-4 text-accent flex-shrink-0" />
  //         <div className="flex-1 grid grid-cols-7 items-center gap-2">
  //           <span className="text-sm">{formatShiftDate(displayDate)}</span>
  //           <div className="col-span-2 flex flex-row items-center gap-2 justify-start">
  //             <Badge className="bg-accent/20 text-accent border-0 text-xs">Bonus</Badge>
  //             {bonusReason && (
  //               <span className="text-xs text-muted-foreground truncate">{bonusReason}</span>
  //             )}
  //           </div>
  //           <span />
  //           <span className="text-sm font-bold tabular-nums text-accent">
  //             {formatCAD(timesheet.grossPay || 0)}
  //           </span>
  //           <div className="flex items-center gap-2 justify-end">
  //             <TimesheetStatusBadge status={timesheet.paymentStatus} />
  //           </div>
  //         </div>
  //       </div>
  //       {/* Mobile */}
  //       <div className="md:hidden space-y-2">
  //         <div className="flex items-center justify-between">
  //           <div className="flex items-center gap-2">
  //             <Gift className="h-4 w-4 text-accent" />
  //             <span className="text-sm font-medium">{formatShiftDate(displayDate)}</span>
  //             <Badge className="bg-accent/20 text-accent border-0 text-xs">Bonus</Badge>
  //           </div>
  //           <TimesheetStatusBadge status={timesheet.paymentStatus} />
  //         </div>
  //         {bonusReason && (
  //           <p className="text-xs text-muted-foreground pl-6">{bonusReason}</p>
  //         )}
  //         <div className="flex items-center justify-between pl-6">
  //           <span className="text-sm text-muted-foreground">{timesheet.facilityName}</span>
  //           <span className="text-sm font-bold text-accent">{formatCAD(timesheet.grossPay || 0)}</span>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // // ── Deduction Row ─────────────────────────────────────────────────────────
  // if (isDeduction) {
  //   return (
  //     <div className="pl-4 md:pl-8 border-b py-3 bg-chart-3/5">
  //       {/* Desktop */}
  //       <div className="hidden md:flex items-center gap-3">
  //         <MinusCircle className="h-4 w-4 text-chart-3 flex-shrink-0" />
  //         <div className="flex-1 grid grid-cols-7 items-center gap-2">
  //           <span className="text-sm">{formatShiftDate(displayDate)}</span>
  //           <div className="col-span-2 flex flex-row items-center gap-2 justify-start">
  //               <Badge className="bg-chart-3/20 text-chart-3 border-0 text-xs">Early Pay Deduction</Badge>
  //               {matchedEarlyPay?.reason && (
  //                 <span className="text-xs text-muted-foreground truncate">{matchedEarlyPay.reason}</span>
  //               )}
  //           </div>
  //           <span />
  //           <span className="text-sm font-bold tabular-nums text-destructive">
  //             {formatCAD(timesheet.grossPay || 0)}
  //           </span>
  //           <div className="flex items-center gap-2 justify-end">
  //             <TimesheetStatusBadge status={timesheet.paymentStatus} />
  //           </div>
  //         </div>
  //       </div>
  //       {/* Mobile */}
  //       <div className="md:hidden space-y-2">
  //         <div className="flex items-center justify-between">
  //           <div className="flex items-center gap-2">
  //             <MinusCircle className="h-4 w-4 text-chart-3" />
  //             <span className="text-sm font-medium">{formatShiftDate(displayDate)}</span>
  //             <span className="text-xs text-muted-foreground">Early Pay Deduction</span>
  //           </div>
  //           <TimesheetStatusBadge status={timesheet.paymentStatus} />
  //         </div>
  //         {matchedEarlyPay ? (
  //           <div className="pl-6 space-y-0.5">
  //             {matchedEarlyPay.reason && (
  //               <p className="text-xs italic text-muted-foreground leading-snug">&ldquo;{matchedEarlyPay.reason}&rdquo;</p>
  //             )}
  //             {matchedEarlyPay.amountRequested != null && (
  //               <span className="text-xs text-muted-foreground block">Requested:{" "}<span className="font-medium text-foreground">{formatCAD(matchedEarlyPay.amountRequested)}</span></span>
  //             )}
  //             {matchedEarlyPay.amountApproved != null && (
  //               <span className="text-xs text-muted-foreground block">Approved:{" "}<span className="font-medium text-chart-3">{formatCAD(matchedEarlyPay.amountApproved)}</span></span>
  //             )}
  //             {matchedEarlyPay.reviewedByEmail && (
  //               <p className="text-[10px] text-muted-foreground">Approved by: {matchedEarlyPay.reviewedByEmail}</p>
  //             )}
  //           </div>
  //         ) : timesheet.adjustmentNote ? (
  //           <p className="text-xs text-muted-foreground pl-6">{timesheet.adjustmentNote}</p>
  //         ) : null}
  //         <div className="flex items-center justify-between pl-6">
  //           <span className="text-sm text-muted-foreground">{timesheet.facilityName}</span>
  //           <span className="text-sm font-bold text-destructive">{formatCAD(timesheet.grossPay || 0)}</span>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // ── Regular Row ───────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`pl-4 md:pl-8 border-b py-3 ${isPending ? "cursor-pointer hover:bg-muted/30" : ""}`}
        onClick={handleToggle}
      >
        {/* Desktop layout */}
        <div className="hidden md:flex items-center gap-3">
          {isPending && (
            <span className="text-muted-foreground">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <div className="flex-1 grid grid-cols-7 items-center gap-2">
            <span className="text-sm">{formatShiftDate(displayDate)}</span>
            <span className="text-sm text-muted-foreground truncate">
              {timesheet.facilityName}
            </span>
            <span className="text-sm tabular-nums">
              {(timesheet.totalHours || 0).toFixed(1)}h
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatCAD(timesheet.hourlyRate || 0)}/hr
            </span>
            <span className="text-sm">
              {(timesheet.multiplier || 1) > 1 && (
                <Badge variant="secondary" className="text-xs">
                  ×{(timesheet.multiplier || 1).toFixed(1)}
                </Badge>
              )}
            </span>
            <span className="text-sm font-medium tabular-nums">
              {formatCAD(timesheet.grossPay || 0)}
            </span>
            <div className="flex items-center gap-2 justify-end">
              <TimesheetStatusBadge status={timesheet.paymentStatus} />
              {isPending && !expanded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(timesheet.id);
                  }}
                  disabled={isUpdating}
                >
                  Approve
                </Button>
              )}
              {isApproved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkPaid();
                  }}
                  disabled={isUpdating}
                >
                  Mark Paid
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPending && (
                <span className="text-muted-foreground">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
              <span className="text-sm font-medium">
                {formatShiftDate(displayDate)}
              </span>
            </div>
            <TimesheetStatusBadge status={timesheet.paymentStatus} />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground pl-6">
            <span>{timesheet.facilityName}</span>
            <span className="font-medium text-foreground">
              {formatCAD(timesheet.grossPay || 0)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
            <span>{(timesheet.totalHours || 0).toFixed(1)}h</span>
            <span>{formatCAD(timesheet.hourlyRate || 0)}/hr</span>
            {(timesheet.multiplier || 1) > 1 && (
              <span>×{(timesheet.multiplier || 1).toFixed(1)}</span>
            )}
          </div>
          {isPending && !expanded && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(timesheet.id);
              }}
              disabled={isUpdating}
            >
              Approve
            </Button>
          )}
          {isApproved && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPaid();
              }}
              disabled={isUpdating}
            >
              Mark Paid
            </Button>
          )}
        </div>
      </div>

      {/* Inline Edit Panel */}
      {expanded && isPending && (
        <div
          className="bg-muted/30 rounded-lg p-4 mt-2 mb-2 ml-4 md:ml-8 mr-2 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium">Edit & Approve Timesheet</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`hours-${timesheet.id}`} className="text-xs">
                Total Hours
              </Label>
              <Input
                id={`hours-${timesheet.id}`}
                type="number"
                step="0.1"
                min="0"
                value={editHours}
                onChange={(e) => setEditHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor={`rate-${timesheet.id}`} className="text-xs">
                Hourly Rate ($)
              </Label>
              <Input
                id={`rate-${timesheet.id}`}
                type="number"
                step="0.01"
                min="0"
                value={editRate}
                onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-xs">Calculated Gross Pay</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-medium">
                {formatCAD(calculatedGross)}
              </div>
            </div>
          </div>

          {hasEdits && (
            <div>
              <Label htmlFor={`note-${timesheet.id}`} className="text-xs">
                Adjustment Note <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`note-${timesheet.id}`}
                placeholder="Explain the reason for adjustment..."
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {hasEdits && (
              <Button
                size="sm"
                onClick={handleSaveAndApprove}
                disabled={!adjustmentNote.trim() || isUpdating}
              >
                {isUpdating ? "Saving…" : "Save & Approve"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveAsIs}
              disabled={isUpdating}
            >
              {isUpdating ? "Approving…" : "Approve As-Is"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
};