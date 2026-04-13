import { Badge } from "@/components/ui/badge";
import { getPaymentStatusStyle } from "@/utils/timesheetUtils";

interface TimesheetStatusBadgeProps {
  status?: string;
}

export const TimesheetStatusBadge = ({ status }: TimesheetStatusBadgeProps) => {
  const { className, label } = getPaymentStatusStyle(status);

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
};