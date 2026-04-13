import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { StaffAvailableShiftsPage, StaffMyProfilePage } from "@/product-types";

export const OnboardingStepComplete = () => {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Success icon */}
          <div className="rounded-full bg-accent/10 p-4">
            <CheckCircle className="h-16 w-16 text-accent" />
          </div>

          {/* Title & message */}
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold">Welcome Aboard!</h2>
            <p className="text-muted-foreground">
              Your profile is complete and your documents are being reviewed.
              You&apos;ll receive a notification when your account is fully
              approved. In the meantime, you can browse available shifts.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm sm:flex-row">
            <Button className="h-12 flex-1" asChild>
              <Link to={getPageUrl(StaffAvailableShiftsPage)}>
                Browse Available Shifts
              </Link>
            </Button>
            <Button variant="outline" className="h-12 flex-1" asChild>
              <Link to={getPageUrl(StaffMyProfilePage)}>
                View My Profile
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};