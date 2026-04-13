import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import {
  useUser,
  useEntityGetAll,
  useEntityUpdate,
  useEntityCreate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router";
import { cn, getPageUrl } from "@/lib/utils";
import {
  NotificationsEntity,
  NotificationsPage,
  StaffProfilesEntity,
  FacilityManagerProfilesEntity,
} from "@/product-types";
import { NotificationRow } from "@/components/NotificationRow";
import {
  type NotificationInstance,
  getUnreadNotificationCount,
  isNotificationUnread,
  formatNotificationBadge,
  sortNotificationsDesc,
} from "@/utils/notificationUtils";
import { useIsMobile } from "@/hooks/use-mobile";

const DROPDOWN_LIMIT = 10;

export const NotificationBell = () => {
  const user = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Fetch notifications for current user
  const { data: rawNotifications, isLoading: loadingNotifications } =
    useEntityGetAll(NotificationsEntity, { recipientEmail: user.email }, { enabled: user.isAuthenticated });

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

  // Update hooks for marking last viewed
  const { updateFunction: updateStaffProfile } =
    useEntityUpdate(StaffProfilesEntity);
  const { createFunction: createStaffProfile } =
    useEntityCreate(StaffProfilesEntity);
  const { updateFunction: updateFmProfile } =
    useEntityUpdate(FacilityManagerProfilesEntity);
  const { createFunction: createFmProfile } =
    useEntityCreate(FacilityManagerProfilesEntity);

  // Get the lastViewedNotificationsDate based on role
  const lastViewedDate = useMemo(() => {
    if (user.role === "staff") {
      const profile = staffProfilesData?.[0] as any;
      return profile?.lastViewedNotificationsDate || null;
    }
    if (user.role === "facility_manager") {
      const profile = fmProfilesData?.[0] as any;
      return profile?.lastViewedNotificationsDate || null;
    }
    // Admin has no extension entity, treat all as unread
    return null;
  }, [user.role, staffProfilesData, fmProfilesData]);

  // Sort and prepare notifications
  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return sortNotificationsDesc(rawNotifications as unknown as NotificationInstance[]);
  }, [rawNotifications]);

  const recentNotifications = useMemo(
    () => notifications.slice(0, DROPDOWN_LIMIT),
    [notifications]
  );

  const unreadCount = useMemo(
    () => getUnreadNotificationCount(notifications, lastViewedDate),
    [notifications, lastViewedDate]
  );

  const badgeText = useMemo(
    () => formatNotificationBadge(unreadCount),
    [unreadCount]
  );

  // Update lastViewedNotificationsDate when dropdown opens
  const handleOpenChange = useCallback(
    async (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen && user.isAuthenticated) {
        const now = new Date().toISOString();
        try {
          if (user.role === "staff") {
            const profile = staffProfilesData?.[0] as any;
            if (profile?.id) {
              await updateStaffProfile({
                id: profile.id,
                data: { lastViewedNotificationsDate: now },
              });
            } else {
              await createStaffProfile({
                data: {
                  email: user.email,
                  lastViewedNotificationsDate: now,
                },
              });
            }
          } else if (user.role === "facility_manager") {
            const profile = fmProfilesData?.[0] as any;
            if (profile?.id) {
              await updateFmProfile({
                id: profile.id,
                data: { lastViewedNotificationsDate: now },
              });
            } else {
              await createFmProfile({
                data: {
                  email: user.email,
                  lastViewedNotificationsDate: now,
                },
              });
            }
          }
          // Admin: no extension entity to update
        } catch {
          // Silently fail - don't break the UX
        }
      }
    },
    [
      user,
      staffProfilesData,
      fmProfilesData,
      updateStaffProfile,
      createStaffProfile,
      updateFmProfile,
      createFmProfile,
    ]
  );

  const handleNotificationClick = useCallback(
    (notification: NotificationInstance) => {
      setOpen(false);
      if (notification.linkUrl) {
        navigate(notification.linkUrl);
      }
    },
    [navigate]
  );

  const notificationsPageUrl = getPageUrl(NotificationsPage);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {badgeText && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {badgeText}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          "p-0",
          isMobile ? "w-80" : "w-96"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {unreadCount} new
            </Badge>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[480px] overflow-y-auto">
          {loadingNotifications ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                We&apos;ll let you know when something arrives
              </p>
            </div>
          ) : (
            recentNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                isUnread={isNotificationUnread(notification, lastViewedDate)}
                onClick={handleNotificationClick}
                truncateBody
              />
            ))
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <div className="border-t px-4 py-3 text-center">
            <Link
              to={notificationsPageUrl}
              onClick={() => setOpen(false)}
              className="text-sm text-primary hover:underline"
            >
              View All Notifications →
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};