import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Zap,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInHours } from "date-fns";
import {
  ROLE_BADGE_COLORS,
  STATUS_BADGE_COLORS,
} from "@/utils/shiftApplicationUtils";
import type { IShiftsEntity, IFacilitiesEntity } from "@/product-types";

interface ShiftDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: (IShiftsEntity & { id: string }) | null;
  facility: (IFacilitiesEntity & { id: string }) | null;
}

export const ShiftDetailSheet = ({
  open,
  onOpenChange,
  shift,
  facility,
}: ShiftDetailSheetProps) => {
  const formattedDate = shift?.startDateTime
    ? (() => {
        try {
          return format(parseISO(shift.startDateTime), "EEEE, MMMM d, yyyy");
        } catch {
          return "—";
        }
      })()
    : "—";

  const timeRange =
    shift?.startDateTime && shift?.endDateTime
      ? (() => {
          try {
            const start = parseISO(shift.startDateTime!);
            const end = parseISO(shift.endDateTime!);
            const hours = differenceInHours(end, start);
            return `${format(start, "h:mm a")} – ${format(end, "h:mm a")} (${hours} hours)`;
          } catch {
            return "—";
          }
        })()
      : "—";

  const statusLabel = shift?.status
    ? shift.status.charAt(0).toUpperCase() + shift.status.slice(1).replace("_", " ")
    : "Unknown";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Shift Details</SheetTitle>
          <SheetDescription>Full details for the selected shift</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 space-y-6 pb-24">
            {/* Facility name heading */}
            <h2 className="text-2xl font-bold">
              {facility?.name || "Unknown Facility"}
            </h2>

            <Separator />

            {/* Address */}
            {facility && (facility.address || facility.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {[facility.address, facility.city, facility.province]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            {/* Time range with duration */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">{timeRange}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {shift?.requiredRole && (
                <Badge
                  className={cn(
                    "rounded-full text-xs px-3 py-1",
                    ROLE_BADGE_COLORS[shift.requiredRole] ||
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {shift.requiredRole}
                </Badge>
              )}
              {shift?.isShortNotice && (
                <Badge className="rounded-full text-xs px-3 py-1 bg-chart-3/20 text-chart-3">
                  <Zap className="h-3 w-3 mr-1" />
                  Short Notice
                </Badge>
              )}
              {shift?.status && (
                <Badge
                  className={cn(
                    "rounded-full text-xs px-3 py-1",
                    STATUS_BADGE_COLORS[shift.status] ||
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {statusLabel}
                </Badge>
              )}
            </div>

            {/* Shift notes */}
            {shift?.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Shift Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {shift.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t p-4 md:p-6">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};