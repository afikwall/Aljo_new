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

interface RemoveFMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  facilityName: string;
  isRemoving: boolean;
  onConfirm: () => void;
}

export const RemoveFMDialog = ({
  open,
  onOpenChange,
  email,
  facilityName,
  isRemoving,
  onConfirm,
}: RemoveFMDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Facility Manager?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {email}&apos;s access to {facilityName}. Their user
            account will not be deleted — they will simply no longer be linked to
            this facility.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? "Removing..." : "Remove Access"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};