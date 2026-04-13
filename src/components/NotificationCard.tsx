import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NotificationTypeIcon } from "@/components/NotificationTypeIcon";
import { formatTimeAgo, type NotificationInstance } from "@/utils/notificationUtils";

interface NotificationCardProps {
  notification: NotificationInstance;
  isUnread: boolean;
}

export const NotificationCard = ({
  notification,
  isUnread,
}: NotificationCardProps) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  }, [notification.linkUrl, navigate]);

  return (
    <Card
      className={cn(
        "transition-colors",
        notification.linkUrl && "cursor-pointer hover:bg-muted/50",
        isUnread && "border-primary/20 bg-primary/5"
      )}
      onClick={handleClick}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <NotificationTypeIcon type={notification.notificationType} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight">
              {notification.title || "Notification"}
            </p>
            {isUnread && (
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {notification.body}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};