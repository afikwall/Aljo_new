import React from "react";
import {
  Clock,
  CheckCircle,
  FileCheck,
  LogOut,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  UserCheck,
  ArrowLeftRight,
  Megaphone,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationsEntityNotificationTypeEnum } from "@/product-types";

interface NotificationTypeIconProps {
  type?: NotificationsEntityNotificationTypeEnum;
  className?: string;
}

const ICON_CONFIG: Record<
  NotificationsEntityNotificationTypeEnum,
  { icon: React.ElementType; colorClass: string }
> = {
  shift_reminder: { icon: Clock, colorClass: "text-chart-1 bg-chart-1/10" },
  application_update: { icon: CheckCircle, colorClass: "text-accent-foreground bg-accent" },
  document_review: { icon: FileCheck, colorClass: "text-chart-4 bg-chart-4/10" },
  withdrawal: { icon: LogOut, colorClass: "text-chart-3 bg-chart-3/10" },
  no_show: { icon: AlertTriangle, colorClass: "text-destructive bg-destructive/10" },
  message: { icon: MessageCircle, colorClass: "text-chart-2 bg-chart-2/10" },
  role_upgrade: { icon: TrendingUp, colorClass: "text-chart-3 bg-chart-3/10" },
  onboarding: { icon: UserCheck, colorClass: "text-accent-foreground bg-accent" },
  shift_trade: { icon: ArrowLeftRight, colorClass: "text-chart-1 bg-chart-1/10" },
  broadcast: { icon: Megaphone, colorClass: "text-chart-2 bg-chart-2/10" },
};

export const NotificationTypeIcon = ({
  type,
  className,
}: NotificationTypeIconProps) => {
  const config = type ? ICON_CONFIG[type] : null;
  const Icon = config?.icon || Bell;
  const colorClass = config?.colorClass || "text-muted-foreground bg-muted";

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        colorClass,
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
};