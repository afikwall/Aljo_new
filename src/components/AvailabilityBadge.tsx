import { Badge } from "@/components/ui/badge";
import { CalendarCheck, CalendarDays } from "lucide-react";

interface AvailabilityBadgeProps {
  isAvailabilitySet?: boolean;
}

export const AvailabilityBadge = ({
  isAvailabilitySet,
}: AvailabilityBadgeProps) => {
  if (isAvailabilitySet) {
    return (
      <Badge className="bg-accent/20 text-accent gap-1 text-xs">
        <CalendarCheck className="h-3 w-3" />
        Set
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
      <CalendarDays className="h-3 w-3" />
      Not Set
    </Badge>
  );
};