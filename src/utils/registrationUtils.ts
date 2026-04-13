export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  roleType: string;
}

export const ROLE_TYPE_OPTIONS = [
  { value: "RN", label: "RN - Registered Nurse" },
  { value: "LPN", label: "LPN - Licensed Practical Nurse" },
  { value: "CCA", label: "CCA - Continuing Care Assistant" },
  { value: "CITR", label: "CITR - Care in Training" },
] as const;

export const INITIAL_FORM_DATA: RegistrationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  city: "",
  province: "Nova Scotia",
  postalCode: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  roleType: "",
};

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  roleType?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationForm = (
  data: RegistrationFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = "First name is required";
  }

  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (!data.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required";
  }

  if (!data.roleType) {
    errors.roleType = "Role type is required";
  }

  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};