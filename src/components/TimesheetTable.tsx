import { Fragment, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Check, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffUpdateTimeLogAction } from "@/product-types";

interface TimesheetRow {
  shiftId: string;
  date: string;
  facilityName: string;
  shiftStart: string;
  shiftEnd: string;
  timeLogId?: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakMinutes?: number;
  totalHours?: number;
  isApproved?: boolean;
}

interface TimesheetTableProps {
  rows: TimesheetRow[];
  isLoading: boolean;
  onTimeLogUpdated: () => void;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "h:mm a");
  } catch {
    return "—";
  }
}

function toDatetimeLocalValue(isoString?: string): string {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

function calcNetHours(clockIn: string, clockOut: string, breakMinutes: number): number {
  try {
    const inTime = parseISO(clockIn).getTime();
    const outTime = parseISO(clockOut).getTime();
    const diffMs = outTime - inTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakHours = (breakMinutes || 0) / 60;
    return Math.round((diffHours - breakHours) * 100) / 100;
  } catch {
    return 0;
  }
}

interface EditState {
  clockIn: string;
  clockOut: string;
  error?: string;
}

export const TimesheetTable = ({ rows, isLoading, onTimeLogUpdated }: TimesheetTableProps) => {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ clockIn: "", clockOut: "" });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [localHours, setLocalHours] = useState<Record<string, number>>({});

  const { executeFunction: updateTimeLog } = useExecuteAction(StaffUpdateTimeLogAction);

  const handleEdit = (row: TimesheetRow) => {
    // Lock guard: never enter edit mode for approved rows
    if (row.isApproved === true) return;
    setEditingRowId(row.shiftId);
    setEditState({
      clockIn: toDatetimeLocalValue(row.clockInTime),
      clockOut: toDatetimeLocalValue(row.clockOutTime),
    });
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setEditState({ clockIn: "", clockOut: "" });
  };

  const handleSave = async (row: TimesheetRow) => {
    if (!row.timeLogId) return;
    // Lock guard: never save for approved rows
    if (row.isApproved === true) return;

    const clockInISO = editState.clockIn ? new Date(editState.clockIn).toISOString() : "";
    const clockOutISO = editState.clockOut ? new Date(editState.clockOut).toISOString() : "";

    if (!clockInISO || !clockOutISO) {
      setEditState((prev) => ({ ...prev, error: "Both clock in and clock out times are required." }));
      return;
    }

    if (new Date(clockOutISO) <= new Date(clockInISO)) {
      setEditState((prev) => ({ ...prev, error: "Clock out time must be after clock in time." }));
      return;
    }

    setSavingId(row.shiftId);
    try {
      await updateTimeLog({
        timeLogId: row.timeLogId,
        clockInTime: clockInISO,
        clockOutTime: clockOutISO,
      });

      const newNet = calcNetHours(clockInISO, clockOutISO, row.breakMinutes || 0);
      setLocalHours((prev) => ({ ...prev, [row.shiftId]: newNet }));

      setEditingRowId(null);
      setEditState({ clockIn: "", clockOut: "" });
      toast.success("Time log updated successfully.");
      onTimeLogUpdated();
    } catch {
      toast.error("Failed to update time log. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  // Group rows by date (YYYY-MM-DD)
  const groupedByDate: { dateKey: string; dateLabel: string; rows: TimesheetRow[] }[] = [];
  const seenDates: Record<string, number> = {};

  for (const row of rows) {
    let dateKey = "";
    let dateLabel = "";
    try {
      dateKey = format(parseISO(row.date), "yyyy-MM-dd");
      dateLabel = format(parseISO(row.date), "EEEE, MMMM d");
    } catch {
      dateKey = row.date ?? "unknown";
      dateLabel = row.date ?? "Unknown Date";
    }

    if (seenDates[dateKey] === undefined) {
      seenDates[dateKey] = groupedByDate.length;
      groupedByDate.push({ dateKey, dateLabel, rows: [] });
    }
    groupedByDate[seenDates[dateKey]].rows.push(row);
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[140px]">
              Facility
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Shift Start
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Shift End
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[110px]">
              Clock In
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[110px]">
              Clock Out
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[80px]">
              Break
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Net Hours
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedByDate.map(({ dateKey, dateLabel, rows: dayRows }) => {
            const dayTotal = dayRows.reduce((sum, row) => {
              if (!row.timeLogId) return sum;
              const hrs = localHours[row.shiftId] !== undefined
                ? localHours[row.shiftId]
                : (row.totalHours ?? 0);
              return sum + hrs;
            }, 0);

            return (
              <Fragment key={dateKey}>
                {/* Day header row */}
                <TableRow className="bg-muted/50 border-b-0">
                  <TableCell colSpan={8} className="py-2 px-4">
                    <span className="font-bold text-sm text-foreground">{dateLabel}</span>
                  </TableCell>
                </TableRow>

                {/* Shift rows for this day */}
                {dayRows.map((row) => {
                  const isEditing = editingRowId === row.shiftId;
                  const isSavingThis = savingId === row.shiftId;
                  const isApproved = row.isApproved === true;
                  const netHours = localHours[row.shiftId] !== undefined
                    ? localHours[row.shiftId]
                    : row.totalHours;

                  return (
                    <TableRow
                      key={row.shiftId}
                      className={cn(
                        "group border-b hover:bg-muted/30 text-sm",
                        isEditing && !isApproved && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <TableCell className="py-3">{row.facilityName}</TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatTime(row.shiftStart)}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatTime(row.shiftEnd)}
                      </TableCell>

                      {/* Clock In — always read-only for approved rows */}
                      <TableCell className="py-3">
                        {isEditing && !isApproved ? (
                          <input
                            type="datetime-local"
                            className="h-11 rounded border border-input bg-background px-2 text-sm w-full"
                            value={editState.clockIn}
                            onChange={(e) =>
                              setEditState((prev) => ({ ...prev, clockIn: e.target.value, error: undefined }))
                            }
                          />
                        ) : (
                          <span>{formatTime(row.clockInTime)}</span>
                        )}
                      </TableCell>

                      {/* Clock Out — always read-only for approved rows */}
                      <TableCell className="py-3">
                        {isEditing && !isApproved ? (
                          <input
                            type="datetime-local"
                            className="h-11 rounded border border-input bg-background px-2 text-sm w-full"
                            value={editState.clockOut}
                            onChange={(e) =>
                              setEditState((prev) => ({ ...prev, clockOut: e.target.value, error: undefined }))
                            }
                          />
                        ) : (
                          formatTime(row.clockOutTime)
                        )}
                      </TableCell>

                      {/* Break */}
                      <TableCell className="py-3 text-muted-foreground">
                        {row.timeLogId
                          ? row.breakMinutes !== undefined && row.breakMinutes !== null
                            ? `${row.breakMinutes} min`
                            : "0 min"
                          : "—"}
                      </TableCell>

                      {/* Net Hours */}
                      <TableCell className="py-3">
                        {row.timeLogId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-accent font-medium">
                              {netHours !== undefined && netHours !== null
                                ? `${netHours} hrs`
                                : "—"}
                            </span>
                            {isApproved && (
                              <Badge className="gap-1 text-xs bg-accent/20 text-accent border-0 pointer-events-none">
                                <Lock className="size-3" />
                                Approved
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Actions — hide edit pencil for approved rows */}
                      <TableCell className="py-3">
                        {isApproved ? null : isEditing ? (
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col gap-1">
                              {editState.error && (
                                <p className="text-xs text-destructive max-w-[180px]">{editState.error}</p>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => handleSave(row)}
                                  disabled={isSavingThis}
                                >
                                  {isSavingThis ? "Saving..." : (
                                    <>
                                      <Check className="size-3 mr-1" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={handleCancel}
                                  disabled={isSavingThis}
                                >
                                  <X className="size-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : row.timeLogId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit(row)}
                            disabled={editingRowId !== null}
                            aria-label="Edit time log"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Day subtotal row */}
                <TableRow className="border-b bg-background">
                  <TableCell colSpan={8} className="py-2 px-4 text-right">
                    <span className="text-sm text-accent font-medium">
                      Day Total: {Math.round(dayTotal * 10) / 10} hrs
                    </span>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};