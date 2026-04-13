import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface OnboardingStepTermsProps {
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const OnboardingStepTerms = ({
  onComplete,
  onBack,
  isSubmitting,
}: OnboardingStepTermsProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleCheckedChange = useCallback((checked: boolean | "indeterminate") => {
    setAgreed(checked === true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Review & Acknowledge Terms</CardTitle>
            <CardDescription>
              Please read and agree to the employment terms
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Terms content */}
        <div className="rounded-lg bg-muted/50 p-4 max-h-64 overflow-y-auto">
          <p className="text-sm font-medium mb-3">
            By proceeding, I acknowledge that:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>
              All information provided is accurate and complete.
            </li>
            <li>
              I agree to ALJO CareCrew&apos;s terms of employment and code of conduct.
            </li>
            <li>
              I understand that my documents will be reviewed and I will be
              notified of my onboarding status.
            </li>
            <li>
              I consent to GPS location tracking during shift clock-in and
              clock-out for geofencing purposes.
            </li>
            <li>
              I understand that statutory holidays are paid at 1.5x the regular
              rate.
            </li>
          </ol>
        </div>

        {/* Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree-terms"
            checked={agreed}
            onCheckedChange={handleCheckedChange}
          />
          <Label htmlFor="agree-terms" className="text-sm cursor-pointer">
            I have read and agree to the above terms.
          </Label>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" className="h-10" onClick={onBack} disabled={isSubmitting}>
            ← Back
          </Button>
          <Button
            className="h-12 w-full sm:w-auto"
            disabled={!agreed || isSubmitting}
            onClick={onComplete}
          >
            {isSubmitting ? "Submitting..." : "Complete Onboarding"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};