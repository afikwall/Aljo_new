import { formatDistanceToNow, parseISO } from "date-fns";
import type { NotificationsEntityNotificationTypeEnum } from "@/product-types";

/**
 * Notification instance type with system fields
 */
export interface NotificationInstance {
  id: string;
  createdAt: string;
  updatedAt: string;
  recipientEmail?: string;
  notificationType?: NotificationsEntityNotificationTypeEnum;
  title?: string;
  body?: string;
  linkUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

/**
 * Filter category types for the full notifications page
 */
export type NotificationFilterCategory =
  | "all"
  | "shifts"
  | "applications"
  | "documents"
  | "messages"
  | "role_upgrades"
  | "onboarding"
  | "trades";

/**
 * Mapping from filter category to notification types
 */
export const FILTER_CATEGORY_MAP: Record<
  NotificationFilterCategory,
  NotificationsEntityNotificationTypeEnum[] | null
> = {
  all: null,
  shifts: ["shift_reminder"],
  applications: ["application_update", "withdrawal"],
  documents: ["document_review"],
  messages: ["message", "broadcast"],
  role_upgrades: ["role_upgrade"],
  onboarding: ["onboarding"],
  trades: ["shift_trade"],
};

/**
 * Display labels for filter categories
 */
export const FILTER_LABELS: Record<NotificationFilterCategory, string> = {
  all: "All",
  shifts: "Shifts",
  applications: "Applications",
  documents: "Documents",
  messages: "Messages",
  role_upgrades: "Role Upgrades",
  onboarding: "Onboarding",
  trades: "Trades",
};

/**
 * Calculate unread notification count based on lastViewedNotificationsDate
 */
export const getUnreadNotificationCount = (
  notifications: NotificationInstance[],
  lastViewedDate: string | null | undefined
): number => {
  if (!notifications || notifications.length === 0) return 0;
  if (!lastViewedDate) return notifications.length;

  const lastViewedTime = new Date(lastViewedDate).getTime();
  return notifications.filter((n) => {
    const createdTime = new Date(n.createdAt).getTime();
    return createdTime > lastViewedTime;
  }).length;
};

/**
 * Check if a notification is unread based on lastViewedNotificationsDate
 */
export const isNotificationUnread = (
  notification: NotificationInstance,
  lastViewedDate: string | null | undefined
): boolean => {
  if (!lastViewedDate) return true;
  const lastViewedTime = new Date(lastViewedDate).getTime();
  const createdTime = new Date(notification.createdAt).getTime();
  return createdTime > lastViewedTime;
};

/**
 * Format a date as relative time (e.g. "2 hours ago", "Yesterday")
 */
export const formatTimeAgo = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
};

/**
 * Format unread notification badge count (caps at 99+)
 */
export const formatNotificationBadge = (count: number): string => {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
};

/**
 * Filter notifications by category
 */
export const filterNotificationsByCategory = (
  notifications: NotificationInstance[],
  category: NotificationFilterCategory
): NotificationInstance[] => {
  const types = FILTER_CATEGORY_MAP[category];
  if (!types) return notifications;
  return notifications.filter(
    (n) => n.notificationType && types.includes(n.notificationType)
  );
};

/**
 * Sort notifications by createdAt descending (most recent first)
 */
export const sortNotificationsDesc = (
  notifications: NotificationInstance[]
): NotificationInstance[] => {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};