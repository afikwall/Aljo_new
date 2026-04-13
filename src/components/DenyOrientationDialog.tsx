import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { IOrientationsEntity } from "@/product-types";

interface DenyOrientationDialogProps {
  orientation: (IOrientationsEntity & { id: string }) | null;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    orientationId: string;
    reason: string;
  }) => Promise<void>;
  isDenying: boolean;
}

export const DenyOrientationDialog = ({
  orientation,
  staffName,
  open,
  onOpenChange,
  onConfirm,
  isDenying,
}: DenyOrientationDialogProps) => {
  const [reason, setReason] = useState("");

  const resetForm = useCallback(() => {
    setReason("");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm]
  );

  const handleConfirm = useCallback(async () => {
    if (!orientation) return;

    await onConfirm({
      orientationId: orientation.id,
      reason: reason.trim(),
    });

    resetForm();
  }, [orientation, reason, onConfirm, resetForm]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deny Orientation Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deny the orientation request from{" "}
            <span className="font-medium text-foreground">{staffName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="deny-reason">
            Reason <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="deny-reason"
            placeholder="Provide a reason for denying this request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDenying}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDenying}
          >
            {isDenying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Denying...
              </>
            ) : (
              "Deny Request"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};