import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IStaffProfilesEntity } from "@/product-types";

interface AddressSectionProps {
  formData: Partial<IStaffProfilesEntity>;
  isEditMode: boolean;
  onChange: (data: Partial<IStaffProfilesEntity>) => void;
}

export const AddressSection = ({
  formData,
  isEditMode,
  onChange,
}: AddressSectionProps) => {
  const handleChange = useCallback(
    (field: keyof IStaffProfilesEntity, value: string) => {
      onChange({ [field]: value });
    },
    [onChange]
  );

  if (!isEditMode) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ViewField label="Street Address" value={formData.streetAddress} />
        <ViewField label="City" value={formData.city} />
        <ViewField label="Province" value={formData.province} />
        <ViewField label="Postal Code" value={formData.postalCode} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-sm font-medium">Street Address</Label>
        <Input
          value={formData.streetAddress || ""}
          onChange={(e) => handleChange("streetAddress", e.target.value)}
          placeholder="123 Main St"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">City</Label>
        <Input
          value={formData.city || ""}
          onChange={(e) => handleChange("city", e.target.value)}
          placeholder="City"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Province</Label>
        <Input
          value={formData.province || ""}
          onChange={(e) => handleChange("province", e.target.value)}
          placeholder="Province"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Postal Code</Label>
        <Input
          value={formData.postalCode || ""}
          onChange={(e) => handleChange("postalCode", e.target.value)}
          placeholder="A1A 1A1"
          className="h-10 text-base sm:text-sm"
        />
      </div>
    </div>
  );
};

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