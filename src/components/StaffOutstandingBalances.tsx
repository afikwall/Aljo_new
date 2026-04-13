import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  type TimesheetWithRelations,
  type StaffOutstandingData,
  calculateOutstandingBalances,
  formatCAD,
} from "@/utils/timesheetUtils";

interface StaffOutstandingBalancesProps {
  timesheets: TimesheetWithRelations[];
  onSelectStaff: (staffProfileId: string) => void;
}

export const StaffOutstandingBalances = ({
  timesheets,
  onSelectStaff,
}: StaffOutstandingBalancesProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const balances: StaffOutstandingData[] = useMemo(
    () => calculateOutstandingBalances(timesheets),
    [timesheets]
  );

  const handleStaffClick = useCallback(
    (staffProfileId: string) => {
      onSelectStaff(staffProfileId);
    },
    [onSelectStaff]
  );

  if (balances.length === 0) return null;

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        className="w-full justify-between px-2 py-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">
            Staff Outstanding Balances
          </span>
          <Badge variant="secondary" className="text-xs">
            {balances.length}
          </Badge>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {balances.map((staff) => (
            <Card
              key={staff.staffProfileId}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStaffClick(staff.staffProfileId)}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-medium">
                    {staff.staffInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {staff.staffName}
                  </p>
                  {staff.staffRole && (
                    <Badge variant="secondary" className="text-xs">
                      {staff.staffRole}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-chart-3">Pending</span>
                  <span className="font-medium text-chart-3 tabular-nums">
                    {formatCAD(staff.pendingAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-chart-1">Approved</span>
                  <span className="font-medium text-chart-1 tabular-nums">
                    {formatCAD(staff.approvedAmount)}
                  </span>
                </div>
                <div className="border-t pt-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold">Total Outstanding</span>
                  <span className="font-bold tabular-nums">
                    {formatCAD(staff.totalOutstanding)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};