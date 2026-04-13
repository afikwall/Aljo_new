import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { HolidaysEntity, LoginPage } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, ChevronDown, Info, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO, isToday, isBefore, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay, getDay } from "date-fns";
import { getPageUrl } from "@/lib/utils";

export default function StaffHolidaysPage() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const { data: holidays, isLoading } = useEntityGetAll(HolidaysEntity);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pastHolidaysOpen, setPastHolidaysOpen] = useState(false);

  // Filter holidays for current and next year, sorted by date
  const filteredHolidays = useMemo(() => {
    if (!holidays) return [];
    return holidays
      .filter((h) => h.year === currentYear || h.year === nextYear)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      });
  }, [holidays, currentYear, nextYear]);

  // Split into upcoming and past
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    return filteredHolidays.filter((h) => {
      if (!h.date) return false;
      return !isBefore(parseISO(h.date), today) || isToday(parseISO(h.date));
    });
  }, [filteredHolidays]);

  const pastHolidays = useMemo(() => {
    const today = new Date();
    return filteredHolidays.filter((h) => {
      if (!h.date) return false;
      return isBefore(parseISO(h.date), today) && !isToday(parseISO(h.date));
    });
  }, [filteredHolidays]);

  // Build a Set of holiday dates for quick lookup
  const holidayDatesSet = useMemo(() => {
    const set = new Set<string>();
    filteredHolidays.forEach((h) => {
      if (h.date) {
        set.add(h.date);
      }
    });
    return set;
  }, [filteredHolidays]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (holidayDatesSet.has(dateStr)) {
      const element = document.getElementById(`holiday-${dateStr}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [holidayDatesSet]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDay = getDay(monthStart);
    const daysInMonth = monthEnd.getDate();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }

    return days;
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Nova Scotia Statutory Holidays</h1>
        <p className="text-sm text-muted-foreground">
          Shifts worked on statutory holidays are paid at 1.5× your regular rate
        </p>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-center">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div key={day} className="text-xs font-medium text-muted-foreground text-center uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-10" />;
              }

              const dateStr = format(day, "yyyy-MM-dd");
              const isHoliday = holidayDatesSet.has(dateStr);
              const isTodayDate = isToday(day);
              const isOtherMonth = !isSameMonth(day, currentMonth);

              return (
                <div
                  key={dateStr}
                  className={`h-10 w-full flex flex-col items-center justify-center rounded-lg text-sm ${
                    isHoliday
                      ? "bg-chart-3/15 text-chart-3 font-semibold cursor-pointer hover:bg-chart-3/25"
                      : ""
                  } ${isTodayDate ? "ring-2 ring-primary ring-offset-1" : ""} ${
                    isOtherMonth ? "text-muted-foreground/40" : ""
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <span>{day.getDate()}</span>
                  {isHoliday && <span className="text-[8px]">★</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Holidays Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Upcoming Holidays</h2>
          <Badge variant="outline">{upcomingHolidays.length}</Badge>
        </div>

        {upcomingHolidays.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-base">No upcoming holidays</p>
            <p className="text-sm text-muted-foreground mt-1">
              All holidays for this year have passed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingHolidays.map((holiday) => {
              if (!holiday.date) return null;
              const holidayDate = parseISO(holiday.date);
              const daysAway = differenceInDays(holidayDate, new Date());

              return (
                <Card
                  key={holiday.id}
                  id={`holiday-${holiday.date}`}
                  className="border-l-4 border-l-chart-3 bg-chart-3/5"
                >
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-base">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(holidayDate, "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                      <Badge className="bg-accent/20 text-accent shrink-0">1.5× Pay</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {daysAway === 0
                        ? "Today"
                        : daysAway === 1
                        ? "Tomorrow"
                        : `${daysAway} days away`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Holidays Section */}
      {pastHolidays.length > 0 && (
        <Collapsible open={pastHolidaysOpen} onOpenChange={setPastHolidaysOpen}>
          <div className="space-y-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-sm">
                <span className="font-semibold">
                  {pastHolidaysOpen ? "Hide" : "Show"} Past Holidays ({pastHolidays.length})
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${pastHolidaysOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-3">
              {pastHolidays.map((holiday) => {
                if (!holiday.date) return null;
                const holidayDate = parseISO(holiday.date);
                const daysAgo = differenceInDays(new Date(), holidayDate);

                return (
                  <Card
                    key={holiday.id}
                    id={`holiday-${holiday.date}`}
                    className="border-l-4 border-l-muted bg-muted/30 opacity-70"
                  >
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-base">{holiday.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(holidayDate, "EEEE, MMMM d, yyyy")}
                          </p>
                        </div>
                        <Badge className="bg-muted text-muted-foreground shrink-0">1.5× Pay</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">About Holiday Pay</p>
          <p className="text-sm text-muted-foreground mt-1">
            When you work a shift on a statutory holiday, both your pay and the facility billing rate are multiplied by 1.5×. Holiday shifts are automatically detected when posted. Look for the holiday badge on available shifts.
          </p>
        </div>
      </div>
    </div>
  );
}