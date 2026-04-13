import { useMemo, useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Building2,
  Eye,
  Send,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import {
  formatCAD,
  formatInvoicePeriod,
  formatInvoiceDate,
  isOverdue,
} from "@/utils/invoiceUtils";
import { cn } from "@/lib/utils";

interface InvoiceCardProps {
  invoice: {
    id?: string;
    invoiceNumber?: string;
    facilityProfileId?: string;
    periodStart?: string;
    periodEnd?: string;
    invoiceStatus?: string;
    total?: number;
    dueDate?: string;
    lineItems?: any[];
    createdAt?: string;
    sentAt?: string;
    paidAt?: string;
    subtotal?: number;
    hstRate?: number;
    hstAmount?: number;
  };
  facilityName: string;
  onViewDetails: () => void;
  onMarkSent: () => void;
  onMarkPaid: () => void;
  onMarkOverdue: () => void;
  isUpdating: boolean;
}

export const InvoiceCard = ({
  invoice,
  facilityName,
  onViewDetails,
  onMarkSent,
  onMarkPaid,
  onMarkOverdue,
  isUpdating,
}: InvoiceCardProps) => {
  const [confirmAction, setConfirmAction] = useState<"sent" | "paid" | null>(null);

  const periodLabel = useMemo(
    () => formatInvoicePeriod(invoice.periodStart, invoice.periodEnd),
    [invoice.periodStart, invoice.periodEnd]
  );

  const shiftCount = invoice.lineItems?.length || 0;

  const dueDateOverdue = useMemo(
    () =>
      invoice.invoiceStatus !== "paid" && isOverdue(invoice.dueDate),
    [invoice.invoiceStatus, invoice.dueDate]
  );

  const handleConfirm = useCallback(() => {
    if (confirmAction === "sent") {
      onMarkSent();
    } else if (confirmAction === "paid") {
      onMarkPaid();
    }
    setConfirmAction(null);
  }, [confirmAction, onMarkSent, onMarkPaid]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            {/* Top Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-base font-bold truncate">
                  {invoice.invoiceNumber || "—"}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{facilityName}</span>
                </div>
              </div>
              <InvoiceStatusBadge status={invoice.invoiceStatus} />
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Period: <span className="text-foreground">{periodLabel}</span>
              </span>
              <span className="text-muted-foreground">
                {shiftCount} shift{shiftCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Total & Due */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCAD(invoice.total || 0)}
                </p>
              </div>
              <div className="text-right text-sm">
                {invoice.dueDate && (
                  <p
                    className={cn(
                      dueDateOverdue && "text-destructive font-medium"
                    )}
                  >
                    Due {formatInvoiceDate(invoice.dueDate)}
                  </p>
                )}
                {invoice.createdAt && (
                  <p className="text-muted-foreground">
                    Generated {formatInvoiceDate(invoice.createdAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={onViewDetails}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>

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
        </CardContent>
      </Card>

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
                ? `This will mark invoice ${invoice.invoiceNumber} as sent to ${facilityName}. This action records the current timestamp as the sent date.`
                : `This will mark invoice ${invoice.invoiceNumber} as paid by ${facilityName}. This action records the current timestamp as the payment date.`}
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