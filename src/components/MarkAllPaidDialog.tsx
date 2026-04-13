import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCAD } from "@/utils/timesheetUtils";

interface MarkAllPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  totalAmount: number;
  onConfirm: () => void;
  isLoading: boolean;
}

export const MarkAllPaidDialog = ({
  open,
  onOpenChange,
  count,
  totalAmount,
  onConfirm,
  isLoading,
}: MarkAllPaidDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Bulk Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Mark {count} timesheet{count !== 1 ? "s" : ""} totaling{" "}
            <span className="font-semibold text-foreground">
              {formatCAD(totalAmount)}
            </span>{" "}
            as paid? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Processing…" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};