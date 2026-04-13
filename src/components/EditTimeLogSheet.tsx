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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { TimeLogsEntity } from "@/product-types";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { type LineItemForDisplay, formatShiftDate, formatTime } from "@/utils/invoiceUtils";

interface EditTimeLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItemForDisplay | null;
  onSaved: () => void;
}

export const EditTimeLogSheet = ({
  open,
  onOpenChange,
  item,
  onSaved,
}: EditTimeLogSheetProps) => {
  const { updateFunction, isLoading } = useEntityUpdate(TimeLogsEntity);

  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [breakMins, setBreakMins] = useState(0);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<{
    grossHours: number;
    netHours: number;
  } | null>(null);

  // Reset form when item changes
  useMemo(() => {
    if (item) {
      try {
        setClockIn(
          item.clockInTime
            ? format(parseISO(item.clockInTime), "yyyy-MM-dd'T'HH:mm")
            : ""
        );
        setClockOut(
          item.clockOutTime
            ? format(parseISO(item.clockOutTime), "yyyy-MM-dd'T'HH:mm")
            : ""
        );
        setBreakMins(item.breakMinutes || 0);
        setNotes("");
        setPreview(null);
      } catch {
        setClockIn("");
        setClockOut("");
        setBreakMins(0);
        setNotes("");
        setPreview(null);
      }
    }
  }, [item]);

  const handleRecalculate = useCallback(() => {
    if (!clockIn || !clockOut) {
      toast.error("Please enter both clock in and clock out times");
      return;
    }
    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      const totalMinutes = differenceInMinutes(end, start);
      if (totalMinutes <= 0) {
        toast.error("Clock out must be after clock in");
        return;
      }
      const grossHours = Math.round((totalMinutes / 60) * 100) / 100;
      const netHours = Math.round((grossHours - breakMins / 60) * 100) / 100;
      setPreview({ grossHours, netHours: Math.max(0, netHours) });
    } catch {
      toast.error("Invalid date/time values");
    }
  }, [clockIn, clockOut, breakMins]);

  const handleSave = useCallback(async () => {
    if (!item) return;
    if (!notes.trim()) {
      toast.error("Adjustment notes are required when making changes");
      return;
    }
    if (!clockIn || !clockOut) {
      toast.error("Please enter both clock in and clock out times");
      return;
    }

    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      const totalMinutes = differenceInMinutes(end, start);
      if (totalMinutes <= 0) {
        toast.error("Clock out must be after clock in");
        return;
      }
      const grossHours = Math.round((totalMinutes / 60) * 100) / 100;
      const netHours = Math.max(
        0,
        Math.round((grossHours - breakMins / 60) * 100) / 100
      );

      await updateFunction({
        id: item.timeLogId,
        data: {
          clockInTime: new Date(clockIn).toISOString(),
          clockOutTime: new Date(clockOut).toISOString(),
          breakMinutes: breakMins,
          totalHours: netHours,
          adminAdjusted: true,
          adjustmentNotes: notes.trim(),
        },
      });

      toast.success("Time log updated successfully");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error("Failed to update time log");
    }
  }, [item, clockIn, clockOut, breakMins, notes, updateFunction, onOpenChange, onSaved]);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Time Log</SheetTitle>
          <SheetDescription>
            {item.staffName} — {formatShiftDate(item.shiftDate)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Original Values */}
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Original Values
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Clock In:</span>{" "}
                {formatTime(item.clockInTime)}
              </div>
              <div>
                <span className="text-muted-foreground">Clock Out:</span>{" "}
                {formatTime(item.clockOutTime)}
              </div>
              <div>
                <span className="text-muted-foreground">Break:</span>{" "}
                {item.breakMinutes} min
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-clock-in">Clock In Time</Label>
              <Input
                id="edit-clock-in"
                type="datetime-local"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-clock-out">Clock Out Time</Label>
              <Input
                id="edit-clock-out"
                type="datetime-local"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-break">Break Minutes</Label>
              <div className="flex gap-2">
                {[0, 15, 30, 45].map((mins) => (
                  <Button
                    key={mins}
                    variant={breakMins === mins ? "default" : "outline"}
                    size="sm"
                    className="h-11 flex-1"
                    onClick={() => setBreakMins(mins)}
                  >
                    {mins} min
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">
                Adjustment Notes <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Required: Explain why this time log is being adjusted..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Recalculate Preview */}
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={handleRecalculate}
          >
            Recalculate Hours
          </Button>

          {preview && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Preview
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Gross Hours:</span>{" "}
                  <span className="font-medium">
                    {preview.grossHours.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Net Hours:</span>{" "}
                  <span className="font-medium">
                    {preview.netHours.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="h-12 flex-1"
              onClick={handleSave}
              disabled={isLoading || !notes.trim()}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};