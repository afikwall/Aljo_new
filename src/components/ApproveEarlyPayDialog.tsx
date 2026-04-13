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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useExecuteAction, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { ProcessEarlyPayRequestAction } from "@/product-types";
import { toast } from "sonner";
import { formatCAD } from "@/utils/earlyPayUtils";

interface ApproveEarlyPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  staffName: string;
  amountRequested: number;
  onSuccess: () => void;
}

export const ApproveEarlyPayDialog = ({
  open,
  onOpenChange,
  requestId,
  staffName,
  amountRequested,
  onSuccess,
}: ApproveEarlyPayDialogProps) => {
  const user = useUser();
  const [amount, setAmount] = useState(amountRequested.toString());

  const { executeFunction, isLoading } = useExecuteAction(
    ProcessEarlyPayRequestAction
  );

  const handleApprove = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const result = await executeFunction({
        requestId,
        action: "approve",
        reviewedByEmail: user.email || "",
        amountApproved: parsedAmount,
      });

      if (result?.success) {
        toast.success(result.message || "Early pay request approved!");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result?.message || "Failed to approve request");
      }
    } catch {
      toast.error("Failed to approve request. Please try again.");
    }
  }, [requestId, amount, user.email, executeFunction, onOpenChange, onSuccess]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setAmount(amountRequested.toString());
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, amountRequested]
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Approve Early Pay Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            Approve early pay request from{" "}
            <span className="font-medium text-foreground">{staffName}</span> for{" "}
            <span className="font-medium text-foreground">
              {formatCAD(amountRequested)}
            </span>
            . You can adjust the approved amount below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="approve-amount" className="text-sm font-medium">
            Approved Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="approve-amount"
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7 h-11 text-base"
            />
          </div>
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
            onClick={handleApprove}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className="h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};