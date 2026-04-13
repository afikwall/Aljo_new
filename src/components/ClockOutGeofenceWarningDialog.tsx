import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ClockOutGeofenceWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distanceMeters: number;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const ClockOutGeofenceWarningDialog = ({
  open,
  onOpenChange,
  distanceMeters,
  onCancel,
  onConfirm,
  isProcessing,
}: ClockOutGeofenceWarningDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-chart-3" />
            <DialogTitle>Outside Facility Geofence</DialogTitle>
          </div>
          <DialogDescription>
            You appear to be {Math.round(distanceMeters)}m away from the facility.
            Do you want to proceed with clock-out? This will be flagged for review.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clocking out...
              </>
            ) : (
              "Clock Out Anyway"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};