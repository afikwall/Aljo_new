import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StaffProfilesEntity } from "@/product-types";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { FileCheck } from "lucide-react";
import { format, parseISO } from "date-fns";

interface OnboardingStaffCardProps {
  staff: typeof StaffProfilesEntity['instanceType'];
  approvedDocCount: number;
  totalRequiredDocs: number;
  onClick: () => void;
  getComplianceBadge: (status?: string) => React.ReactNode;
  getOnboardingBadge: (status?: string) => React.ReactNode;
  getRoleBadgeColor: (role?: string) => string;
}

export function OnboardingStaffCard({
  staff,
  approvedDocCount,
  totalRequiredDocs,
  onClick,
  getComplianceBadge,
  getOnboardingBadge,
  getRoleBadgeColor,
}: OnboardingStaffCardProps) {
  const getInitials = () => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`.toUpperCase();
    }
    if (staff.email) {
      return staff.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  const getStaffName = () => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName} ${staff.lastName}`;
    }
    return staff.email || "Unknown";
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Top row: Avatar, Name, Role */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{getStaffName()}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <Badge variant="outline" className={`${getRoleBadgeColor(staff.roleType)}`}>
                  {staff.roleType || "N/A"}
                </Badge>
                <ReliabilityBadge totalShiftsCompleted={0} size="sm" />
              </div>
            </div>
          </div>

          {/* Status badges row */}
          <div className="flex flex-wrap gap-2">
            {getOnboardingBadge(staff.onboardingStatus)}
            {getComplianceBadge(staff.complianceStatus)}
            <AvailabilityBadge isAvailabilitySet={staff.isAvailabilitySet} />
          </div>

          {/* Document progress and registration date */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileCheck className="h-4 w-4" />
              <span className="text-xs rounded-full px-2 py-0.5 bg-muted">
                {approvedDocCount}/{totalRequiredDocs} docs
              </span>
            </div>
            {staff.createdAt && (
              <span className="text-xs text-muted-foreground">
                {format(parseISO(staff.createdAt), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Review button */}
          <Button
            variant="outline"
            onClick={onClick}
            className="w-full h-9 text-sm"
          >
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}