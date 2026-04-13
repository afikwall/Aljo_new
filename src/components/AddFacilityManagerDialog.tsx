import { useState, useCallback } from "react";
import { useEntityCreate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilityManagerProfilesEntity } from "@/product-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";

interface AddFacilityManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  facilityName: string;
  onSuccess: () => void;
}

export const AddFacilityManagerDialog = ({
  open,
  onOpenChange,
  facilityId,
  facilityName,
  onSuccess,
}: AddFacilityManagerDialogProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { createFunction, isLoading } = useEntityCreate(
    FacilityManagerProfilesEntity
  );

  const resetForm = useCallback(() => {
    setEmail("");
    setName("");
    setPhone("");
    setSuccessEmail(null);
    setErrorMessage(null);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetForm]
  );

  const handleSubmit = useCallback(async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setErrorMessage(null);

    try {
      await createFunction({
        data: {
          email: trimmedEmail,
          facilityProfileId: facilityId,
          ...(name.trim() ? { title: name.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });

      setSuccessEmail(trimmedEmail);
      onSuccess();
    } catch {
      setErrorMessage("An error occurred while creating the profile. Please try again.");
    }
  }, [email, name, phone, facilityId, createFunction, onSuccess]);

  const handleDone = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Facility Manager</DialogTitle>
          <DialogDescription>
            Add a new facility manager profile for {facilityName}.
          </DialogDescription>
        </DialogHeader>

        {successEmail ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Profile Created!</p>
                  <p className="text-sm text-muted-foreground">
                    A facility manager profile has been successfully created for{" "}
                    <span className="font-medium text-foreground">
                      {successEmail}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button className="h-11 w-full sm:w-auto" onClick={handleDone}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fm-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fm-email"
                type="email"
                placeholder="manager@facility.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fm-name">Name</Label>
              <Input
                id="fm-name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fm-phone">Phone</Label>
              <Input
                id="fm-phone"
                type="tel"
                placeholder="(902) 555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {errorMessage && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};