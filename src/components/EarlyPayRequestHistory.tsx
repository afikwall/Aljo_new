import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Banknote } from "lucide-react";
import type { IEarlyPayRequestsEntity } from "@/product-types";
import {
  getEarlyPayStatusBadge,
  formatCAD,
  formatRequestDate,
} from "@/utils/earlyPayUtils";

interface EarlyPayRequestHistoryProps {
  requests: (IEarlyPayRequestsEntity & { id: string })[];
}

export const EarlyPayRequestHistory = ({
  requests,
}: EarlyPayRequestHistoryProps) => {
  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const dateA = a.requestedAt || "";
        const dateB = b.requestedAt || "";
        return dateB.localeCompare(dateA);
      }),
    [requests]
  );

  if (sortedRequests.length === 0) {
    return (
      <div className="text-center py-6">
        <Banknote className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No early pay requests yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRequests.map((request, index) => {
        const statusBadge = getEarlyPayStatusBadge(request.status);
        return (
          <div key={request.id}>
            {index > 0 && <Separator className="mb-3" />}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {formatRequestDate(request.requestedAt)}
                  </span>
                  <Badge className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="text-sm font-medium">
                  Requested: {formatCAD(request.amountRequested || 0)}
                </p>
                {(request.status === "approved" || request.status === "paid") &&
                  request.amountApproved != null && (
                    <p className="text-sm text-accent">
                      Approved: {formatCAD(request.amountApproved)}
                    </p>
                  )}
                {request.status === "denied" && request.denialReason && (
                  <p className="text-sm text-destructive">
                    Reason: {request.denialReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};