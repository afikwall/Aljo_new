import { useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffRatesEntity } from "@/product-types";
import type { IStaffRatesEntity } from "@/product-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Info } from "lucide-react";
import { toast } from "sonner";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface FacilityRatesSectionProps {
  facilityProfileId: string;
}

export const FacilityRatesSection = ({
  facilityProfileId,
}: FacilityRatesSectionProps) => {
  const {
    data: staffRates,
    isLoading,
    refetch: refetchStaffRates,
  } = useEntityGetAll(
    StaffRatesEntity,
    { facilityProfileId },
    { enabled: !!facilityProfileId }
  );

  const { updateFunction } = useEntityUpdate(StaffRatesEntity);

  const typedStaffRates = useMemo(() => {
    return (staffRates || []) as (IStaffRatesEntity & { id: string })[];
  }, [staffRates]);

  const handleUpdateStaffRate = useCallback(
    async (rateId: string, field: string, value: string) => {
      try {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        await updateFunction({
          id: rateId,
          data: { [field]: numValue },
        });
        toast.success("Rate updated successfully");
        refetchStaffRates();
      } catch {
        toast.error("Failed to update rate");
      }
    },
    [updateFunction, refetchStaffRates]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Staff Rates</h2>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Staff Rates</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : typedStaffRates.length === 0 ? (
            <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No staff rates configured</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Hourly Rate (CAD)</TableHead>
                    <TableHead>Holiday Mult.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedStaffRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(rate.roleType)}>
                          {rate.roleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={rate.staffRate}
                          onBlur={(e) =>
                            handleUpdateStaffRate(
                              rate.id,
                              "staffRate",
                              e.target.value
                            )
                          }
                          className="w-24 h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue={rate.holidayMultiplier}
                          onBlur={(e) =>
                            handleUpdateStaffRate(
                              rate.id,
                              "holidayMultiplier",
                              e.target.value
                            )
                          }
                          className="w-24 h-8 text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="flex items-start gap-1.5">
        <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          These rates are what staff are paid per hour. Billing rates are managed by ALJO admin.
        </p>
      </div>
    </div>
  );
};