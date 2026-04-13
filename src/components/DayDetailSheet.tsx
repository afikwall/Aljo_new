import { useState, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ban, ShieldAlert, CalendarX, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDayHeading,
  formatTimeRange,
  toDateKey,
  format,
} from "@/utils/calendarUtils";
import type {
  CalendarShiftEvent,
  CalendarHoliday,
  CalendarBlockedDate,
} from "@/utils/scheduleTypes";

interface DayDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  shifts: CalendarShiftEvent[];
  holiday: CalendarHoliday | null;
  blockedRecords: CalendarBlockedDate[];
  onBlockSingle: (date: string) => Promise<void>;
  onBlockRange: (
    startDate: string,
    endDate: string,
    reason: string
  ) => Promise<void>;
  onUnblock: (ids: string[]) => Promise<void>;
  isBlocking: boolean;
}

export const DayDetailSheet = ({
  open,
  onOpenChange,
  selectedDate,
  shifts,
  holiday,
  blockedRecords,
  onBlockSingle,
  onBlockRange,
  onUnblock,
  isBlocking,
}: DayDetailSheetProps) => {
  const dateKey = selectedDate ? toDateKey(selectedDate) : "";

  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // Reset form when date changes
  useMemo(() => {
    if (selectedDate) {
      const key = toDateKey(selectedDate);
      setRangeStart(key);
      setRangeEnd(key);
      setBlockReason("");
    }
  }, [selectedDate]);

  const heading = selectedDate ? formatDayHeading(selectedDate) : "";
  const isBlocked = blockedRecords.length > 0;

  const handleBlockSingle = useCallback(async () => {
    if (!dateKey) return;
    await onBlockSingle(dateKey);
  }, [dateKey, onBlockSingle]);

  const handleBlockRange = useCallback(async () => {
    if (!rangeStart || !rangeEnd) return;
    await onBlockRange(rangeStart, rangeEnd, blockReason);
  }, [rangeStart, rangeEnd, blockReason, onBlockRange]);

  const handleUnblock = useCallback(async () => {
    const ids = blockedRecords.map((r) => r.id).filter(Boolean);
    if (ids.length === 0) return;
    await onUnblock(ids);
  }, [blockedRecords, onUnblock]);

  const statusBadge = useCallback((appStatus: string, shiftStatus: string) => {
    if (appStatus === "pending") {
      return <Badge className="bg-chart-1/20 text-chart-1 border-chart-1/30">Pending</Badge>;
    }
    if (shiftStatus === "completed") {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge className="bg-accent/20 text-accent border-accent/30">Upcoming</Badge>;
  }, []);

  if (!selectedDate) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-5">
            <SheetHeader>
              <SheetTitle>{heading}</SheetTitle>
              <SheetDescription>
                View shifts, holidays, and manage blocked dates
              </SheetDescription>
            </SheetHeader>

            {/* Holiday info */}
            {holiday && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-chart-3/10 border border-chart-3/20">
                <Sparkles className="h-4 w-4 text-chart-3 shrink-0" />
                <span className="text-sm font-medium">{holiday.name}</span>
                {holiday.multiplier && holiday.multiplier > 1 && (
                  <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 ml-auto">
                    {holiday.multiplier}x pay
                  </Badge>
                )}
              </div>
            )}

            {/* Shifts section */}
            {shifts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Shifts ({shifts.length})
                </h3>
                <div className="space-y-2">
                  {shifts.map((shift) => (
                    <div
                      key={shift.applicationId}
                      className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/50 bg-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">
                          {shift.facilityName}
                        </span>
                        {statusBadge(shift.applicationStatus, shift.shiftStatus)}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeRange(
                            shift.startDateTime,
                            shift.endDateTime
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {shift.requiredRole}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shifts.length === 0 && !isBlocked && !holiday && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No shifts or events on this day.
              </p>
            )}

            <Separator />

            {/* Blocked date info & unblock */}
            {isBlocked && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Ban className="h-4 w-4 text-destructive" />
                  Blocked Date
                </h3>
                {blockedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col gap-1 p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                  >
                    <span className="text-sm font-medium">
                      {record.startDate === record.endDate
                        ? format(new Date(record.startDate + "T00:00:00"), "MMM d, yyyy")
                        : `${format(new Date(record.startDate + "T00:00:00"), "MMM d")} – ${format(new Date(record.endDate + "T00:00:00"), "MMM d, yyyy")}`}
                    </span>
                    {record.reason && (
                      <span className="text-xs text-muted-foreground">
                        Reason: {record.reason}
                      </span>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30"
                  onClick={handleUnblock}
                  disabled={isBlocking}
                >
                  <CalendarX className="mr-2 h-4 w-4" />
                  {isBlocking ? "Unblocking..." : "Unblock This Day"}
                </Button>
              </div>
            )}

            {/* Block single day button */}
            {!isBlocked && (
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30"
                onClick={handleBlockSingle}
                disabled={isBlocking}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                {isBlocking ? "Blocking..." : "Block This Day"}
              </Button>
            )}

            <Separator />

            {/* Block a range section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Block a Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="range-start" className="text-xs">
                    Start Date
                  </Label>
                  <Input
                    id="range-start"
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="range-end" className="text-xs">
                    End Date
                  </Label>
                  <Input
                    id="range-end"
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="block-reason" className="text-xs">
                  Reason (optional)
                </Label>
                <Input
                  id="block-reason"
                  placeholder="e.g. Vacation, medical appointment"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleBlockRange}
                disabled={isBlocking || !rangeStart || !rangeEnd}
              >
                {isBlocking ? "Blocking..." : "Block Range"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};