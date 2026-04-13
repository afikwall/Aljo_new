import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import {
  useUser,
  useEntityGetAll,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageUrl } from "@/lib/utils";
import {
  NotificationsEntity,
  StaffProfilesEntity,
  FacilityManagerProfilesEntity,
  LoginPage,
} from "@/product-types";
import { NotificationCard } from "@/components/NotificationCard";
import { NotificationFilterChips } from "@/components/NotificationFilterChips";
import {
  type NotificationInstance,
  type NotificationFilterCategory,
  isNotificationUnread,
  filterNotificationsByCategory,
  sortNotificationsDesc,
} from "@/utils/notificationUtils";

export default function NotificationsPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilterCategory>("all");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  // Fetch all notifications for user
  const { data: rawNotifications, isLoading } = useEntityGetAll(
    NotificationsEntity,
    { recipientEmail: user.email },
    { enabled: user.isAuthenticated }
  );

  // Fetch user profile for lastViewedNotificationsDate
  const { data: staffProfilesData } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated && user.role === "staff" }
  );
  const { data: fmProfilesData } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated && user.role === "facility_manager" }
  );

  const lastViewedDate = useMemo(() => {
    if (user.role === "staff") {
      const profile = staffProfilesData?.[0] as any;
      return profile?.lastViewedNotificationsDate || null;
    }
    if (user.role === "facility_manager") {
      const profile = fmProfilesData?.[0] as any;
      return profile?.lastViewedNotificationsDate || null;
    }
    return null;
  }, [user.role, staffProfilesData, fmProfilesData]);

  // Sorted notifications
  const allNotifications = useMemo(() => {
    if (!rawNotifications) return [];
    return sortNotificationsDesc(
      rawNotifications as unknown as NotificationInstance[]
    );
  }, [rawNotifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(
    () => filterNotificationsByCategory(allNotifications, activeFilter),
    [allNotifications, activeFilter]
  );

  const handleFilterChange = useCallback(
    (category: NotificationFilterCategory) => {
      setActiveFilter(category);
    },
    []
  );

  if (!user.isAuthenticated) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Your activity feed</p>
      </div>

      {/* Filter chips */}
      <NotificationFilterChips
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed">
          <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">No notifications</p>
          <p className="text-xs text-muted-foreground">
            {activeFilter === "all"
              ? "You're all caught up!"
              : `No ${activeFilter.replace("_", " ")} notifications yet`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isUnread={isNotificationUnread(notification, lastViewedDate)}
            />
          ))}
        </div>
      )}
    </div>
  );
}