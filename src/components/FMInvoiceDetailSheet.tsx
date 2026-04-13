import { useMemo, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import {
  formatCAD,
  formatInvoicePeriod,
  formatInvoiceDate,
  isOverdue,
  groupLineItemsByDay,
  type DayGroup,
} from "@/utils/invoiceUtils";

interface FMInvoiceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id?: string;
    invoiceNumber?: string;
    facilityProfileId?: string;
    periodStart?: string;
    periodEnd?: string;
    invoiceStatus?: string;
    total?: number;
    subtotal?: number;
    hstRate?: number;
    hstAmount?: number;
    dueDate?: string;
    lineItems?: any[];
    createdAt?: string;
    sentAt?: string;
    paidAt?: string;
  } | null;
  facilityName: string;
}

export const FMInvoiceDetailSheet = ({
  open,
  onOpenChange,
  invoice,
  facilityName,
}: FMInvoiceDetailSheetProps) => {
  // Group line items by day
  const dayGroups: DayGroup[] = useMemo(() => {
    if (!invoice?.lineItems) return [];
    return groupLineItemsByDay(
      invoice.lineItems.map((item: any) => ({
        shiftId: item.shiftId || "",
        staffProfileId: item.staffProfileId,
        staffName: item.staffName,
        staffInitials: item.staffInitials,
        date: item.date,
        dayLabel: item.dayLabel,
        startTime: item.startTime,
        endTime: item.endTime,
        roleType: item.roleType || item.staffRole,
        grossHours: item.grossHours,
        breakMinutes: item.breakMinutes,
        netHours: item.netHours || item.hours || 0,
        billingRate: item.billingRate || 0,
        multiplier: item.multiplier,
        isShortNotice: item.isShortNotice,
        isHoliday: item.isHoliday,
        lineTotal: item.lineTotal || 0,
      }))
    );
  }, [invoice]);

  const periodLabel = useMemo(
    () => formatInvoicePeriod(invoice?.periodStart, invoice?.periodEnd),
    [invoice?.periodStart, invoice?.periodEnd]
  );

  const dueDateOverdue = useMemo(
    () =>
      invoice?.invoiceStatus !== "paid" && isOverdue(invoice?.dueDate),
    [invoice?.invoiceStatus, invoice?.dueDate]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!invoice) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">
              {invoice.invoiceNumber || "Invoice"}
            </span>
            <InvoiceStatusBadge status={invoice.invoiceStatus} />
          </SheetTitle>
          <SheetDescription>
            {facilityName} — {periodLabel}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-200px)] print:h-auto print:overflow-visible">
          <div className="space-y-3 pr-2" id="fm-invoice-print-content">
            {/* Print header (hidden on screen) */}
            <div className="hidden print:block mb-6">
              <h1 className="text-2xl font-bold">Invoice</h1>
              <p className="text-lg">{facilityName}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.invoiceNumber} — {periodLabel}
              </p>
            </div>

            {/* Day-Grouped Line Items */}
            {dayGroups.map((group) => (
              <div key={group.date}>
                {/* Day Header */}
                <div className="bg-muted/50 px-3 py-2 rounded-md mb-1">
                  <span className="text-sm font-semibold">{group.dayLabel}</span>
                </div>

                {/* Column Headers */}
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

            <Separator />

            {/* Invoice Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCAD(invoice.subtotal || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  HST ({invoice.hstRate || 14}%)
                </span>
                <span className="font-medium">
                  {formatCAD(invoice.hstAmount || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold">
                  {formatCAD(invoice.total || 0)}
                </span>
              </div>
            </div>

            {/* HST Registration # placeholder */}
            <div className="rounded-lg border border-dashed p-3 mt-3">
              <p className="text-xs text-muted-foreground">
                HST Registration #:{" "}
                <span className="inline-block border-b border-dotted border-muted-foreground/40 min-w-[180px]">
                  &nbsp;
                </span>
              </p>
            </div>

            {/* HST info note */}
            <p className="text-xs text-muted-foreground italic mt-2">
              HST (14%) applies to facility billing.
            </p>

            <Separator />

            {/* Metadata */}
            <div className="space-y-1.5 text-sm">
              <p className="font-medium mb-2">Invoice Details</p>
              {invoice.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated</span>
                  <span>{formatInvoiceDate(invoice.createdAt)}</span>
                </div>
              )}
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{formatInvoiceDate(invoice.sentAt)}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{formatInvoiceDate(invoice.paidAt)}</span>
                </div>
              )}
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span
                    className={cn(
                      dueDateOverdue && "text-destructive font-medium"
                    )}
                  >
                    {formatInvoiceDate(invoice.dueDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom: Print Button (read-only — FM cannot edit) */}
        <div className="flex gap-2 mt-4 pt-4 border-t print:hidden">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            Download / Print
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};