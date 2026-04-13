import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/utils/onboardingUtils";

interface OnboardingStepperProps {
  currentStep: number; // 0-indexed
}

export const OnboardingStepper = ({ currentStep }: OnboardingStepperProps) => {
  const steps = useMemo(
    () =>
      WIZARD_STEPS.map((step, index) => ({
        ...step,
        status:
          index < currentStep
            ? ("completed" as const)
            : index === currentStep
              ? ("current" as const)
              : ("future" as const),
      })),
    [currentStep]
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors shrink-0",
                  step.status === "completed" &&
                    "bg-accent text-accent-foreground",
                  step.status === "current" &&
                    "bg-primary text-primary-foreground",
                  step.status === "future" &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs text-center whitespace-nowrap hidden sm:block",
                  step.status === "completed" && "text-accent font-medium",
                  step.status === "current" && "text-primary font-semibold",
                  step.status === "future" && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {/* Mobile short labels */}
              <span
                className={cn(
                  "text-[10px] text-center whitespace-nowrap sm:hidden",
                  step.status === "completed" && "text-accent font-medium",
                  step.status === "current" && "text-primary font-semibold",
                  step.status === "future" && "text-muted-foreground"
                )}
              >
                {step.shortLabel}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-1.25rem] sm:mt-[-1.5rem]",
                  index < currentStep ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};