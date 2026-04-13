import React, { useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import type { IStaffProfilesEntity } from "@/product-types";
import { StaffDocumentsEntity } from "@/product-types";
import { StaffDetailPanel } from "@/components/StaffDetailPanel";

interface StaffDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: (IStaffProfilesEntity & { id: string }) | null;
  documents?: Array<typeof StaffDocumentsEntity["instanceType"]>;
  onRefresh?: () => void;
}

export const StaffDetailSheet = ({
  open,
  onOpenChange,
  staff,
  documents,
  onRefresh,
}: StaffDetailSheetProps) => {
  const staffDocuments = useMemo(() => documents || [], [documents]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const getComplianceBadge = useCallback((status?: string) => {
    if (status === "compliant") {
      return (
        <Badge className="bg-accent/20 text-accent gap-1">
          <CheckCircle className="h-3 w-3" />
          Compliant
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    if (status === "expired") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    return <Badge variant="outline">Unknown</Badge>;
  }, []);

  const getOnboardingBadge = useCallback((status?: string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-accent/20 text-accent gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    if (status === "pending_review") {
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>
      );
    }
    if (status === "rejected") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    }
    if (status === "incomplete") {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Incomplete
        </Badge>
      );
    }
    return <Badge variant="outline">Unknown</Badge>;
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Staff Details</SheetTitle>
          <SheetDescription>Full details for the selected staff member</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6 pb-12">
            {staff && (
              <StaffDetailPanel
                staff={staff}
                documents={staffDocuments}
                onRefresh={handleRefresh}
                getComplianceBadge={getComplianceBadge}
                getOnboardingBadge={getOnboardingBadge}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};