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
import { Loader2 } from "lucide-react";

interface UnassignConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  isUnassigning: boolean;
  onConfirm: () => void;
}

export const UnassignConfirmDialog = ({
  open,
  onOpenChange,
  staffName,
  isUnassigning,
  onConfirm,
}: UnassignConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unassign Staff</AlertDialogTitle>
          <AlertDialogDescription>
            Unassign <span className="font-semibold text-foreground">{staffName}</span> from this shift?
            The shift will return to Open status.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnassigning} className="h-11">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isUnassigning}
            className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isUnassigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Unassigning...
              </>
            ) : (
              "Unassign"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};