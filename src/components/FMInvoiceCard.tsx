import { useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Printer } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import {
  formatCAD,
  formatInvoicePeriod,
  formatInvoiceDate,
} from "@/utils/invoiceUtils";

interface FMInvoiceCardProps {
  invoice: {
    id?: string;
    invoiceNumber?: string;
    periodStart?: string;
    periodEnd?: string;
    invoiceStatus?: string;
    total?: number;
    dueDate?: string;
    lineItems?: any[];
  };
  onViewDetails: () => void;
}

export const FMInvoiceCard = ({
  invoice,
  onViewDetails,
}: FMInvoiceCardProps) => {
  const periodLabel = useMemo(
    () => formatInvoicePeriod(invoice.periodStart, invoice.periodEnd),
    [invoice.periodStart, invoice.periodEnd]
  );

  const dueDateLabel = useMemo(
    () => formatInvoiceDate(invoice.dueDate),
    [invoice.dueDate]
  );

  const shiftCount = useMemo(
    () => invoice.lineItems?.length || 0,
    [invoice.lineItems]
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Top row: invoice number + status */}
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-sm font-semibold text-foreground">
                {invoice.invoiceNumber || "—"}
              </span>
              <p className="text-sm text-muted-foreground mt-0.5">
                {periodLabel}
              </p>
            </div>
            <InvoiceStatusBadge status={invoice.invoiceStatus} />
          </div>

          {/* Total amount */}
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums">
              {formatCAD(invoice.total || 0)}
            </span>
            <span className="text-xs text-muted-foreground">
              {shiftCount} shift{shiftCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Due date */}
          {invoice.dueDate && (
            <p className="text-xs text-muted-foreground">
              Due: {dueDateLabel}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-11"
              onClick={onViewDetails}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};