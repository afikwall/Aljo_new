import { useEffect, useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffAvailabilityEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, formatTimeDisplay } from "@/utils/availabilityUtils";

interface WeeklyAvailabilityReadOnlyProps {
  staffProfileId: string;
}

export const WeeklyAvailabilityReadOnly = ({
  staffProfileId,
}: WeeklyAvailabilityReadOnlyProps) => {
  const { data: availabilityRecords, isLoading } = useEntityGetAll(
    StaffAvailabilityEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const availabilityByDay = useMemo(() => {
    if (!availabilityRecords) return new Map();
    const map = new Map<
      string,
      typeof StaffAvailabilityEntity["instanceType"]
    >();
    for (const record of availabilityRecords) {
      if (record.dayOfWeek) {
        map.set(record.dayOfWeek, record);
      }
    }
    return map;
  }, [availabilityRecords]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!availabilityRecords || availabilityRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarX className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No availability data found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 divide-y">
          {DAYS_OF_WEEK.map((day) => {
            const record = availabilityByDay.get(day.key);
            const isAvailable = record?.isAvailable ?? false;

            return (
              <div
                key={day.key}
                className={cn(
                  "flex items-start gap-3 py-2.5 first:pt-0 last:pb-0",
                  isAvailable ? "border-l-2 border-l-accent pl-3" : "border-l-2 border-l-muted pl-3"
                )}
              >
                <span className="font-semibold text-sm w-10 shrink-0 pt-0.5">
                  {day.shortLabel}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAvailable ? (
                      <>
                        <Badge className="bg-accent/20 text-accent text-xs">
                          Available
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeDisplay(record?.startTime || "")} –{" "}
                          {formatTimeDisplay(record?.endTime || "")}
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Not Available
                      </Badge>
                    )}
                  </div>
                  {isAvailable && record?.notes && (
                    <p className="text-xs text-muted-foreground italic mt-1 truncate">
                      {record.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};