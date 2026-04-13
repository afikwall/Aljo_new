import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffAvailabilityEntity,
  StaffProfilesEntity,
  type StaffAvailabilityEntityDayOfWeekEnum,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  CalendarCheck,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DAYS_OF_WEEK,
  getDefaultAvailability,
  type AvailabilityMap,
  type DayAvailability,
} from "@/utils/availabilityUtils";

interface WeeklyAvailabilityGridProps {
  staffProfileId: string;
  staffEmail: string;
}

export const WeeklyAvailabilityGrid = ({
  staffProfileId,
  staffEmail,
}: WeeklyAvailabilityGridProps) => {
  const { data: existingRecords, isLoading: loadingAvailability } =
    useEntityGetAll(
      StaffAvailabilityEntity,
      { staffProfileId },
      { enabled: !!staffProfileId }
    );

  const { createFunction } = useEntityCreate(StaffAvailabilityEntity);
  const { updateFunction: updateAvailability } = useEntityUpdate(
    StaffAvailabilityEntity
  );
  const { updateFunction: updateProfile } = useEntityUpdate(
    StaffProfilesEntity
  );

  const [availabilityData, setAvailabilityData] = useState<AvailabilityMap>(
    getDefaultAvailability()
  );
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Populate from existing records
  useEffect(() => {
    if (loadingAvailability || initialized) return;

    if (existingRecords && existingRecords.length > 0) {
      const newData = getDefaultAvailability();
      for (const record of existingRecords) {
        if (record.dayOfWeek) {
          newData[record.dayOfWeek] = {
            isAvailable: record.isAvailable ?? true,
            startTime: record.startTime || "07:00",
            endTime: record.endTime || "19:00",
            notes: record.notes || "",
            recordId: record.id,
          };
        }
      }
      setAvailabilityData(newData);
    }
    setInitialized(true);
  }, [existingRecords, loadingAvailability, initialized]);

  const handleToggle = useCallback(
    (day: StaffAvailabilityEntityDayOfWeekEnum, checked: boolean) => {
      setAvailabilityData((prev) => ({
        ...prev,
        [day]: { ...prev[day], isAvailable: checked },
      }));
    },
    []
  );

  const handleTimeChange = useCallback(
    (
      day: StaffAvailabilityEntityDayOfWeekEnum,
      field: "startTime" | "endTime",
      value: string
    ) => {
      setAvailabilityData((prev) => ({
        ...prev,
        [day]: { ...prev[day], [field]: value },
      }));
    },
    []
  );

  const handleNotesChange = useCallback(
    (day: StaffAvailabilityEntityDayOfWeekEnum, value: string) => {
      setAvailabilityData((prev) => ({
        ...prev,
        [day]: { ...prev[day], notes: value },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      for (const day of DAYS_OF_WEEK) {
        const dayData = availabilityData[day.key];
        const payload = {
          staffProfileId,
          staffEmail,
          dayOfWeek: day.key,
          isAvailable: dayData.isAvailable,
          startTime: dayData.isAvailable ? dayData.startTime : "07:00",
          endTime: dayData.isAvailable ? dayData.endTime : "19:00",
          notes: dayData.isAvailable ? dayData.notes : "",
        };

        if (dayData.recordId) {
          await updateAvailability({
            id: dayData.recordId,
            data: payload,
          });
        } else {
          const created = await createFunction({ data: payload });
          if (created?.id) {
            setAvailabilityData((prev) => ({
              ...prev,
              [day.key]: { ...prev[day.key], recordId: created.id },
            }));
          }
        }
      }

      // Mark profile as availability set
      await updateProfile({
        id: staffProfileId,
        data: { isAvailabilitySet: true },
      });

      toast.success("Availability saved!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    availabilityData,
    staffProfileId,
    staffEmail,
    updateAvailability,
    createFunction,
    updateProfile,
  ]);

  if (loadingAvailability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            My Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          My Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Grid */}
        <div className="space-y-0 divide-y">
          {DAYS_OF_WEEK.map((day, index) => {
            const dayData = availabilityData[day.key];
            return (
              <div
                key={day.key}
                className={cn(
                  "py-3 first:pt-0 last:pb-0",
                  !dayData.isAvailable && "opacity-60"
                )}
              >
                {/* Day row - mobile stacked, desktop horizontal */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  {/* Day label + toggle */}
                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 sm:w-[180px] shrink-0">
                    <span className="font-semibold text-sm w-12">
                      {day.shortLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dayData.isAvailable}
                        onCheckedChange={(checked) =>
                          handleToggle(day.key, checked)
                        }
                      />
                      <span
                        className={cn(
                          "text-xs",
                          dayData.isAvailable
                            ? "text-accent font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {dayData.isAvailable ? "Available" : "Off"}
                      </span>
                    </div>
                  </div>

                  {/* Time inputs or "Not working" text */}
                  {dayData.isAvailable ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dayData.startTime}
                          onChange={(e) =>
                            handleTimeChange(day.key, "startTime", e.target.value)
                          }
                          className="h-9 text-sm w-[130px]"
                        />
                        <span className="text-muted-foreground text-sm">–</span>
                        <Input
                          type="time"
                          value={dayData.endTime}
                          onChange={(e) =>
                            handleTimeChange(day.key, "endTime", e.target.value)
                          }
                          className="h-9 text-sm w-[130px]"
                        />
                      </div>
                      <Input
                        value={dayData.notes}
                        onChange={(e) =>
                          handleNotesChange(day.key, e.target.value)
                        }
                        placeholder="e.g. prefer morning shifts"
                        className="h-8 text-xs"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Not working this day
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your availability helps facilities know when you prefer to work. You
            can still apply for shifts outside these hours.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CalendarCheck className="mr-2 h-5 w-5" />
              Save Availability
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};