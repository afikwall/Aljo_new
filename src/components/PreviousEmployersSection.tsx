import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

export interface EmployerItem {
  company: string;
  role: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

interface PreviousEmployersSectionProps {
  employers: EmployerItem[];
  isEditMode: boolean;
  onEmployersChange: (employers: EmployerItem[]) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

const emptyEmployer: EmployerItem = {
  company: "",
  role: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  isCurrent: false,
  description: "",
};

const formatDateRange = (emp: EmployerItem): string => {
  const start =
    emp.startMonth && emp.startYear
      ? `${emp.startMonth} ${emp.startYear}`
      : "Unknown";
  const end = emp.isCurrent
    ? "Present"
    : emp.endMonth && emp.endYear
      ? `${emp.endMonth} ${emp.endYear}`
      : "Unknown";
  return `${start} – ${end}`;
};

export const PreviousEmployersSection = ({
  employers,
  isEditMode,
  onEmployersChange,
}: PreviousEmployersSectionProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<EmployerItem>({ ...emptyEmployer });

  const handleSaveNew = useCallback(() => {
    if (!formData.company.trim() || !formData.role.trim()) return;
    onEmployersChange([...employers, { ...formData }]);
    setFormData({ ...emptyEmployer });
    setShowAddForm(false);
  }, [formData, employers, onEmployersChange]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;
    if (!formData.company.trim() || !formData.role.trim()) return;
    const updated = [...employers];
    updated[editingIndex] = { ...formData };
    onEmployersChange(updated);
    setEditingIndex(null);
    setFormData({ ...emptyEmployer });
  }, [editingIndex, formData, employers, onEmployersChange]);

  const handleDelete = useCallback(
    (index: number) => {
      onEmployersChange(employers.filter((_, i) => i !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
        setFormData({ ...emptyEmployer });
      }
    },
    [employers, onEmployersChange, editingIndex]
  );

  const handleStartEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setFormData({ ...employers[index] });
      setShowAddForm(false);
    },
    [employers]
  );

  const handleCancelForm = useCallback(() => {
    setShowAddForm(false);
    setEditingIndex(null);
    setFormData({ ...emptyEmployer });
  }, []);

  const sortedEmployers = useMemo(() => {
    return employers.map((emp, idx) => ({ emp, idx }));
  }, [employers]);

  // View mode
  if (!isEditMode) {
    if (employers.length === 0) {
      return (
        <p className="text-sm text-muted-foreground italic">
          No previous employers added
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {sortedEmployers.map(({ emp, idx }) => (
          <div
            key={idx}
            className="border-l-4 border-l-primary/30 bg-muted/30 rounded-r-lg p-3 space-y-1"
          >
            <p className="font-bold text-sm">{emp.company}</p>
            <p className="text-sm text-muted-foreground">{emp.role}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateRange(emp)}
            </p>
            {emp.description && (
              <p className="text-sm mt-1 text-muted-foreground line-clamp-3">
                {emp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Edit mode
  const renderForm = (
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string
  ) => (
    <div className="space-y-3 p-3 border rounded-lg bg-background">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Company Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={formData.company}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, company: e.target.value }))
          }
          placeholder="e.g. Halifax Regional Hospital"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Role Title <span className="text-destructive">*</span>
        </Label>
        <Input
          value={formData.role}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, role: e.target.value }))
          }
          placeholder="e.g. Registered Nurse"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Start Date</Label>
          <div className="flex gap-2">
            <Select
              value={formData.startMonth}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, startMonth: v }))
              }
            >
              <SelectTrigger className="h-10 flex-1">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.startYear}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, startYear: v }))
              }
            >
              <SelectTrigger className="h-10 flex-1">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">End Date</Label>
          {formData.isCurrent ? (
            <div className="h-10 flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-muted/50">
              Present
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={formData.endMonth}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, endMonth: v }))
                }
              >
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={formData.endYear}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, endYear: v }))
                }
              >
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Checkbox
              id="isCurrent"
              checked={formData.isCurrent}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isCurrent: !!checked,
                  endMonth: checked ? "" : prev.endMonth,
                  endYear: checked ? "" : prev.endYear,
                }))
              }
            />
            <label
              htmlFor="isCurrent"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Currently working here
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe your responsibilities..."
          className="min-h-[80px]"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSave}
          size="sm"
          className="flex-1 h-10"
          disabled={!formData.company.trim() || !formData.role.trim()}
        >
          {saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          size="sm"
          className="flex-1 h-10"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {sortedEmployers.map(({ emp, idx }) =>
        editingIndex === idx ? (
          <div key={idx}>{renderForm(handleSaveEdit, handleCancelForm, "Save Changes")}</div>
        ) : (
          <div
            key={idx}
            className="border-l-4 border-l-primary/30 bg-muted/30 rounded-r-lg p-3 space-y-1 relative group"
          >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleStartEdit(idx)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="font-bold text-sm">{emp.company}</p>
            <p className="text-sm text-muted-foreground">{emp.role}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateRange(emp)}
            </p>
            {emp.description && (
              <p className="text-sm mt-1 text-muted-foreground line-clamp-3">
                {emp.description}
              </p>
            )}
          </div>
        )
      )}

      {showAddForm ? (
        renderForm(handleSaveNew, handleCancelForm, "Add Employer")
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddForm(true);
            setEditingIndex(null);
            setFormData({ ...emptyEmployer });
          }}
          className="w-full h-10 gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Employer
        </Button>
      )}
    </div>
  );
};