import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StaffProfilesEntity } from "@/product-types";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { FileText, ChevronRight, AlertTriangle } from "lucide-react";

interface StaffCardProps {
  staff: typeof StaffProfilesEntity['instanceType'];
  documentCount: number;
  onClick: () => void;
  getComplianceBadge: (status?: string) => React.ReactNode;
  getOnboardingBadge: (status?: string) => React.ReactNode;
}

export function StaffCard({
  staff,
  documentCount,
  onClick,
  getComplianceBadge,
  getOnboardingBadge,
}: StaffCardProps) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Top row: Email and Role */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <p className="font-semibold truncate">{staff.email}</p>
              {(staff.withdrawalCount || 0) >= 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-chart-3 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Frequent withdrawer ({staff.withdrawalCount} withdrawals)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              {staff.roleType || "N/A"}
            </Badge>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {getComplianceBadge(staff.complianceStatus)}
            {getOnboardingBadge(staff.onboardingStatus)}
            <AvailabilityBadge isAvailabilitySet={staff.isAvailabilitySet} />
            <ReliabilityBadge totalShiftsCompleted={staff.totalRatings || 0} size="sm" />
          </div>

          {/* Document count and chevron */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{documentCount} document{documentCount !== 1 ? 's' : ''}</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}