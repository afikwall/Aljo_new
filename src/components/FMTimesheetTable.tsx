import { Fragment } from "react";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface FMTimesheetRow {
  shiftId: string;
  date: string;
  staffName: string;
  shiftStart: string;
  shiftEnd: string;
  timeLogId?: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakMinutes?: number;
  totalHours?: number;
}

interface FMTimesheetTableProps {
  rows: FMTimesheetRow[];
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

export const FMTimesheetTable = ({ rows, isLoading }: FMTimesheetTableProps) => {
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
  const groupedByDate: { dateKey: string; dateLabel: string; rows: FMTimesheetRow[] }[] = [];
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
                  <TableCell colSpan={7} className="py-2 px-4">
                    <span className="font-bold text-sm text-foreground">{dateLabel}</span>
                  </TableCell>
                </TableRow>

                {/* Shift rows for this day */}
                {dayRows.map((row) => (
                  <TableRow
                    key={row.shiftId}
                    className="border-b hover:bg-muted/30 text-sm"
                  >
                    <TableCell className="py-3">{row.staffName}</TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {formatTime(row.shiftStart)}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {formatTime(row.shiftEnd)}
                    </TableCell>
                    <TableCell className="py-3">
                      {formatTime(row.clockInTime)}
                    </TableCell>
                    <TableCell className="py-3">
                      {formatTime(row.clockOutTime)}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {row.timeLogId
                        ? row.breakMinutes !== undefined && row.breakMinutes !== null
                          ? `${row.breakMinutes} min`
                          : "0 min"
                        : "—"}
                    </TableCell>
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
                  </TableRow>
                ))}

                {/* Day subtotal row */}
                <TableRow className="border-b bg-background">
                  <TableCell colSpan={7} className="py-2 px-4 text-right">
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