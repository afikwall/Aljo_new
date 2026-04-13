import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiftDetailTable } from "@/components/ShiftDetailTable";
import {
  formatCAD,
  type LineItemForDisplay,
  getEstimatedBilling,
} from "@/utils/invoiceUtils";

interface FacilityPayrollCardProps {
  facilityId: string;
  facilityName: string;
  facilityCity?: string;
  facilityProvince?: string;
  lineItems: LineItemForDisplay[];
  existingInvoiceNumber?: string;
  hasExistingInvoice: boolean;
  onGenerateInvoice: () => void;
  onEditTimeLog: (item: LineItemForDisplay) => void;
  isGenerating: boolean;
}

export const FacilityPayrollCard = ({
  facilityId,
  facilityName,
  facilityCity,
  facilityProvince,
  lineItems,
  existingInvoiceNumber,
  hasExistingInvoice,
  onGenerateInvoice,
  onEditTimeLog,
  isGenerating,
}: FacilityPayrollCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadInvoice = useCallback(() => {
    // Build CSV string
    const headers = [
      "Staff Name",
      "Role",
      "Shift Date",
      "Clock In",
      "Clock Out",
      "Break (min)",
      "Net Hours",
      "Billing Rate",
      "Multiplier",
      "Line Total",
    ];

    const rows = lineItems.map((item) => [
      item.staffName,
      item.roleType,
      item.shiftDate,
      item.clockInTime,
      item.clockOutTime,
      item.breakMinutes,
      item.netHours,
      item.billingRate,
      item.multiplier,
      item.lineTotal,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = `invoice-${facilityName.replace(/\s+/g, "-").toLowerCase()}-${existingInvoiceNumber || "draft"}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [lineItems, facilityName, existingInvoiceNumber]);

  const totalShifts = lineItems.length;
  const totalHours = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.netHours, 0),
    [lineItems]
  );
  const estimatedBilling = useMemo(
    () => getEstimatedBilling(lineItems),
    [lineItems]
  );

  const locationLabel = useMemo(() => {
    const parts = [facilityCity, facilityProvince].filter(Boolean);
    return parts.join(", ");
  }, [facilityCity, facilityProvince]);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base font-bold">
                    {facilityName}
                  </CardTitle>
                  {locationLabel && (
                    <p className="text-sm text-muted-foreground">
                      {locationLabel}
                    </p>
                  )}
                </div>
              </div>
              {hasExistingInvoice && (
                <Badge className="bg-accent/20 text-accent-foreground whitespace-nowrap">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Invoice Generated
                  {existingInvoiceNumber && (
                    <span className="ml-1 font-mono text-xs">
                      ({existingInvoiceNumber})
                    </span>
                  )}
                </Badge>
              )}
            </div>

            {/* Summary Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span>
                <span className="font-semibold">{totalShifts}</span>{" "}
                <span className="text-muted-foreground">shifts completed</span>
              </span>
              <span>
                <span className="font-semibold">{totalHours.toFixed(1)}</span>{" "}
                <span className="text-muted-foreground">total hours</span>
              </span>
              <span>
                <span className="text-muted-foreground">estimated billing</span>{" "}
                <span className="font-semibold">
                  {formatCAD(estimatedBilling)}
                </span>
              </span>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-2">
              <Button
                className="h-11"
                disabled={
                  totalShifts === 0 || hasExistingInvoice || isGenerating
                }
                onClick={onGenerateInvoice}
              >
                <FileText className="mr-2 h-4 w-4" />
                {hasExistingInvoice
                  ? "Invoice Exists"
                  : isGenerating
                  ? "Generating..."
                  : "Generate Invoice"}
              </Button>

              {hasExistingInvoice && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={handleDownloadInvoice}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              )}

              <CollapsibleTrigger asChild>
                <Button variant="outline" className="h-11 ml-auto">
                  {isOpen ? (
                    <ChevronUp className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  )}
                  {isOpen ? "Hide Shifts" : "View Shifts"}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ShiftDetailTable
              lineItems={lineItems}
              onEditTimeLog={onEditTimeLog}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};