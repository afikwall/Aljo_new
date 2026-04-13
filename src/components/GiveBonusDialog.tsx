import { useState, useMemo, useCallback } from "react";
import { useExecuteAction, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { GiveBonusActionAction, BonusesEntity } from "@/product-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Gift,
  Loader2,
  Info,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getCurrentPayPeriod, getPayPeriodLabel } from "@/utils/reportUtils";

interface GiveBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  staffEmail: string;
  awardedByEmail: string;
  onSuccess?: () => void;
}

export const GiveBonusDialog = ({
  open,
  onOpenChange,
  staffId,
  staffName,
  staffEmail,
  awardedByEmail,
  onSuccess,
}: GiveBonusDialogProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { executeFunction: giveBonus, isLoading } = useExecuteAction(GiveBonusActionAction);

  const payPeriod = useMemo(() => getCurrentPayPeriod(), []);
  const payPeriodLabel = useMemo(() => getPayPeriodLabel(payPeriod), [payPeriod]);

  const handleSubmit = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid bonus amount greater than $0.00");
      return;
    }

    try {
      const result = await giveBonus({
        staffProfileId: staffId,
        staffEmail,
        amount: parsedAmount,
        reason: reason.trim() || undefined,
        awardedByEmail,
      });

      if (result?.success) {
        toast.success(`Bonus of $${parsedAmount.toFixed(2)} awarded to ${staffName}!`);
        setAmount("");
        setReason("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result?.message || "Failed to award bonus");
      }
    } catch {
      toast.error("Failed to award bonus. Please try again.");
    }
  }, [amount, reason, staffId, staffEmail, awardedByEmail, staffName, giveBonus, onOpenChange, onSuccess]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setAmount("");
      setReason("");
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange]);

  const isValidAmount = useMemo(() => {
    const val = parseFloat(amount);
    return !isNaN(val) && val >= 0.01;
  }, [amount]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-chart-4" />
            Give Bonus to {staffName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="bonus-amount">Bonus Amount (CAD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                $
              </span>
              <Input
                id="bonus-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-2">
            <Label htmlFor="bonus-reason">Reason (optional)</Label>
            <Textarea
              id="bonus-reason"
              placeholder="e.g. Exceptional performance, Holiday bonus..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Pay Period Info Box */}
          <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/15 p-3">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              This bonus will be included in the current pay period:{" "}
              <span className="font-medium text-foreground">{payPeriodLabel}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Awarding Bonus...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" />
                Award Bonus
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};