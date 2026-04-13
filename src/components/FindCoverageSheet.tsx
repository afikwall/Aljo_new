import { useState, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  Gift,
  MapPin,
  Clock,
  Loader2,
  Users,
  User,
} from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import type { IShiftsEntity, IFacilitiesEntity } from "@/product-types";
import { formatShiftLabel, getRoleBadgeColor } from "@/utils/tradeUtils";

interface FindCoverageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: (IShiftsEntity & { id?: string }) | null;
  facility: (IFacilitiesEntity & { id?: string }) | null;
  /** Other upcoming approved shifts this staff can offer in exchange */
  otherShifts: Array<{
    shift: IShiftsEntity & { id?: string };
    facility: (IFacilitiesEntity & { id?: string }) | null;
  }>;
  isSubmitting: boolean;
  onSubmit: (data: {
    requestType: "trade" | "giveaway";
    offeredShiftId?: string;
    targetStaffEmail?: string;
    reason?: string;
    sendToAll: boolean;
  }) => void;
}

export const FindCoverageSheet = ({
  open,
  onOpenChange,
  shift,
  facility,
  otherShifts,
  isSubmitting,
  onSubmit,
}: FindCoverageSheetProps) => {
  const [requestType, setRequestType] = useState<"trade" | "giveaway">("trade");
  const [offeredShiftId, setOfferedShiftId] = useState<string>("");
  const [sendTo, setSendTo] = useState<"all" | "specific">("all");
  const [targetEmail, setTargetEmail] = useState("");
  const [reason, setReason] = useState("");

  const resetForm = useCallback(() => {
    setRequestType("trade");
    setOfferedShiftId("");
    setSendTo("all");
    setTargetEmail("");
    setReason("");
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, resetForm]
  );

  const shiftDuration = useMemo(() => {
    if (!shift?.startDateTime || !shift?.endDateTime) return 0;
    try {
      return differenceInHours(parseISO(shift.endDateTime), parseISO(shift.startDateTime));
    } catch {
      return 0;
    }
  }, [shift?.startDateTime, shift?.endDateTime]);

  const offeredShiftOptions = useMemo(() => {
    return otherShifts.map(({ shift: s, facility: f }) => ({
      id: s.id || "",
      label: formatShiftLabel(f?.name, s.startDateTime, s.endDateTime, s.requiredRole),
    }));
  }, [otherShifts]);

  const handleSubmit = useCallback(() => {
    onSubmit({
      requestType,
      offeredShiftId: requestType === "trade" ? offeredShiftId || undefined : undefined,
      targetStaffEmail: sendTo === "specific" ? targetEmail || undefined : undefined,
      reason: reason.trim() || undefined,
      sendToAll: sendTo === "all",
    });
  }, [requestType, offeredShiftId, sendTo, targetEmail, reason, onSubmit]);

  const canSubmit = useMemo(() => {
    if (requestType === "trade" && !offeredShiftId) return false;
    if (sendTo === "specific" && !targetEmail.trim()) return false;
    return true;
  }, [requestType, offeredShiftId, sendTo, targetEmail]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <ArrowLeftRight className="h-5 w-5" />
            Find Coverage
          </SheetTitle>
          <SheetDescription className="sr-only">
            Request a trade or giveaway for your shift
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Shift summary */}
          {shift && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="font-medium text-sm">
                  {facility?.name || "Unknown Facility"}
                </p>
              </div>
              {shift.startDateTime && shift.endDateTime && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(shift.startDateTime), "EEE, MMM d • h:mm a")} –{" "}
                    {format(parseISO(shift.endDateTime), "h:mm a")}{" "}
                    <span className="text-muted-foreground/70">({shiftDuration}h)</span>
                  </p>
                </div>
              )}
              {shift.requiredRole && (
                <Badge className={getRoleBadgeColor(shift.requiredRole)}>
                  {shift.requiredRole}
                </Badge>
              )}
            </div>
          )}

          {/* Request type toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Request Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestType("trade")}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 h-12 transition-all",
                  requestType === "trade"
                    ? "border-chart-1 bg-chart-1/10 text-chart-1"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="font-medium text-sm">Trade</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequestType("giveaway");
                  setOfferedShiftId("");
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 h-12 transition-all",
                  requestType === "giveaway"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span className="font-medium text-sm">Give Away</span>
                </div>
              </button>
            </div>
          </div>

          {/* Offered shift selector (trade only) */}
          {requestType === "trade" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Offer one of your shifts in exchange
              </Label>
              {offeredShiftOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    You have no other shifts to offer — try Give Away instead.
                  </p>
                </div>
              ) : (
                <Select value={offeredShiftId} onValueChange={setOfferedShiftId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shift to offer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {offeredShiftOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Send to */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Send To</Label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSendTo("all")}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg border p-3 transition-all",
                  sendTo === "all"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Users className={cn("h-4 w-4", sendTo === "all" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", sendTo === "all" ? "text-foreground" : "text-muted-foreground")}>
                  All eligible staff
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSendTo("specific")}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg border p-3 transition-all",
                  sendTo === "specific"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <User className={cn("h-4 w-4", sendTo === "specific" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", sendTo === "specific" ? "text-foreground" : "text-muted-foreground")}>
                  Specific staff member
                </span>
              </button>
            </div>
            {sendTo === "specific" && (
              <Input
                type="email"
                placeholder="Enter staff email..."
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
              />
            )}
          </div>

          {/* Reason / message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Message (optional)</Label>
            <Textarea
              placeholder="Add a reason or note for your request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="space-y-3 pb-6">
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Coverage"
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-11"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};