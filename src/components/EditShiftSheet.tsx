import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  CalendarIcon,
  AlertTriangle,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  formatShiftDateTime,
  getShiftDurationHours,
  getStatusBadgeColor,
  getRoleBadgeColor,
  formatStatusLabel,
  isShiftEditable,
  getTimeInputValue,
  combineDateAndTime,
} from "@/utils/shiftUtils";
import type { IFacilitiesEntity, IShiftsEntity } from "@/product-types";

type ShiftWithId = IShiftsEntity & { id: string };

interface EditShiftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftWithId | null;
  facility: (IFacilitiesEntity & { id: string }) | null;
  onSave: (shiftId: string, data: Partial<IShiftsEntity>) => Promise<void>;
  onCancel: (shiftId: string) => Promise<void>;
  isSaving: boolean;
  isCancelling: boolean;
}

export const EditShiftSheet = ({
  open,
  onOpenChange,
  shift,
  facility,
  onSave,
  onCancel,
  isSaving,
  isCancelling,
}: EditShiftSheetProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("");
  const [requiredRole, setRequiredRole] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [notes, setNotes] = useState("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Initialize form values when shift changes
  useEffect(() => {
    if (shift) {
      if (shift.startDateTime) {
        try {
          setStartDate(parseISO(shift.startDateTime));
          setStartTime(getTimeInputValue(shift.startDateTime));
        } catch {
          setStartDate(undefined);
          setStartTime("");
        }
      }
      if (shift.endDateTime) {
        try {
          setEndDate(parseISO(shift.endDateTime));
          setEndTime(getTimeInputValue(shift.endDateTime));
        } catch {
          setEndDate(undefined);
          setEndTime("");
        }
      }
      setRequiredRole(shift.requiredRole || "");
      setHeadcount(shift.headcount || 1);
      setNotes(shift.notes || "");
    }
  }, [shift]);

  const editable = useMemo(() => isShiftEditable(shift?.status), [shift?.status]);

  const duration = useMemo(() => {
    return getShiftDurationHours(shift?.startDateTime, shift?.endDateTime);
  }, [shift?.startDateTime, shift?.endDateTime]);

  const fullAddress = useMemo(() => {
    if (!facility) return "";
    const parts = [facility.address, facility.city, facility.province].filter(Boolean);
    return parts.join(", ");
  }, [facility]);

  const handleSave = useCallback(async () => {
    if (!shift) return;

    const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : "";
    const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : "";

    const newStartDateTime = combineDateAndTime(startDateStr, startTime);
    const newEndDateTime = combineDateAndTime(endDateStr, endTime);

    if (!newStartDateTime || !newEndDateTime) {
      toast.error("Please fill in all date and time fields.");
      return;
    }

    await onSave(shift.id, {
      startDateTime: newStartDateTime,
      endDateTime: newEndDateTime,
      requiredRole: requiredRole as IShiftsEntity["requiredRole"],
      headcount,
      notes: notes || undefined,
    });
  }, [shift, startDate, startTime, endDate, endTime, requiredRole, headcount, notes, onSave]);

  const handleCancel = useCallback(async () => {
    if (!shift) return;
    await onCancel(shift.id);
  }, [shift, onCancel]);

  const handleDecrementHeadcount = useCallback(() => {
    setHeadcount((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncrementHeadcount = useCallback(() => {
    setHeadcount((prev) => Math.min(20, prev + 1));
  }, []);

  if (!shift) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md flex flex-col p-0"
      >
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Shift Details</SheetTitle>
          <SheetDescription>
            {editable ? "View and edit shift information" : "View shift information"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Read-only summary */}
            <div className="space-y-3 pt-4">
              <h3 className="font-semibold text-base">{facility?.name || "Facility"}</h3>
              {fullAddress && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fullAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span>{formatShiftDateTime(shift.startDateTime, shift.endDateTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{duration} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("rounded-full", getRoleBadgeColor(shift.requiredRole))}>
                  {shift.requiredRole}
                </Badge>
                <Badge className={cn("rounded-full", getStatusBadgeColor(shift.status))}>
                  {formatStatusLabel(shift.status)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Non-editable notice */}
            {!editable && (
              <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  This shift cannot be edited because its status is{" "}
                  <span className="font-medium">{formatStatusLabel(shift.status)}</span>.
                </p>
              </div>
            )}

            {/* Edit form */}
            {editable && (
              <div className="space-y-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setStartDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setEndDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10"
                  />
                </div>

                {/* Required Role */}
                <div className="space-y-2">
                  <Label>Required Role</Label>
                  <Select value={requiredRole} onValueChange={setRequiredRole}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RN">RN</SelectItem>
                      <SelectItem value="LPN">LPN</SelectItem>
                      <SelectItem value="CCA">CCA</SelectItem>
                      <SelectItem value="CITR">CITR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Headcount */}
                <div className="space-y-2">
                  <Label>Headcount</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={handleDecrementHeadcount}
                      disabled={headcount <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={headcount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= 20) {
                          setHeadcount(val);
                        }
                      }}
                      className="h-10 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={handleIncrementHeadcount}
                      disabled={headcount >= 20}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions for this shift..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <SheetFooter className="p-6 pt-4 border-t flex-col gap-2 sm:flex-col">
          {editable && (
            <>
              <div className="flex items-center gap-2 w-full">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-1">
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Cancel Shift
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this shift?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel the shift and it cannot be undone. Any assigned staff will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Go Back</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Cancel Shift
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};