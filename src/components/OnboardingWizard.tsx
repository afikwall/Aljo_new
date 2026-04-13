import { useState, useCallback, useMemo, useEffect } from "react";
import { useEntityGetAll, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffDocumentsEntity, StaffProfilesEntity } from "@/product-types";
import type { IStaffProfilesEntity } from "@/product-types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import { OnboardingStepProfile } from "@/components/OnboardingStepProfile";
import { OnboardingStepDocuments } from "@/components/OnboardingStepDocuments";
import { OnboardingStepTerms } from "@/components/OnboardingStepTerms";
import { OnboardingStepComplete } from "@/components/OnboardingStepComplete";
import { getFirstIncompleteStep } from "@/utils/onboardingUtils";

interface OnboardingWizardProps {
  staffProfile: IStaffProfilesEntity & { id: string };
}

export const OnboardingWizard = ({ staffProfile }: OnboardingWizardProps) => {
  // Fetch documents for this staff member
  const { data: documents, isLoading: loadingDocs } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId: staffProfile.id },
    { enabled: !!staffProfile.id }
  );

  // Re-fetch profile to get latest data (since user may have updated profile and come back)
  const { data: latestProfiles, isLoading: loadingLatest } = useEntityGetAll(
    StaffProfilesEntity,
    { email: staffProfile.email },
    { enabled: !!staffProfile.email }
  );
  const latestProfile = latestProfiles?.[0] || staffProfile;

  // Update hook for completing onboarding
  const { updateFunction, isLoading: isUpdating } = useEntityUpdate(StaffProfilesEntity);

  // Calculate starting step from data
  const calculatedStartStep = useMemo(
    () => getFirstIncompleteStep(latestProfile, documents),
    [latestProfile, documents]
  );

  const [currentStep, setCurrentStep] = useState<number | null>(null);

  // Set initial step once data loads
  useEffect(() => {
    if (!loadingDocs && !loadingLatest && currentStep === null) {
      setCurrentStep(calculatedStartStep);
    }
  }, [loadingDocs, loadingLatest, calculatedStartStep, currentStep]);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min((prev ?? 0) + 1, 3));
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max((prev ?? 0) - 1, 0));
  }, []);

  const handleCompleteOnboarding = useCallback(async () => {
    try {
      await updateFunction({
        id: staffProfile.id,
        data: { onboardingStatus: "pending_review" },
      });
      toast.success("Onboarding submitted successfully!");
      setCurrentStep(3);
    } catch {
      toast.error("Failed to submit onboarding. Please try again.");
    }
  }, [updateFunction, staffProfile.id]);

  // Loading state
  if (loadingDocs || loadingLatest || currentStep === null) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <OnboardingStepper currentStep={currentStep} />

      {/* Step content */}
      {currentStep === 0 && (
        <OnboardingStepProfile
          profile={latestProfile}
          onNext={handleNext}
        />
      )}
      {currentStep === 1 && (
        <OnboardingStepDocuments
          roleType={latestProfile?.roleType}
          documents={documents}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 2 && (
        <OnboardingStepTerms
          onComplete={handleCompleteOnboarding}
          onBack={handleBack}
          isSubmitting={isUpdating}
        />
      )}
      {currentStep === 3 && <OnboardingStepComplete />}
    </div>
  );
};