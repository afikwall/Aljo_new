import { useState, useEffect, useCallback } from "react";
import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { getPageUrl } from "@/lib/utils";
import {
  FacilityManagerProfilesEntity,
  LoginPage,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftModeSelector } from "@/components/ShiftModeSelector";
import { SingleShiftForm } from "@/components/SingleShiftForm";
import { BulkPostForm } from "@/components/BulkPostForm";

export default function FacilityPostShift() {
  const user = useUser();
  const navigate = useNavigate();
  const { data: managerProfiles, isLoading: loadingProfile } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: user.email },
    { enabled: !!user.email }
  );
  const managerProfile = managerProfiles?.[0];

  const [mode, setMode] = useState<"single" | "bulk">("single");

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  const handleModeChange = useCallback((newMode: "single" | "bulk") => {
    setMode(newMode);
  }, []);

  if (!user.isAuthenticated) {
    return null;
  }

  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!managerProfile) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-chart-3" />
              Profile Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your facility manager profile hasn&apos;t been set up yet. Please
              contact your administrator to complete your profile setup before
              posting shifts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safely cast managerProfile to include id
  const profileWithId = managerProfile as typeof managerProfile & { id: string };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Post Shift</h1>
        <p className="text-muted-foreground">
          Create single or multiple shift opportunities for your facility
        </p>
      </div>

      {/* Mode Selector */}
      <ShiftModeSelector mode={mode} onModeChange={handleModeChange} />

      {/* Form Content */}
      {mode === "single" ? (
        <SingleShiftForm managerProfile={profileWithId} />
      ) : (
        <BulkPostForm managerProfile={profileWithId} />
      )}
    </div>
  );
}