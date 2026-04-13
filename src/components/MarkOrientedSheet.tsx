import { useState, useMemo, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import type { IStaffProfilesEntity } from "@/product-types";

interface MarkOrientedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffProfiles: (IStaffProfilesEntity & { id: string })[];
  onSubmit: (data: {
    staffProfileId: string;
    orientationDate: Date;
    orientedBy: string;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const MarkOrientedSheet = ({
  open,
  onOpenChange,
  staffProfiles,
  onSubmit,
  isSubmitting,
}: MarkOrientedSheetProps) => {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [orientationDate, setOrientationDate] = useState<Date>(new Date());
  const [orientedBy, setOrientedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const getStaffDisplayName = useCallback(
    (staff: IStaffProfilesEntity): string => {
      if (staff.firstName && staff.lastName) {
        return `${staff.firstName} ${staff.lastName}`;
      }
      return staff.email || "Unknown";
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedStaffId || !orientedBy.trim()) return;

    await onSubmit({
      staffProfileId: selectedStaffId,
      orientationDate,
      orientedBy: orientedBy.trim(),
      notes: notes.trim(),
    });

    // Reset form on success
    setSelectedStaffId("");
    setOrientationDate(new Date());
    setOrientedBy("");
    setNotes("");
  }, [selectedStaffId, orientationDate, orientedBy, notes, onSubmit]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setOrientationDate(date);
      setDatePickerOpen(false);
    }
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setSelectedStaffId("");
        setOrientationDate(new Date());
        setOrientedBy("");
        setNotes("");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const isFormValid = selectedStaffId && orientedBy.trim();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl px-0">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle>Mark Staff as Oriented</SheetTitle>
          <SheetDescription>
            Record a staff member&apos;s orientation at your facility
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(85vh-160px)]">
          <div className="space-y-6 px-6 pb-6">
            {/* Staff Selector */}
            <div className="space-y-2">
              <Label htmlFor="staff-select">Select Staff Member</Label>
              <Select
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger id="staff-select" className="h-12 text-base">
                  <SelectValue placeholder="Choose a staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffProfiles.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <span>{getStaffDisplayName(staff)}</span>
                        {staff.roleType && (
                          <Badge
                            className={cn(
                              "rounded-full text-[10px] px-1.5 py-0",
                              getRoleBadgeColor(staff.roleType)
                            )}
                          >
                            {staff.roleType}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {staffProfiles.length === 0 && (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No pending orientation requests
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Orientation Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 text-base justify-start text-left font-normal",
                      !orientationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {orientationDate
                      ? format(orientationDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={orientationDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Oriented By */}
            <div className="space-y-2">
              <Label htmlFor="oriented-by">Conducted By</Label>
              <Input
                id="oriented-by"
                value={orientedBy}
                onChange={(e) => setOrientedBy(e.target.value)}
                placeholder="e.g. Jane Smith (Charge Nurse)"
                className="h-12 text-base"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="orientation-notes">Notes (Optional)</Label>
              <Textarea
                id="orientation-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes about this orientation..."
                className="min-h-[100px] text-base"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Submit Button - fixed at bottom */}
        <div className="px-6 pt-4 border-t">
          <Button
            className="w-full h-12 text-base"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Orientation"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};