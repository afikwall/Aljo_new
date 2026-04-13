import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Eye, EyeOff, Info } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/utils/profileUtils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { EarlyPayCard } from "@/components/EarlyPayCard";
import type {
  IStaffProfilesEntity,
  IStaffRatesEntity,
  IFacilitiesEntity,
} from "@/product-types";

interface PaymentsSectionProps {
  formData: Partial<IStaffProfilesEntity>;
  staffRates: (IStaffRatesEntity & { id: string })[];
  facilities: (IFacilitiesEntity & { id: string })[];
  workedFacilityIds: string[];
  isEditMode: boolean;
  onChange: (data: Partial<IStaffProfilesEntity>) => void;
  staffProfileId?: string;
}

export const PaymentsSection = ({
  formData,
  staffRates,
  facilities,
  workedFacilityIds,
  isEditMode,
  onChange,
  staffProfileId,
}: PaymentsSectionProps) => {
  const [showRates, setShowRates] = useState(false);

  const toggleRates = useCallback(() => {
    setShowRates((prev) => !prev);
  }, []);

  // Combine workedFacilityIds and orientedFacilityIds for unique set of facilities to show rates for
  const relevantFacilityIds = useMemo(() => {
    const ids = new Set<string>();
    workedFacilityIds.forEach((id) => ids.add(id));
    const oriented = formData.orientedFacilityIds;
    if (Array.isArray(oriented)) {
      oriented.forEach((id: string) => ids.add(id));
    }
    return Array.from(ids);
  }, [workedFacilityIds, formData.orientedFacilityIds]);

  // Build facility rate cards data
  const facilityRateCards = useMemo(() => {
    return relevantFacilityIds.map((facilityId) => {
      const facility = facilities.find((f) => f.id === facilityId);
      const rate = staffRates.find(
        (r) =>
          r.facilityProfileId === facilityId &&
          r.roleType === formData.roleType
      );
      return {
        facilityId,
        facilityName: facility?.name || "Unknown Facility",
        facilityCity: facility?.city,
        rate: rate?.staffRate ?? null,
        roleType: formData.roleType,
      };
    });
  }, [relevantFacilityIds, facilities, staffRates, formData.roleType]);

  const isDirectDeposit = formData.paymentMethod === "direct_deposit";

  return (
    <div className="space-y-5">
      {/* Early Pay Advance Card */}
      {staffProfileId && (
        <>
          <EarlyPayCard staffProfileId={staffProfileId} />
          <Separator />
        </>
      )}

      {/* Pay Rates by Facility */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">
              Pay Rates by Facility
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRates}
            className="h-7 w-7 p-0"
          >
            {showRates ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>

        {relevantFacilityIds.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No facilities worked yet. Rates will appear here once you complete
            shifts.
          </p>
        ) : (
          <div className="space-y-2">
            {facilityRateCards.map((card) => (
              <FacilityRateRow
                key={card.facilityId}
                facilityName={card.facilityName}
                facilityCity={card.facilityCity}
                roleType={card.roleType}
                rate={card.rate}
                showRate={showRates}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Payment Method & Bank Details */}
      {!isEditMode ? (
        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Payment Method</p>
            {formData.paymentMethod ? (
              <Badge variant="secondary">
                {PAYMENT_METHOD_LABELS[formData.paymentMethod] ||
                  formData.paymentMethod}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not set</p>
            )}
          </div>

          {/* Bank Details (only for direct deposit) */}
          {isDirectDeposit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ViewField label="Bank Name" value={formData.bankName} />
              <ViewField
                label="Account (Last 4)"
                value={
                  formData.bankAccountLast4
                    ? `••••${formData.bankAccountLast4}`
                    : undefined
                }
              />
              <ViewField
                label="Transit Number"
                value={
                  formData.bankTransitNumber
                    ? `••••${formData.bankTransitNumber.slice(-3)}`
                    : undefined
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Payment Method</Label>
            <Select
              value={formData.paymentMethod || ""}
              onValueChange={(value) =>
                onChange({
                  paymentMethod:
                    value as IStaffProfilesEntity["paymentMethod"],
                })
              }
            >
              <SelectTrigger className="h-10 text-base sm:text-sm">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="e_transfer">e-Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Details (conditional) */}
          {isDirectDeposit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-sm font-medium">Bank Name</Label>
                <Input
                  value={formData.bankName || ""}
                  onChange={(e) => onChange({ bankName: e.target.value })}
                  placeholder="e.g. TD Canada Trust"
                  className="h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Account Last 4 Digits
                </Label>
                <Input
                  value={formData.bankAccountLast4 || ""}
                  onChange={(e) =>
                    onChange({ bankAccountLast4: e.target.value })
                  }
                  placeholder="Last 4 digits"
                  maxLength={4}
                  className="h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Transit Number</Label>
                <Input
                  value={formData.bankTransitNumber || ""}
                  onChange={(e) =>
                    onChange({ bankTransitNumber: e.target.value })
                  }
                  placeholder="Transit number"
                  className="h-10 text-base sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Contractor tax responsibility note */}
      <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Gross pay only — tax deductions are the responsibility of the individual contractor. ALJO CareCrew does not withhold income tax.
        </p>
      </div>
    </div>
  );
};

const FacilityRateRow = ({
  facilityName,
  facilityCity,
  roleType,
  rate,
  showRate,
}: {
  facilityName: string;
  facilityCity?: string;
  roleType?: string;
  rate: number | null;
  showRate: boolean;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-3">
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm">{facilityName}</span>
      <div className="flex items-center gap-2">
        {facilityCity && (
          <span className="text-xs text-muted-foreground">{facilityCity}</span>
        )}
        {roleType && (
          <Badge className={`${getRoleBadgeColor(roleType)} text-xs`}>
            {roleType}
          </Badge>
        )}
      </div>
    </div>
    <div className="text-right">
      {rate !== null ? (
        <span className="font-semibold text-sm">
          {showRate ? `$${rate.toFixed(2)}/hr` : "\u2022\u2022\u2022\u2022/hr"}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground italic">
          Rate not assigned
        </span>
      )}
    </div>
  </div>
);

const ViewField = ({ label, value }: { label: string; value?: string }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium">{label}</p>
    {value ? (
      <p className="text-sm text-muted-foreground">{value}</p>
    ) : (
      <p className="text-sm text-muted-foreground italic">Not set</p>
    )}
  </div>
);