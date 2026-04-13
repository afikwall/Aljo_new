import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  formatCAD,
  groupLineItemsByDay,
  type DayGroup,
} from "@/utils/invoiceUtils";
import type { IGenerateInvoiceActionOutput } from "@/product-types";

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: IGenerateInvoiceActionOutput | null;
  facilityName: string;
  periodLabel: string;
  onConfirm: () => void;
  isConfirming: boolean;
}

export const InvoicePreviewModal = ({
  open,
  onOpenChange,
  previewData,
  facilityName,
  periodLabel,
  onConfirm,
  isConfirming,
}: InvoicePreviewModalProps) => {
  // Group line items by day
  const dayGroups: DayGroup[] = useMemo(() => {
    if (!previewData?.lineItems) return [];
    // Use dayGroups from action output if available, otherwise compute locally
    if (previewData.dayGroups && previewData.dayGroups.length > 0) {
      return previewData.dayGroups.map((dg) => ({
        date: dg.date || "",
        dayLabel: dg.dayLabel || "",
        items: ((dg.items as any[]) || []).map((item: any) => ({
          shiftId: item.shiftId || "",
          staffProfileId: item.staffProfileId,
          staffName: item.staffName,
          staffInitials: item.staffInitials,
          date: item.date,
          dayLabel: item.dayLabel,
          startTime: item.startTime,
          endTime: item.endTime,
          roleType: item.roleType,
          grossHours: item.grossHours,
          breakMinutes: item.breakMinutes,
          netHours: item.netHours || 0,
          billingRate: item.billingRate || 0,
          multiplier: item.multiplier,
          isShortNotice: item.isShortNotice,
          isHoliday: item.isHoliday,
          lineTotal: item.lineTotal || 0,
        })),
        daySubtotal: dg.daySubtotal || 0,
      }));
    }
    // Fallback: group from flat lineItems
    return groupLineItemsByDay(
      previewData.lineItems.map((item) => ({
        shiftId: item.shiftId,
        staffProfileId: item.staffProfileId,
        staffName: item.staffName,
        staffInitials: item.staffInitials,
        date: item.date,
        dayLabel: item.dayLabel,
        startTime: item.startTime,
        endTime: item.endTime,
        roleType: item.roleType,
        grossHours: item.grossHours,
        breakMinutes: item.breakMinutes,
        netHours: item.netHours,
        billingRate: item.billingRate,
        multiplier: item.multiplier,
        isShortNotice: item.isShortNotice,
        isHoliday: item.isHoliday,
        lineTotal: item.lineTotal,
      }))
    );
  }, [previewData]);

  if (!previewData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogDescription>
            {facilityName} — {periodLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          Invoice Number:{" "}
          <span className="font-mono font-medium text-foreground">
            {previewData.invoiceNumber}
          </span>
        </div>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="space-y-1">
            {/* Day-grouped line items */}
            {dayGroups.map((group) => (
              <div key={group.date}>
                {/* Day Header */}
                <div className="bg-muted/50 px-3 py-2 rounded-md mb-1">
                  <span className="text-sm font-semibold">{group.dayLabel}</span>
                </div>

                {/* Line Items Table Header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 px-3 py-1 text-xs text-muted-foreground font-medium">
                  <span>Staff</span>
                  <span>Role</span>
                  <span className="text-right">Hours</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Line Items */}
                {group.items.map((item, iIdx) => (
                  <div
                    key={`${group.date}-${iIdx}`}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 items-center px-3 py-1.5 text-sm"
                  >
                    {/* Staff Initials Badge */}
                    <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground min-w-[40px]">
                      {item.staffInitials || "?"}
                    </span>

                    {/* Role Badge */}
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={cn(
                          "text-xs",
                          getRoleBadgeColor(item.roleType)
                        )}
                      >
                        {item.roleType}
                      </Badge>
                      {item.isShortNotice && (
                        <Badge className="bg-chart-3/20 text-chart-3 text-[10px] px-1">SN</Badge>
                      )}
                      {item.isHoliday && (
                        <Badge className="bg-chart-4/20 text-chart-4 text-[10px] px-1">HOL</Badge>
                      )}
                    </div>

                    {/* Hours */}
                    <span className="text-right tabular-nums">
                      {item.netHours.toFixed(1)}
                    </span>

                    {/* Rate */}
                    <span className="text-right tabular-nums text-muted-foreground">
                      {formatCAD(item.billingRate)}
                    </span>

                    {/* Line Total */}
                    <span className="text-right font-medium tabular-nums">
                      {formatCAD(item.lineTotal)}
                    </span>
                  </div>
                ))}

                {/* Day Subtotal */}
                <div className="flex justify-end px-3 py-1.5 border-t border-border/50">
                  <span className="text-sm font-medium text-muted-foreground mr-2">
                    Day Subtotal:
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCAD(group.daySubtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator className="my-2" />

        {/* Invoice Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCAD(previewData.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              HST ({previewData.hstRate}%)
            </span>
            <span className="font-medium">
              {formatCAD(previewData.hstAmount)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-bold">{formatCAD(previewData.total)}</span>
          </div>
        </div>

        {/* HST Registration # placeholder */}
        <div className="rounded-lg border border-dashed p-3 mt-1">
          <p className="text-xs text-muted-foreground">
            HST Registration #:{" "}
            <span className="inline-block border-b border-dotted border-muted-foreground/40 min-w-[180px]">
              &nbsp;
            </span>
          </p>
        </div>

        {/* HST info note */}
        <p className="text-xs text-muted-foreground italic">
          HST (14%) applies to facility billing only.
        </p>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="outline"
            className="h-12"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            className="h-12 w-full sm:w-auto"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Generating..." : "Confirm & Generate Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};