import { useCallback } from "react";
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
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { EDUCATION_LABELS } from "@/utils/profileUtils";
import { format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { IStaffProfilesEntity } from "@/product-types";

interface CertificationItem {
  name: string;
  expiryDate?: string;
}

interface EducationSectionProps {
  formData: Partial<IStaffProfilesEntity>;
  certifications: CertificationItem[];
  isEditMode: boolean;
  onChange: (data: Partial<IStaffProfilesEntity>) => void;
  onCertificationsChange: (certs: CertificationItem[]) => void;
}

export const EducationSection = ({
  formData,
  certifications,
  isEditMode,
  onChange,
  onCertificationsChange,
}: EducationSectionProps) => {
  const addCertification = useCallback(() => {
    onCertificationsChange([...certifications, { name: "" }]);
  }, [certifications, onCertificationsChange]);

  const removeCertification = useCallback(
    (index: number) => {
      onCertificationsChange(certifications.filter((_, i) => i !== index));
    },
    [certifications, onCertificationsChange]
  );

  const updateCertification = useCallback(
    (index: number, field: keyof CertificationItem, value: string) => {
      const updated = certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      );
      onCertificationsChange(updated);
    },
    [certifications, onCertificationsChange]
  );

  if (!isEditMode) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ViewField
            label="Highest Education"
            value={
              formData.highestEducation
                ? EDUCATION_LABELS[formData.highestEducation]
                : undefined
            }
          />
          <ViewField label="Institution" value={formData.institution} />
          <ViewField
            label="Graduation Year"
            value={formData.graduationYear?.toString()}
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Certifications</p>
          {certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert, i) => (
                <Badge key={i} variant="secondary" className="rounded-full">
                  {cert.name}
                  {cert.expiryDate && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (exp {format(parseISO(cert.expiryDate), "MMM yyyy")})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No certifications added
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Highest Education</Label>
          <Select
            value={formData.highestEducation || ""}
            onValueChange={(value) =>
              onChange({
                highestEducation:
                  value as IStaffProfilesEntity["highestEducation"],
              })
            }
          >
            <SelectTrigger className="h-10 text-base sm:text-sm">
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="diploma">Diploma</SelectItem>
              <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
              <SelectItem value="masters">Master's Degree</SelectItem>
              <SelectItem value="doctorate">Doctorate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">Institution</Label>
          <Input
            value={formData.institution || ""}
            onChange={(e) => onChange({ institution: e.target.value })}
            placeholder="e.g. Dalhousie University"
            className="h-10 text-base sm:text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">Graduation Year</Label>
          <Input
            type="number"
            value={formData.graduationYear || ""}
            onChange={(e) =>
              onChange({
                graduationYear: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
            min={1950}
            max={new Date().getFullYear()}
            placeholder="e.g. 2020"
            className="h-10 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Certifications</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCertification}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Certification
          </Button>
        </div>

        {certifications.map((cert, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 border rounded-lg bg-background"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={cert.name}
                onChange={(e) =>
                  updateCertification(index, "name", e.target.value)
                }
                placeholder="Certification name"
                className="h-10 text-base sm:text-sm"
              />
              <CertExpiryPicker
                value={cert.expiryDate}
                onChange={(date) =>
                  updateCertification(index, "expiryDate", date)
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeCertification(index)}
              className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {certifications.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No certifications added yet. Click "Add Certification" to get
            started.
          </p>
        )}
      </div>
    </div>
  );
};

const CertExpiryPicker = ({
  value,
  onChange,
}: {
  value?: string;
  onChange: (date: string) => void;
}) => {
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-10 justify-start text-left font-normal text-base sm:text-sm",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value
            ? format(parseISO(value), "MMM d, yyyy")
            : "Expiry date (optional)"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
            }
          }}
        />
      </PopoverContent>
    </Popover>
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