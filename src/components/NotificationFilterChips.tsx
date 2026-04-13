import { Button } from "@/components/ui/button";
import {
  type NotificationFilterCategory,
  FILTER_LABELS,
} from "@/utils/notificationUtils";

const FILTER_ORDER: NotificationFilterCategory[] = [
  "all",
  "shifts",
  "applications",
  "documents",
  "messages",
  "role_upgrades",
  "onboarding",
  "trades",
];

interface NotificationFilterChipsProps {
  activeFilter: NotificationFilterCategory;
  onFilterChange: (category: NotificationFilterCategory) => void;
}

export const NotificationFilterChips = ({
  activeFilter,
  onFilterChange,
}: NotificationFilterChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_ORDER.map((category) => (
        <Button
          key={category}
          variant={activeFilter === category ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => onFilterChange(category)}
        >
          {FILTER_LABELS[category]}
        </Button>
      ))}
    </div>
  );
};