import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info";

interface HelpStatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-accent/20 text-accent",
  warning: "bg-chart-3/20 text-chart-3",
  danger: "bg-destructive/20 text-destructive",
  info: "bg-chart-1/20 text-chart-1",
};

export const HelpStatusBadge = ({ variant, children }: HelpStatusBadgeProps) => {
  return (
    <Badge className={cn("font-medium", variantStyles[variant])}>
      {children}
    </Badge>
  );
};