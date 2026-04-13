import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IFacilitiesEntity } from "@/product-types";

export interface ShiftFiltersState {
  status: string;
  facilityId: string;
  role: string;
  startDate: string;
  endDate: string;
}

interface AdminShiftFiltersProps {
  filters: ShiftFiltersState;
  onFiltersChange: (filters: ShiftFiltersState) => void;
  facilities: (IFacilitiesEntity & { id: string })[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "claimed", label: "Claimed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "RN", label: "RN" },
  { value: "LPN", label: "LPN" },
  { value: "CCA", label: "CCA" },
  { value: "CITR", label: "CITR" },
];

export const AdminShiftFilters = ({
  filters,
  onFiltersChange,
  facilities,
}: AdminShiftFiltersProps) => {
  const updateFilter = useCallback(
    (key: keyof ShiftFiltersState, value: string) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Status Filter */}
          <div className="space-y-1.5 min-w-[150px]">
            <Label className="text-xs font-medium">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => updateFilter("status", v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Facility Filter */}
          <div className="space-y-1.5 min-w-[180px]">
            <Label className="text-xs font-medium">Facility</Label>
            <Select
              value={filters.facilityId}
              onValueChange={(v) => updateFilter("facilityId", v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name || f.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1.5 min-w-[130px]">
            <Label className="text-xs font-medium">Role</Label>
            <Select
              value={filters.role}
              onValueChange={(v) => updateFilter("role", v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 min-w-[140px]">
            <Label className="text-xs font-medium">Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              className="h-9"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5 min-w-[140px]">
            <Label className="text-xs font-medium">End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};