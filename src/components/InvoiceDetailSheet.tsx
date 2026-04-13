import { useMemo, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, CheckCircle, AlertTriangle } from "lucide-react";
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

interface InvoiceDetailSheetProps {
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
  onMarkSent: () => void;
  onMarkPaid: () => void;
  onMarkOverdue: () => void;
  isUpdating: boolean;
}

export const InvoiceDetailSheet = ({
  open,
  onOpenChange,
  invoice,
  facilityName,
  onMarkSent,
  onMarkPaid,
  onMarkOverdue,
  isUpdating,
}: InvoiceDetailSheetProps) => {
  const [confirmAction, setConfirmAction] = useState<"sent" | "paid" | null>(
    null
  );

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

  const handleConfirm = useCallback(() => {
    if (confirmAction === "sent") {
      onMarkSent();
    } else if (confirmAction === "paid") {
      onMarkPaid();
    }
    setConfirmAction(null);
  }, [confirmAction, onMarkSent, onMarkPaid]);

  if (!invoice) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
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

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3 pr-2">
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
                        {item.staffInitials || item.staffName?.split(" ").map((n: string) => n[0]).join(".").toUpperCase() + "." || "?"}
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
                HST (14%) applies to facility billing only. Staff pay does not include tax.
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

          {/* Bottom Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {invoice.invoiceStatus === "draft" && (
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setConfirmAction("sent")}
                disabled={isUpdating}
              >
                <Send className="mr-2 h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {(invoice.invoiceStatus === "sent" ||
              invoice.invoiceStatus === "overdue") && (
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setConfirmAction("paid")}
                disabled={isUpdating}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            {invoice.invoiceStatus === "sent" && dueDateOverdue && (
              <Button
                variant="ghost"
                className="h-11 text-destructive"
                onClick={onMarkOverdue}
                disabled={isUpdating}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Mark Overdue
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "sent"
                ? "Mark Invoice as Sent?"
                : "Mark Invoice as Paid?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "sent"
                ? `This will mark invoice ${invoice.invoiceNumber} as sent to ${facilityName}.`
                : `This will mark invoice ${invoice.invoiceNumber} as paid by ${facilityName}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};