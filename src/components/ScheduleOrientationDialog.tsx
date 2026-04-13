import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { IOrientationsEntity } from "@/product-types";

interface ScheduleOrientationDialogProps {
  orientation: (IOrientationsEntity & { id: string }) | null;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    orientationId: string;
    staffProfileId: string;
    date: Date;
    startTime: string;
    endTime: string;
    conductedBy: string;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ScheduleOrientationDialog = ({
  orientation,
  staffName,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ScheduleOrientationDialogProps) => {
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [conductedBy, setConductedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const resetForm = useCallback(() => {
    setScheduleDate(undefined);
    setStartTime("09:00");
    setEndTime("11:00");
    setConductedBy("");
    setNotes("");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm]
  );

  const handleSubmit = useCallback(async () => {
    if (!orientation || !scheduleDate || !startTime || !endTime || !conductedBy.trim()) return;

    await onSubmit({
      orientationId: orientation.id,
      staffProfileId: orientation.staffProfileId || "",
      date: scheduleDate,
      startTime,
      endTime,
      conductedBy: conductedBy.trim(),
      notes: notes.trim(),
    });

    resetForm();
  }, [orientation, scheduleDate, startTime, endTime, conductedBy, notes, onSubmit, resetForm]);

  const isFormValid =
    !!scheduleDate && !!startTime && !!endTime && !!conductedBy.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Orientation</DialogTitle>
          <DialogDescription>
            Schedule an orientation session for {staffName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date Picker */}
          <div className="grid gap-2">
            <Label htmlFor="schedule-date">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="schedule-date"
                  variant="outline"
                  className={cn(
                    "h-10 w-full justify-start text-left font-normal",
                    !scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduleDate ? format(scheduleDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={(date) => {
                    setScheduleDate(date);
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start Time */}
          <div className="grid gap-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 text-base"
            />
          </div>

          {/* End Time */}
          <div className="grid gap-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10 text-base"
            />
          </div>

          {/* Conducted By */}
          <div className="grid gap-2">
            <Label htmlFor="conducted-by">Conducted by</Label>
            <Input
              id="conducted-by"
              placeholder="e.g. Charge Nurse Jane"
              value={conductedBy}
              onChange={(e) => setConductedBy(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="schedule-notes">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="schedule-notes"
              placeholder="Any special instructions or areas to cover..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Orientation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};