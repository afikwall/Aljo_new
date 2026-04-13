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
import { Loader2, XCircle } from "lucide-react";
import { useExecuteAction, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { ProcessEarlyPayRequestAction } from "@/product-types";
import { toast } from "sonner";
import { formatCAD } from "@/utils/earlyPayUtils";

interface DenyEarlyPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  staffName: string;
  amountRequested: number;
  onSuccess: () => void;
}

export const DenyEarlyPayDialog = ({
  open,
  onOpenChange,
  requestId,
  staffName,
  amountRequested,
  onSuccess,
}: DenyEarlyPayDialogProps) => {
  const user = useUser();
  const [denialReason, setDenialReason] = useState("");

  const { executeFunction, isLoading } = useExecuteAction(
    ProcessEarlyPayRequestAction
  );

  const handleDeny = useCallback(async () => {
    if (!denialReason.trim()) {
      toast.error("Please provide a reason for denying");
      return;
    }

    try {
      const result = await executeFunction({
        requestId,
        action: "deny",
        reviewedByEmail: user.email || "",
        denialReason: denialReason.trim(),
      });

      if (result?.success) {
        toast.success(result.message || "Early pay request denied");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to deny request");
      }
    } catch {
      toast.error("Failed to deny request. Please try again.");
    }
  }, [requestId, denialReason, user.email, executeFunction, onOpenChange, onSuccess]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setDenialReason("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Deny Early Pay Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deny early pay request from{" "}
            <span className="font-medium text-foreground">{staffName}</span> for{" "}
            <span className="font-medium text-foreground">
              {formatCAD(amountRequested)}
            </span>
            . A reason is required.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="denial-reason" className="text-sm font-medium">
            Denial Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="denial-reason"
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="e.g. Insufficient earned wages to cover request"
            rows={3}
            className="text-base resize-none"
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeny}
            disabled={isLoading || !denialReason.trim()}
            className="h-11"
          >
            {isLoading ? (
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