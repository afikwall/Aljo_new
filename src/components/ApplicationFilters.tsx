import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacilityOption {
  id: string;
  name: string;
}

interface ApplicationFiltersProps {
  facilityOptions: FacilityOption[];
  facilityFilter: string;
  onFacilityFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
}

export const ApplicationFilters = ({
  facilityOptions,
  facilityFilter,
  onFacilityFilterChange,
  roleFilter,
  onRoleFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sortOrder,
  onSortOrderChange,
}: ApplicationFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Facility filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Facility</label>
            <Select value={facilityFilter} onValueChange={onFacilityFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilityOptions.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required role filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Required Role</label>
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="RN">RN</SelectItem>
                <SelectItem value="LPN">LPN</SelectItem>
                <SelectItem value="CCA">CCA</SelectItem>
                <SelectItem value="CITR">CITR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range - start */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>

          {/* Date range - end */}
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort</label>
            <Select value={sortOrder} onValueChange={onSortOrderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};