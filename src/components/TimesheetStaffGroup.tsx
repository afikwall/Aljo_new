import { useState, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Wallet } from "lucide-react";
import { TimesheetRow } from "@/components/TimesheetRow";
import { type StaffTimesheetGroup, formatCAD } from "@/utils/timesheetUtils";
import type { IEarlyPayRequestsEntity, IBonusesEntity } from "@/product-types";

type EarlyPayRecord = IEarlyPayRequestsEntity & { id: string };
type BonusRecord = IBonusesEntity & { id: string };

interface TimesheetStaffGroupProps {
  group: StaffTimesheetGroup;
  onApprove: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  onSaveAndApprove: (
    id: string,
    data: { totalHours: number; hourlyRate: number; adjustmentNote: string }
  ) => Promise<void>;
  isUpdating: boolean;
  earlyPayRequests?: EarlyPayRecord[];
  bonuses?: BonusRecord[];
}

export const TimesheetStaffGroup = ({
  group,
  onApprove,
  onMarkPaid,
  onSaveAndApprove,
  isUpdating,
  earlyPayRequests,
  bonuses,
}: TimesheetStaffGroupProps) => {
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [isMarkingAllPaid, setIsMarkingAllPaid] = useState(false);

  const handleApprove = useCallback(
    (id: string) => onApprove(id),
    [onApprove]
  );

  const handleMarkPaid = useCallback(
    (id: string) => onMarkPaid(id),
    [onMarkPaid]
  );

  const handleSaveAndApprove = useCallback(
    (
      id: string,
      data: { totalHours: number; hourlyRate: number; adjustmentNote: string }
    ) => onSaveAndApprove(id, data),
    [onSaveAndApprove]
  );

  // Early pay chip: sourced from earlyPayRequests prop, filtered by staffProfileId and approved/paid status
  const earlyPayCount = useMemo(
    () =>
      (earlyPayRequests || []).filter(
        (ep) =>
          ep.staffProfileId === group.staffProfileId &&
          (ep.status === "approved" || ep.status === "paid")
      ).length,
    [earlyPayRequests, group.staffProfileId]
  );

  const earlyPayTotal = useMemo(
    () =>
      (earlyPayRequests || [])
        .filter(
          (ep) =>
            ep.staffProfileId === group.staffProfileId &&
            (ep.status === "approved" || ep.status === "paid")
        )
        .reduce((sum, ep) => sum + (ep.amountApproved ?? 0), 0),
    [earlyPayRequests, group.staffProfileId]
  );

  // Bonus chip: sourced from the Bonuses table, filtered by staffProfileId
  const staffBonuses = useMemo(
    () =>
      (bonuses || []).filter(
        (b) => b.staffProfileId === group.staffProfileId
      ),
    [bonuses, group.staffProfileId]
  );

  const bonusCount = useMemo(() => staffBonuses.length, [staffBonuses]);

  const bonusTotal = useMemo(
    () => staffBonuses.reduce((sum, b) => sum + (b.amount ?? 0), 0),
    [staffBonuses]
  );

  const pendingTimesheets = useMemo(
    () => group.timesheets.filter((ts) => ts.paymentStatus === "pending"),
    [group.timesheets]
  );

  const handleApproveAll = useCallback(async () => {
    if (pendingTimesheets.length === 0) return;
    setIsApprovingAll(true);
    try {
      for (const ts of pendingTimesheets) {
        await onApprove(ts.id);
      }
    } finally {
      setIsApprovingAll(false);
    }
  }, [pendingTimesheets, onApprove]);

  const approvedTimesheets = useMemo(
    () => group.timesheets.filter((ts) => ts.paymentStatus === "approved"),
    [group.timesheets]
  );

  const handleMarkAllPaid = useCallback(async () => {
    if (approvedTimesheets.length === 0) return;
    setIsMarkingAllPaid(true);
    try {
      for (const ts of approvedTimesheets) {
        await onMarkPaid(ts.id);
      }
    } finally {
      setIsMarkingAllPaid(false);
    }
  }, [approvedTimesheets, onMarkPaid]);

  return (
    <div className="border-b last:border-b-0">
      {/* Staff Header */}
      <div className="bg-muted/20">
      <div className="flex items-center gap-3 py-3 px-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs font-medium">
            {group.staffInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{group.staffName}</span>
          {group.staffRole && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {group.staffRole}
            </Badge>
          )}
        </div>
        {pendingTimesheets.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleApproveAll}
            disabled={isUpdating || isApprovingAll}
            className="shrink-0 h-7 px-2 text-xs gap-1"
          >
            {isApprovingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            {isApprovingAll ? "Approving…" : "Approve All"}
          </Button>
        )}
        {approvedTimesheets.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllPaid}
            disabled={isUpdating || isMarkingAllPaid}
            className="shrink-0 h-7 px-2 text-xs gap-1"
          >
            {isMarkingAllPaid ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wallet className="h-3.5 w-3.5" />
            )}
            {isMarkingAllPaid ? "Paying…" : "Mark All Paid"}
          </Button>
        )}
        <div className="text-right">
          <span className="font-bold text-sm tabular-nums">
            {formatCAD(group.subtotalGrossPay + bonusTotal - earlyPayTotal)}
          </span>
          <span className="text-xs text-muted-foreground ml-1">Net Pay</span>
        </div>
      </div>
      {/* Bonus & Deduction chips — dedicated full-width row */}
      {(bonusCount > 0 || earlyPayCount > 0) && (
        <div className="flex items-center gap-2 pb-2.5 px-2 pl-[52px]">
          {bonusCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-accent/20 text-accent rounded-full px-3 py-1">
              🎁 {bonusCount} {bonusCount === 1 ? "bonus" : "bonuses"} &bull; {formatCAD(bonusTotal)}
            </span>
          )}
          {earlyPayCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-chart-3/20 text-chart-3 rounded-full px-3 py-1">
              💸 {earlyPayCount} early pay &bull; {formatCAD(earlyPayTotal)}
            </span>
          )}
        </div>
      )}
      </div>

      {/* Timesheet Rows */}
      {group.timesheets.map((ts) => (
        <TimesheetRow
          key={ts.id}
          timesheet={ts}
          onApprove={handleApprove}
          onMarkPaid={handleMarkPaid}
          onSaveAndApprove={handleSaveAndApprove}
          isUpdating={isUpdating}
            earlyPayRequests={earlyPayRequests}
        />
      ))}
    </div>
  );
};