import React from "react";
import { useState, useCallback } from "react";
import {
  useSendLoginLink,
  useEntityCreate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffProfilesEntity } from "@/product-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  type RegistrationFormData,
  type ValidationErrors,
  ROLE_TYPE_OPTIONS,
  INITIAL_FORM_DATA,
  validateRegistrationForm,
  hasValidationErrors,
} from "@/utils/registrationUtils";

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm = ({ onSwitchToSignIn }: SignUpFormProps) => {
  const navigate = useNavigate();
  const { sendLoginLink, isLoading: isSendingLink } = useSendLoginLink();
  const { createFunction: createStaffProfile, isLoading: isCreatingProfile } =
    useEntityCreate(StaffProfilesEntity);

  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = isSendingLink || isCreatingProfile || isSubmitting;

  const handleChange = useCallback(
    (field: keyof RegistrationFormData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        // Clear error for the field being edited and general error
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof ValidationErrors];
          delete next.general;
          return next;
        });
      },
    []
  );

  const handleRoleChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, roleType: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.roleType;
      delete next.general;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate
      const validationErrors = validateRegistrationForm(formData);
      if (hasValidationErrors(validationErrors)) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        // Step 1: Send magic link to register the user (this creates the user account)
        await sendLoginLink({ email: formData.email.trim() });

        // Step 2: Create staff profile record
        await createStaffProfile({
          data: {
            email: formData.email.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            dateOfBirth: formData.dateOfBirth,
            roleType: formData.roleType as "RN" | "LPN" | "CCA" | "CITR",
            complianceStatus: "pending",
            onboardingStatus: "incomplete",
            streetAddress: formData.address.trim() || undefined,
            city: formData.city.trim() || undefined,
            province: formData.province.trim() || undefined,
            postalCode: formData.postalCode.trim() || undefined,
            emergencyContactName:
              formData.emergencyContactName.trim() || undefined,
            emergencyContactPhone:
              formData.emergencyContactPhone.trim() || undefined,
          },
        });

        toast.success("Account created! Welcome to ALJO CareCrew 🎉");
        navigate("/staff-dashboard");
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.";

        if (
          message.toLowerCase().includes("duplicate") ||
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("already registered")
        ) {
          setErrors({
            general:
              "An account with this email already exists. Please sign in instead.",
          });
        } else {
          setErrors({ general: message });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, sendLoginLink, createStaffProfile, navigate]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Personal Info Section */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Personal Information
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange("firstName")}
              disabled={isLoading}
              className="h-12 text-base"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange("lastName")}
              disabled={isLoading}
              className="h-12 text-base"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signupEmail" className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signupEmail"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleChange("email")}
            disabled={isLoading}
            className="h-12 text-base"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(902) 555-0123"
            value={formData.phone}
            onChange={handleChange("phone")}
            disabled={isLoading}
            className="h-12 text-base"
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth" className="text-sm font-medium">
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange("dateOfBirth")}
            disabled={isLoading}
            className="h-12 text-base"
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Address
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-sm font-medium">
            Street Address
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main Street"
            value={formData.address}
            onChange={handleChange("address")}
            disabled={isLoading}
            className="h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm font-medium">
              City
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Halifax"
              value={formData.city}
              onChange={handleChange("city")}
              disabled={isLoading}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="province" className="text-sm font-medium">
              Province
            </Label>
            <Input
              id="province"
              type="text"
              placeholder="Nova Scotia"
              value={formData.province}
              onChange={handleChange("province")}
              disabled={isLoading}
              className="h-12 text-base"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postalCode" className="text-sm font-medium">
            Postal Code
          </Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="B3H 1A1"
            value={formData.postalCode}
            onChange={handleChange("postalCode")}
            disabled={isLoading}
            className="h-12 text-base"
          />
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Emergency Contact
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="emergencyContactName"
              className="text-sm font-medium"
            >
              Contact Name
            </Label>
            <Input
              id="emergencyContactName"
              type="text"
              placeholder="Contact name"
              value={formData.emergencyContactName}
              onChange={handleChange("emergencyContactName")}
              disabled={isLoading}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="emergencyContactPhone"
              className="text-sm font-medium"
            >
              Contact Phone
            </Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              placeholder="(902) 555-0456"
              value={formData.emergencyContactPhone}
              onChange={handleChange("emergencyContactPhone")}
              disabled={isLoading}
              className="h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Role Section */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Role
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="roleType" className="text-sm font-medium">
            Role Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.roleType}
            onValueChange={handleRoleChange}
            disabled={isLoading}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select your role type" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.roleType && (
            <p className="text-xs text-destructive">{errors.roleType}</p>
          )}
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{errors.general}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Switch to Sign In */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium text-primary hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
};