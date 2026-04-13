import { cn } from "@/lib/utils";
import { NotificationTypeIcon } from "@/components/NotificationTypeIcon";
import { formatTimeAgo, type NotificationInstance } from "@/utils/notificationUtils";

interface NotificationRowProps {
  notification: NotificationInstance;
  isUnread: boolean;
  onClick: (notification: NotificationInstance) => void;
  truncateBody?: boolean;
}

export const NotificationRow = ({
  notification,
  isUnread,
  onClick,
  truncateBody = true,
}: NotificationRowProps) => {
  return (
    <button
      className={cn(
        "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
        isUnread && "bg-primary/5"
      )}
      onClick={() => onClick(notification)}
    >
      <NotificationTypeIcon type={notification.notificationType} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">
          {notification.title || "Notification"}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm text-muted-foreground",
            truncateBody && "line-clamp-2"
          )}
        >
          {notification.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
      {isUnread && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
};