import { Fragment, useState } from "react";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Check, X, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { TimeLogsEntity } from "@/product-types";
import { cn } from "@/lib/utils";

export interface AdminTimesheetRow {
  shiftId: string;
  date: string;
  staffName: string;
  staffRole: string;
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

interface AdminTimesheetTableProps {
  rows: AdminTimesheetRow[];
  isLoading: boolean;
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
    const d = parseISO(isoString);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function calculateBreak(grossHours: number): number {
  if (grossHours >= 11) return 60;
  if (grossHours >= 7.5) return 30;
  if (grossHours >= 5) return 15;
  return 0;
}

interface EditRowState {
  clockIn: string;
  clockOut: string;
}

export const AdminTimesheetTable = ({ rows, isLoading }: AdminTimesheetTableProps) => {
  const { updateFunction, isLoading: isSaving } = useEntityUpdate(TimeLogsEntity);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditRowState>({ clockIn: "", clockOut: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  // Per-row approval loading state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  const handleEdit = (row: AdminTimesheetRow) => {
    if (!row.timeLogId) return;
    // Lock guard: never enter edit mode for approved rows
    if (row.isApproved === true) return;
    setEditingId(row.timeLogId);
    setEditValues({
      clockIn: toDatetimeLocalValue(row.clockInTime),
      clockOut: toDatetimeLocalValue(row.clockOutTime),
    });
    setValidationError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setValidationError(null);
  };

  const handleSave = async (row: AdminTimesheetRow) => {
    if (!row.timeLogId) return;
    // Lock guard: never save for approved rows
    if (row.isApproved === true) return;

    const clockInDate = new Date(editValues.clockIn);
    const clockOutDate = new Date(editValues.clockOut);

    if (!editValues.clockIn || !editValues.clockOut) {
      setValidationError("Both clock in and clock out are required.");
      return;
    }
    if (clockOutDate <= clockInDate) {
      setValidationError("Clock out must be after clock in.");
      return;
    }

    const grossHours = (clockOutDate.getTime() - clockInDate.getTime()) / 3600000;
    const breakMins = calculateBreak(grossHours);
    const netHours = Math.max(0, grossHours - breakMins / 60);
    const totalHoursRounded = Math.round(netHours * 100) / 100;

    try {
      await updateFunction({
        id: row.timeLogId,
        data: {
          clockInTime: clockInDate.toISOString(),
          clockOutTime: clockOutDate.toISOString(),
          breakMinutes: breakMins,
          totalHours: totalHoursRounded,
          adminAdjusted: true,
        },
      });
      toast.success("Time log updated successfully.");
      setEditingId(null);
      setValidationError(null);
    } catch {
      toast.error("Failed to save changes. Please try again.");
    }
  };

  const handleApprove = async (row: AdminTimesheetRow) => {
    if (!row.timeLogId) return;
    setApprovingId(row.timeLogId);
    try {
      await updateFunction({
        id: row.timeLogId,
        data: { isApproved: true },
      });
      toast.success("Time log approved and locked.");
    } catch {
      toast.error("Failed to approve. Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  // Group rows by date (YYYY-MM-DD)
  const groupedByDate: { dateKey: string; dateLabel: string; rows: AdminTimesheetRow[] }[] = [];
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
              Staff
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[120px]">
              Facility
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Shift Start
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Shift End
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[130px]">
              Clock In
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[130px]">
              Clock Out
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[80px]">
              Break
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Net Hours
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[110px]">
              Approve
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-[80px]">
              Edit
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedByDate.map(({ dateKey, dateLabel, rows: dayRows }) => {
            const dayTotal = dayRows.reduce((sum, row) => {
              if (!row.timeLogId) return sum;
              return sum + (row.totalHours ?? 0);
            }, 0);

            return (
              <Fragment key={dateKey}>
                {/* Day header row */}
                <TableRow className="bg-muted/50 border-b-0">
                  <TableCell colSpan={10} className="py-2 px-4">
                    <span className="font-bold text-sm text-foreground">{dateLabel}</span>
                  </TableCell>
                </TableRow>

                {/* Shift rows for this day */}
                {dayRows.map((row) => {
                  const isEditing = editingId === row.timeLogId && !!row.timeLogId;
                  const isApproved = row.isApproved === true;
                  const isApprovingThis = approvingId === row.timeLogId;

                  return (
                    <TableRow
                      key={row.shiftId}
                      className={cn(
                        "border-b hover:bg-muted/30 text-sm",
                        isApproved && "bg-accent/5"
                      )}
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{row.staffName}</span>
                          <span className="text-xs text-muted-foreground">{row.staffRole}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {row.facilityName}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatTime(row.shiftStart)}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatTime(row.shiftEnd)}
                      </TableCell>

                      {/* Clock In */}
                      <TableCell className="py-3">
                        {isEditing && !isApproved ? (
                          <Input
                            type="datetime-local"
                            value={editValues.clockIn}
                            onChange={(e) => {
                              setEditValues((v) => ({ ...v, clockIn: e.target.value }));
                              setValidationError(null);
                            }}
                            className="h-8 text-xs w-44"
                          />
                        ) : (
                          formatTime(row.clockInTime)
                        )}
                      </TableCell>

                      {/* Clock Out */}
                      <TableCell className="py-3">
                        {isEditing && !isApproved ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              type="datetime-local"
                              value={editValues.clockOut}
                              onChange={(e) => {
                                setEditValues((v) => ({ ...v, clockOut: e.target.value }));
                                setValidationError(null);
                              }}
                              className="h-8 text-xs w-44"
                            />
                            {validationError && (
                              <p className="text-xs text-destructive">{validationError}</p>
                            )}
                          </div>
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
                          <span className="text-accent font-medium">
                            {row.totalHours !== undefined && row.totalHours !== null
                              ? `${row.totalHours} hrs`
                              : "—"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Approve column */}
                      <TableCell className="py-3">
                        {!row.timeLogId ? null : isApproved ? (
                          <Badge className="gap-1 text-xs bg-accent/20 text-accent border-0 pointer-events-none">
                            <Lock className="size-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 border-accent text-accent hover:bg-accent/10"
                            onClick={() => handleApprove(row)}
                            disabled={isApprovingThis || isSaving}
                            aria-label="Approve time log"
                          >
                            {isApprovingThis ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="size-3" />
                            )}
                            Approve
                          </Button>
                        )}
                      </TableCell>

                      {/* Edit controls */}
                      <TableCell className="py-3">
                        {isApproved || !row.timeLogId ? null : isEditing ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={() => handleSave(row)}
                              disabled={isSaving}
                              aria-label="Save"
                            >
                              <Check className="size-4 text-accent" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={handleCancel}
                              disabled={isSaving}
                              aria-label="Cancel"
                            >
                              <X className="size-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => handleEdit(row)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Day subtotal row */}
                <TableRow className="border-b bg-background">
                  <TableCell colSpan={10} className="py-2 px-4 text-right">
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