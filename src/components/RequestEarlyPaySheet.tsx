import React from "react";
import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Banknote } from "lucide-react";
import { useEntityCreate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { EarlyPayRequestsEntity } from "@/product-types";
import { toast } from "sonner";
import {
  formatCAD,
  validateEarlyPayAmount,
  validateEarlyPayReason,
} from "@/utils/earlyPayUtils";

interface RequestEarlyPaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffProfileId: string;
  availableForEarlyPay: number;
  periodStart: string;
  periodEnd: string;
  onSuccess: () => void;
}

export const RequestEarlyPaySheet = ({
  open,
  onOpenChange,
  staffProfileId,
  availableForEarlyPay,
  periodStart,
  periodEnd,
  onSuccess,
}: RequestEarlyPaySheetProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const { createFunction, isLoading: isSubmitting } = useEntityCreate(
    EarlyPayRequestsEntity
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setAmount(val);
      if (amountError) {
        const err = validateEarlyPayAmount(
          parseFloat(val),
          availableForEarlyPay
        );
        setAmountError(err);
      }
    },
    [amountError, availableForEarlyPay]
  );

  const handleReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setReason(e.target.value);
      if (reasonError) {
        const err = validateEarlyPayReason(e.target.value);
        setReasonError(err);
      }
    },
    [reasonError]
  );

  const handleSubmit = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    const amtError = validateEarlyPayAmount(parsedAmount, availableForEarlyPay);
    const rsError = validateEarlyPayReason(reason);

    setAmountError(amtError);
    setReasonError(rsError);

    if (amtError || rsError) return;

    try {
      await createFunction({
        data: {
          staffProfileId,
          amountRequested: parsedAmount,
          reason: reason.trim(),
          status: "pending",
          requestedAt: new Date().toISOString(),
          periodStart,
          periodEnd,
        },
      });
      toast.success("Early pay request submitted!");
      setAmount("");
      setReason("");
      setAmountError(null);
      setReasonError(null);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  }, [
    amount,
    reason,
    staffProfileId,
    availableForEarlyPay,
    periodStart,
    periodEnd,
    createFunction,
    onOpenChange,
    onSuccess,
  ]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setAmount("");
        setReason("");
        setAmountError(null);
        setReasonError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-accent" />
            Request Early Pay
          </SheetTitle>
          <SheetDescription>
            You can request up to{" "}
            <span className="font-semibold text-accent">
              {formatCAD(availableForEarlyPay)}
            </span>{" "}
            from your current pay period earnings.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="early-pay-amount" className="text-sm font-medium">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="early-pay-amount"
                type="number"
                min={1}
                max={availableForEarlyPay}
                step={0.01}
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="pl-7 h-11 text-base"
              />
            </div>
            {amountError && (
              <p className="text-xs text-destructive">{amountError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum: {formatCAD(availableForEarlyPay)}
            </p>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="early-pay-reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="early-pay-reason"
              value={reason}
              onChange={handleReasonChange}
              placeholder="e.g. Rent payment due before payday"
              rows={3}
              className="text-base resize-none"
            />
            {reasonError && (
              <p className="text-xs text-destructive">{reasonError}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !amount || !reason.trim()}
            className="w-full h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};