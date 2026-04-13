import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { useCallback } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  isLoading?: boolean;
  trend?: string;
  iconClassName?: string;
  href?: string;
}

export function StatsCard({ title, value, icon: Icon, isLoading, trend, iconClassName, href }: StatsCardProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (href) {
      navigate(href);
    }
  }, [href, navigate]);

  return (
    <Card
      className={cn(href && "cursor-pointer transition-shadow hover:shadow-md")}
      onClick={href ? handleClick : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}