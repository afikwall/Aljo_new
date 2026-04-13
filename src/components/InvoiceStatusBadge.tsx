import React from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInvoiceStatusStyle } from "@/utils/invoiceUtils";

interface InvoiceStatusBadgeProps {
  status?: string;
  className?: string;
}

const statusIcons: Record<string, React.ElementType> = {
  draft: FileText,
  sent: Send,
  paid: CheckCircle,
  overdue: AlertTriangle,
};

export const InvoiceStatusBadge = ({ status, className }: InvoiceStatusBadgeProps) => {
  const { className: statusClass, label } = getInvoiceStatusStyle(status);
  const Icon = statusIcons[status || ""] || FileText;

  return (
    <Badge className={cn(statusClass, className)}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
};