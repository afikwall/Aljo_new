import { useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  formatCAD,
  formatShiftDate,
  formatTime,
  type LineItemForDisplay,
} from "@/utils/invoiceUtils";

interface ShiftDetailTableProps {
  lineItems: LineItemForDisplay[];
  onEditTimeLog: (item: LineItemForDisplay) => void;
}

export const ShiftDetailTable = ({
  lineItems,
  onEditTimeLog,
}: ShiftDetailTableProps) => {
  const handleEdit = useCallback(
    (item: LineItemForDisplay) => {
      onEditTimeLog(item);
    },
    [onEditTimeLog]
  );

  if (lineItems.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No completed shifts in this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Shift Date</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead className="text-right">Gross Hrs</TableHead>
              <TableHead className="text-right">Break</TableHead>
              <TableHead className="text-right">Net Hrs</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead>Multipliers</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
              <TableHead>Adjusted</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, idx) => (
              <TableRow key={`${item.shiftId}-${item.timeLogId}-${idx}`}>
                <TableCell className="font-medium">{item.staffName}</TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", getRoleBadgeColor(item.roleType))}>
                    {item.roleType}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatShiftDate(item.shiftDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatTime(item.clockInTime)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatTime(item.clockOutTime)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {item.grossHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {item.breakMinutes} min
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {item.netHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatCAD(item.billingRate)}/hr
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.isShortNotice && (
                      <Badge className="bg-chart-3/20 text-chart-3 text-xs whitespace-nowrap">
                        Short Notice {item.shortNoticeMultiplier}×
                      </Badge>
                    )}
                    {item.isHoliday && (
                      <Badge className="bg-chart-4/20 text-chart-4 text-xs whitespace-nowrap">
                        Holiday {item.holidayMultiplier}×
                      </Badge>
                    )}
                    {!item.isShortNotice && !item.isHoliday && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-sm">
                  {formatCAD(item.lineTotal)}
                </TableCell>
                <TableCell>
                  {item.adminAdjusted && (
                    <Badge className="bg-chart-3/20 text-chart-3 text-xs">
                      <Pencil className="mr-1 h-3 w-3" />
                      Adjusted
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};