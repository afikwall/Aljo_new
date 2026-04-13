import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { IStaffProfilesEntity } from "@/product-types";

interface PersonalInfoSectionProps {
  formData: Partial<IStaffProfilesEntity>;
  email: string;
  isEditMode: boolean;
  onChange: (data: Partial<IStaffProfilesEntity>) => void;
}

export const PersonalInfoSection = ({
  formData,
  email,
  isEditMode,
  onChange,
}: PersonalInfoSectionProps) => {
  const [dateOpen, setDateOpen] = useState(false);

  const handleChange = useCallback(
    (field: keyof IStaffProfilesEntity, value: string) => {
      onChange({ [field]: value });
    },
    [onChange]
  );

  const selectedDate = formData.dateOfBirth
    ? parseISO(formData.dateOfBirth)
    : undefined;

  const currentYear = new Date().getFullYear();
  const fromYear = 1940;
  const toYear = currentYear - 16;

  const defaultMonth = useMemo(() => selectedDate || new Date(1990, 0), [selectedDate]);

  if (!isEditMode) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ViewField label="First Name" value={formData.firstName} />
        <ViewField label="Last Name" value={formData.lastName} />
        <ViewField label="Email" value={email} />
        <ViewField label="Phone" value={formData.phone} />
        <ViewField
          label="Date of Birth"
          value={
            formData.dateOfBirth
              ? format(parseISO(formData.dateOfBirth), "MMM d, yyyy")
              : undefined
          }
        />
        <div className="sm:col-span-2">
          <ViewField label="Bio" value={formData.bio} />
        </div>
        <div className="sm:col-span-2 pt-2">
          <Separator className="mb-4" />
          <div className="flex items-center gap-2 mb-3">
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ViewField label="Contact Name" value={formData.emergencyContactName} />
            <ViewField label="Contact Phone" value={formData.emergencyContactPhone} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label className="text-sm font-medium">First Name</Label>
        <Input
          value={formData.firstName || ""}
          onChange={(e) => handleChange("firstName", e.target.value)}
          placeholder="First name"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Last Name</Label>
        <Input
          value={formData.lastName || ""}
          onChange={(e) => handleChange("lastName", e.target.value)}
          placeholder="Last name"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Email</Label>
        <Input value={email} disabled className="h-10 text-base sm:text-sm bg-muted/50" />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Phone</Label>
        <Input
          value={formData.phone || ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="(555) 123-4567"
          type="tel"
          className="h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Date of Birth</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-10 justify-start text-left font-normal text-base sm:text-sm",
                !formData.dateOfBirth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dateOfBirth
                ? format(parseISO(formData.dateOfBirth), "MMM d, yyyy")
                : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onChange({ dateOfBirth: format(date, "yyyy-MM-dd") });
                }
                setDateOpen(false);
              }}
              defaultMonth={defaultMonth}
              fromYear={fromYear}
              toYear={toYear}
              captionLayout="dropdown"
              classNames={{
                caption: "flex justify-center pt-1 relative items-center gap-1",
                caption_label: "hidden",
                caption_dropdowns: "flex gap-1 items-center",
                dropdown: "text-sm border border-input rounded-md px-2 py-1 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring",
                dropdown_month: "flex-1",
                dropdown_year: "flex-1",
                nav: "space-x-1 flex items-center",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="sm:col-span-2 space-y-1">
        <Label className="text-sm font-medium">Bio</Label>
        <Textarea
          value={formData.bio || ""}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          className="min-h-[100px] text-base sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2 pt-2">
        <Separator className="mb-4" />
        <div className="flex items-center gap-2 mb-3">
          <PhoneCall className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Contact Name</Label>
            <Input
              value={formData.emergencyContactName || ""}
              onChange={(e) => handleChange("emergencyContactName", e.target.value)}
              placeholder="Full name"
              className="h-10 text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Contact Phone</Label>
            <Input
              value={formData.emergencyContactPhone || ""}
              onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
              placeholder="(555) 123-4567"
              type="tel"
              className="h-10 text-base sm:text-sm"
            />
          </div>
        </div>
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