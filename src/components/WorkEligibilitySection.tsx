import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import {
  WORK_PERMIT_LABELS,
  ROLE_TYPE_LABELS,
  getMaskedSin,
} from "@/utils/profileUtils";
import type { IStaffProfilesEntity } from "@/product-types";

interface WorkEligibilitySectionProps {
  formData: Partial<IStaffProfilesEntity>;
  isEditMode: boolean;
  onChange: (data: Partial<IStaffProfilesEntity>) => void;
}

export const WorkEligibilitySection = ({
  formData,
  isEditMode,
  onChange,
}: WorkEligibilitySectionProps) => {
  const [showSin, setShowSin] = useState(false);

  const toggleSin = useCallback(() => {
    setShowSin((prev) => !prev);
  }, []);

  if (!isEditMode) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Work Permit Status</p>
          {formData.workPermitStatus ? (
            <Badge variant="secondary">
              {WORK_PERMIT_LABELS[formData.workPermitStatus] || formData.workPermitStatus}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not set</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Role Type</p>
          {formData.roleType ? (
            <Badge variant="secondary">
              {ROLE_TYPE_LABELS[formData.roleType] || formData.roleType}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not set</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">SIN</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {showSin ? (formData.sinNumber || "Not set") : getMaskedSin(formData.sinNumber)}
            </p>
            {formData.sinNumber && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSin}
                className="h-6 w-6 p-0"
              >
                {showSin ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Work Permit Status</Label>
        <Select
          value={formData.workPermitStatus || ""}
          onValueChange={(value) =>
            onChange({ workPermitStatus: value as IStaffProfilesEntity["workPermitStatus"] })
          }
        >
          <SelectTrigger className="h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="citizen">Canadian Citizen</SelectItem>
            <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
            <SelectItem value="work_permit">Work Permit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Role Type</Label>
        <Select
          value={formData.roleType || ""}
          onValueChange={(value) =>
            onChange({ roleType: value as IStaffProfilesEntity["roleType"] })
          }
        >
          <SelectTrigger className="h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RN">RN — Registered Nurse</SelectItem>
            <SelectItem value="LPN">LPN — Licensed Practical Nurse</SelectItem>
            <SelectItem value="CCA">CCA — Continuing Care Assistant</SelectItem>
            <SelectItem value="CITR">CITR — Carer in Training</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label className="text-sm font-medium">SIN</Label>
        <div className="relative">
          <Input
            type={showSin ? "text" : "password"}
            value={formData.sinNumber || ""}
            onChange={(e) => onChange({ sinNumber: e.target.value })}
            placeholder="XXX-XXX-XXX"
            className="h-10 text-base sm:text-sm pr-10"
          />
          <button
            type="button"
            onClick={toggleSin}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSin ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};