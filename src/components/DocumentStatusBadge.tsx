import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, CalendarX2 } from "lucide-react";
import type { DocumentStatus } from "@/utils/documentUtils";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export const DocumentStatusBadge = ({ status }: DocumentStatusBadgeProps) => {
  switch (status) {
    case "missing":
      return (
        <Badge className="bg-destructive/20 text-destructive gap-1" variant="outline">
          Not Uploaded
        </Badge>
      );
    case "pending_review":
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1 border-transparent">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-accent/20 text-accent gap-1 border-transparent">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-destructive/20 text-destructive gap-1 border-transparent">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1 border-transparent">
          <CalendarX2 className="h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};