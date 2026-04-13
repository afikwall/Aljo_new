import { useState, useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { ShiftApplicationsEntity, StaffProfilesEntity } from "@/product-types";
import type { IShiftsEntity } from "@/product-types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Users } from "lucide-react";
import { format, parseISO, addDays, isAfter, isBefore } from "date-fns";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { cn } from "@/lib/utils";

interface StaffActivityCardProps {
  facilityProfileId: string;
  shifts: IShiftsEntity[];
  isLoadingShifts: boolean;
  onStaffClick?: (staffProfileId: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  RN: "bg-chart-1 text-primary-foreground",
  LPN: "bg-chart-2 text-primary-foreground",
  CCA: "bg-chart-3 text-primary-foreground",
  CITR: "bg-chart-4 text-primary-foreground",
};

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "??";
}

function formatShiftTime(startDateTime?: string, endDateTime?: string): string {
  if (!startDateTime) return "Time not set";
  try {
    const start = parseISO(startDateTime);
    const dateStr = format(start, "EEE, MMM d");
    const startTime = format(start, "h:mm a");
    if (!endDateTime) return `${dateStr} • ${startTime}`;
    const end = parseISO(endDateTime);
    const endTime = format(end, "h:mm a");
    return `${dateStr} • ${startTime} - ${endTime}`;
  } catch {
    return "Invalid date";
  }
}

type ActiveView = "upcoming" | "withdrawals";

export const StaffActivityCard = ({
  facilityProfileId,
  shifts,
  isLoadingShifts,
  onStaffClick,
}: StaffActivityCardProps) => {
  const [activeView, setActiveView] = useState<ActiveView>("upcoming");

  const { data: allApplications, isLoading: loadingApplications } =
    useEntityGetAll(ShiftApplicationsEntity);

  const { data: allStaffProfiles, isLoading: loadingStaff } =
    useEntityGetAll(StaffProfilesEntity);

  // --- Shared data structures ---

  const facilityShiftIds = useMemo(() => {
    const ids = new Set<string>();
    shifts?.forEach((s) => {
      if (s.id) ids.add(s.id);
    });
    return ids;
  }, [shifts]);

  const shiftMap = useMemo(() => {
    const map = new Map<string, IShiftsEntity>();
    shifts?.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return map;
  }, [shifts]);

  const staffMap = useMemo(() => {
    const map = new Map<string, typeof StaffProfilesEntity["instanceType"] & { id: string }>();
    allStaffProfiles?.forEach((sp) => {
      if ((sp as any).id) {
        map.set((sp as any).id, sp as any);
      }
    });
    return map;
  }, [allStaffProfiles]);

  // --- Withdrawals ---

  const withdrawals = useMemo(() => {
    if (!allApplications) return [];

    const filtered = allApplications.filter((app) => {
      const status = app.status;
      if (status !== "withdrawal_pending" && status !== "withdrawn") return false;
      if (!app.shiftProfileId) return false;
      return facilityShiftIds.has(app.shiftProfileId);
    });

    filtered.sort((a, b) => {
      const aPending = a.status === "withdrawal_pending";
      const bPending = b.status === "withdrawal_pending";
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      const aDate = a.updatedAt || a.appliedAt || "";
      const bDate = b.updatedAt || b.appliedAt || "";
      return bDate.localeCompare(aDate);
    });

    return filtered;
  }, [allApplications, facilityShiftIds]);

  // --- Upcoming Staff ---

  type ShiftStaffEntry = {
    shiftId: string;
    staffProfileId: string;
    startDateTime: string;
    endDateTime?: string;
    requiredRole?: string;
    staffFirstName?: string;
    staffLastName?: string;
    staffRoleType?: string;
    staffPhotoUrl?: string;
    dateKey: string;
  };

  const groupedUpcoming = useMemo(() => {
    if (!shifts || !allApplications || !allStaffProfiles) return [];

    const now = new Date();
    const cutoff = addDays(now, 14);

    const upcomingShifts = shifts.filter((s) => {
      if (!s.startDateTime) return false;
      if (
        s.status !== "claimed" &&
        s.status !== "assigned" &&
        s.status !== "in_progress"
      )
        return false;
      try {
        const start = parseISO(s.startDateTime);
        return isAfter(start, now) && isBefore(start, cutoff);
      } catch {
        return false;
      }
    });

    if (upcomingShifts.length === 0) return [];

    const upcomingShiftIds = new Set(upcomingShifts.map((s) => s.id));

    const approvedApps = allApplications.filter(
      (a) =>
        a.status === "approved" &&
        a.shiftProfileId &&
        upcomingShiftIds.has(a.shiftProfileId)
    );

    if (approvedApps.length === 0) return [];

    const upcomingShiftMap = new Map(upcomingShifts.map((s) => [s.id, s]));

    const entries: ShiftStaffEntry[] = [];

    for (const app of approvedApps) {
      if (!app.shiftProfileId || !app.staffProfileId) continue;
      const shift = upcomingShiftMap.get(app.shiftProfileId);
      const staff = staffMap.get(app.staffProfileId);
      if (!shift || !staff) continue;
      if (!shift.startDateTime) continue;

      let dateKey = "";
      try {
        dateKey = format(parseISO(shift.startDateTime), "EEE, MMM d");
      } catch {
        continue;
      }

      entries.push({
        shiftId: shift.id,
        staffProfileId: app.staffProfileId,
        startDateTime: shift.startDateTime,
        endDateTime: shift.endDateTime,
        requiredRole: shift.requiredRole,
        staffFirstName: (staff as any).firstName,
        staffLastName: (staff as any).lastName,
        staffRoleType: (staff as any).roleType,
        staffPhotoUrl: (staff as any).profilePhotoUrl,
        dateKey,
      });
    }

    if (entries.length === 0) return [];

    entries.sort((a, b) => {
      try {
        return (
          parseISO(a.startDateTime).getTime() -
          parseISO(b.startDateTime).getTime()
        );
      } catch {
        return 0;
      }
    });

    const grouped: { dateKey: string; entries: ShiftStaffEntry[] }[] = [];
    const seenDates = new Map<string, number>();

    for (const entry of entries) {
      if (seenDates.has(entry.dateKey)) {
        grouped[seenDates.get(entry.dateKey)!].entries.push(entry);
      } else {
        seenDates.set(entry.dateKey, grouped.length);
        grouped.push({ dateKey: entry.dateKey, entries: [entry] });
      }
    }

    return grouped;
  }, [shifts, allApplications, allStaffProfiles, staffMap]);

  const isLoading = isLoadingShifts || loadingApplications || loadingStaff;

  const withdrawalCount = withdrawals.length;
  const upcomingStaffCount = groupedUpcoming.reduce(
    (sum, g) => sum + g.entries.length,
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">Staff Activity</CardTitle>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Button
              variant={activeView === "upcoming" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs gap-1.5"
              onClick={() => setActiveView("upcoming")}
            >
              <Users className="h-3.5 w-3.5" />
              Upcoming Staff
              {upcomingStaffCount > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 min-w-[18px] h-[18px] text-[10px] font-semibold",
                    activeView === "upcoming"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {upcomingStaffCount}
                </span>
              )}
            </Button>
            <Button
              variant={activeView === "withdrawals" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs gap-1.5"
              onClick={() => setActiveView("withdrawals")}
            >
              <LogOut className="h-3.5 w-3.5" />
              Withdrawals
              {withdrawalCount > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 min-w-[18px] h-[18px] text-[10px] font-semibold",
                    activeView === "withdrawals"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {withdrawalCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {activeView === "upcoming" ? (
          <div className="p-4 pt-0">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : groupedUpcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-semibold">No upcoming assigned staff</p>
                <p className="text-xs text-muted-foreground text-center">
                  Staff will appear here once they are assigned to upcoming shifts
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {groupedUpcoming.map((group) => (
                  <div key={group.dateKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        {group.dateKey}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.entries.map((entry, idx) => {
                        const initials = [
                          entry.staffFirstName?.charAt(0),
                          entry.staffLastName?.charAt(0),
                        ]
                          .filter(Boolean)
                          .join("")
                          .toUpperCase();

                        let shiftTimeLabel = "";
                        try {
                          if (entry.startDateTime && entry.endDateTime) {
                            const start = parseISO(entry.startDateTime);
                            const end = parseISO(entry.endDateTime);
                            shiftTimeLabel = `${format(start, "EEE, MMM d")} • ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
                          } else if (entry.startDateTime) {
                            shiftTimeLabel = format(
                              parseISO(entry.startDateTime),
                              "EEE, MMM d • h:mm a"
                            );
                          }
                        } catch {
                          shiftTimeLabel = "";
                        }

                        return (
                          <div
                            key={`${entry.shiftId}-${idx}`}
                            className={cn(
                              "flex items-center gap-3 min-h-[44px] rounded-lg px-2 py-2 transition-colors",
                              onStaffClick
                                ? "cursor-pointer hover:bg-accent/50"
                                : "hover:bg-accent/50"
                            )}
                            onClick={() => {
                              if (onStaffClick && entry.staffProfileId) {
                                onStaffClick(entry.staffProfileId);
                              }
                            }}
                          >
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage
                                src={entry.staffPhotoUrl}
                                alt={`${entry.staffFirstName ?? ""} ${entry.staffLastName ?? ""}`}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {initials || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold truncate">
                                  {[entry.staffFirstName, entry.staffLastName]
                                    .filter(Boolean)
                                    .join(" ") || "Unknown Staff"}
                                </span>
                                {entry.staffRoleType && (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs px-1.5 py-0",
                                      getRoleBadgeColor(entry.staffRoleType)
                                    )}
                                  >
                                    {entry.staffRoleType}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {shiftTimeLabel}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {entry.requiredRole && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs",
                                    getRoleBadgeColor(entry.requiredRole)
                                  )}
                                >
                                  {entry.requiredRole}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : withdrawalCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                <LogOut className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">No withdrawals</p>
                <p className="text-sm text-muted-foreground">
                  No staff members have withdrawn from shifts
                </p>
              </div>
            ) : (
              <ul>
                {withdrawals.map((app, index) => {
                  const staffProfile = app.staffProfileId
                    ? staffMap.get(app.staffProfileId)
                    : undefined;
                  const shift = app.shiftProfileId
                    ? shiftMap.get(app.shiftProfileId)
                    : undefined;

                  const firstName = (staffProfile as any)?.firstName;
                  const lastName = (staffProfile as any)?.lastName;
                  const email = (staffProfile as any)?.email;
                  const displayName =
                    firstName || lastName
                      ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
                      : email || "Unknown Staff";
                  const initials = getInitials(firstName, lastName, email);
                  const roleType = (staffProfile as any)?.roleType;
                  const isPending = app.status === "withdrawal_pending";

                  return (
                    <li key={(app as any).id || index}>
                      {index > 0 && <Separator />}
                      <div
                        className={cn(
                          "flex items-center gap-3 p-4 min-h-[44px] transition-colors",
                          onStaffClick && app.staffProfileId
                            ? "cursor-pointer hover:bg-accent/50"
                            : ""
                        )}
                        onClick={() => {
                          if (onStaffClick && app.staffProfileId) {
                            onStaffClick(app.staffProfileId);
                          }
                        }}
                      >
                        <div className="flex-shrink-0 size-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {initials}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className="font-semibold text-sm leading-tight truncate">
                            {displayName}
                          </span>
                          {roleType && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium w-fit",
                                ROLE_COLORS[roleType] ?? "bg-muted text-muted-foreground"
                              )}
                            >
                              {roleType}
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-xs text-muted-foreground text-center hidden sm:block max-w-[180px]">
                          {formatShiftTime(shift?.startDateTime, shift?.endDateTime)}
                        </div>
                        <div className="flex-shrink-0 ml-auto">
                          <Badge
                            className={cn(
                              "text-xs whitespace-nowrap",
                              isPending
                                ? "bg-chart-2/20 text-chart-2 hover:bg-chart-2/20"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {isPending ? "Withdrawal Pending" : "Withdrawn"}
                          </Badge>
                        </div>
                      </div>
                      <div className="px-4 pb-3 text-xs text-muted-foreground sm:hidden">
                        {formatShiftTime(shift?.startDateTime, shift?.endDateTime)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};