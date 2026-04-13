import { useMemo } from "react";
import { CheckCircle, XCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { StaffMyProfilePage } from "@/product-types";
import type { IStaffProfilesEntity } from "@/product-types";
import { getProfileCompletion } from "@/utils/onboardingUtils";

interface OnboardingStepProfileProps {
  profile: IStaffProfilesEntity | null | undefined;
  onNext: () => void;
}

export const OnboardingStepProfile = ({ profile, onNext }: OnboardingStepProfileProps) => {
  const completion = useMemo(
    () => getProfileCompletion(profile),
    [profile]
  );

  const progressPercent = useMemo(
    () => (completion.total > 0 ? (completion.filled / completion.total) * 100 : 0),
    [completion.filled, completion.total]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Fill in all required information before proceeding</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {completion.filled} of {completion.total} fields completed
            </span>
            <span className="text-sm font-medium">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="divide-y divide-border rounded-lg border">
          {completion.fieldStatuses.map((field) => (
            <div
              key={field.key}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium">{field.label}</span>
              {field.filled ? (
                <CheckCircle className="h-5 w-5 text-accent" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" className="h-10" asChild>
            <Link to={getPageUrl(StaffMyProfilePage)}>Edit Profile</Link>
          </Button>
          <Button
            className="h-12"
            disabled={!completion.allFilled}
            onClick={onNext}
          >
            Next →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};