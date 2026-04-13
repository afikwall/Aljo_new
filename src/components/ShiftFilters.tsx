import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShiftFiltersProps {
  statusFilter: string;
  roleFilter: string;
  onStatusChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  resultsCount: number;
}

export const ShiftFilters = ({
  statusFilter,
  roleFilter,
  onStatusChange,
  onRoleChange,
  resultsCount,
}: ShiftFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="claimed">Claimed</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={roleFilter} onValueChange={onRoleChange}>
        <SelectTrigger className="w-[140px] h-10">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="RN">RN</SelectItem>
          <SelectItem value="LPN">LPN</SelectItem>
          <SelectItem value="CCA">CCA</SelectItem>
          <SelectItem value="CITR">CITR</SelectItem>
        </SelectContent>
      </Select>

      <span className="text-sm text-muted-foreground ml-auto">
        Showing {resultsCount} shift{resultsCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
};