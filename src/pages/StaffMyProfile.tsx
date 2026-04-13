import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { useNavigate } from "react-router";
import {
  useUser,
  useEntityGetAll,
  useEntityUpdate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffProfilesEntity,
  StaffDocumentsEntity,
  StaffRatesEntity,
  FacilitiesEntity,
  TimesheetsEntity,
  LoginPage,
  type IStaffProfilesEntity,
} from "@/product-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileSummaryCard } from "@/components/ProfileSummaryCard";
import { ProfileAccordionSection } from "@/components/ProfileAccordionSection";
import { PersonalInfoSection } from "@/components/PersonalInfoSection";
import { AddressSection } from "@/components/AddressSection";
import { WorkEligibilitySection } from "@/components/WorkEligibilitySection";
import { EducationSection } from "@/components/EducationSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { PaymentsSection } from "@/components/PaymentsSection";
import {
  getPersonalInfoCompletion,
  getAddressCompletion,
  getWorkEligibilityCompletion,
  getPaymentsCompletion,
  getPersonalInfoFieldCount,
  getAddressFieldCount,
  getWorkEligibilityFieldCount,
  getEducationFieldCount,
  getExperienceFieldCount,
  getPaymentsFieldCount,
} from "@/utils/profileUtils";
import { cn, getPageUrl } from "@/lib/utils";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Shield,
  GraduationCap,
  Briefcase,
  FileCheck,
  DollarSign,
  Pencil,
  X,
  Loader2,
  UserCircle,
  TrendingUp,
  Info,
} from "lucide-react";
import { RoleUpgradeApplicationsEntity } from "@/product-types";
import { MyApplicationsWithDocs } from "@/components/MyApplicationsWithDocs";

interface CertificationItem {
  name: string;
  expiryDate?: string;
}

interface ReferenceItem {
  name: string;
  phone: string;
  relationship: string;
}

interface EmployerItem {
  company: string;
  role: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

const parseEmployers = (
  items?: { name: string; expiryDate?: string }[]
): EmployerItem[] => {
  if (!items) return [];
  return items
    .map((item) => {
      try {
        return JSON.parse(item.name) as EmployerItem;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as EmployerItem[];
};

const serializeEmployers = (
  employers: EmployerItem[]
): { items: { name: string; expiryDate?: string }[] } => {
  return {
    items: employers.map((emp) => ({
      name: JSON.stringify(emp),
    })),
  };
};

export default function StaffMyProfilePage() {
  const user = useUser();
  const navigate = useNavigate();

  // --- Data fetching (all hooks at top level) ---
  const {
    data: profiles,
    isLoading: loadingProfile,
    refetch,
  } = useEntityGetAll(StaffProfilesEntity, { email: user.email });
  const profile = profiles?.[0];

  const { data: staffDocuments, isLoading: loadingDocs } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId: profile?.id },
    { enabled: !!profile?.id }
  );

  const { data: staffRates, isLoading: loadingRates } =
    useEntityGetAll(StaffRatesEntity);

  const { data: facilities } = useEntityGetAll(FacilitiesEntity);

  const { data: timesheets } = useEntityGetAll(
    TimesheetsEntity,
    { staffProfileId: profile?.id },
    { enabled: !!profile?.id }
  );

  const { data: upgradeApplications } = useEntityGetAll(
    RoleUpgradeApplicationsEntity,
    { staffProfileId: profile?.id },
    { enabled: !!profile?.id }
  );

  const { updateFunction, isLoading: updating } =
    useEntityUpdate(StaffProfilesEntity);

  // --- State ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<IStaffProfilesEntity>>({});
  const [languages, setLanguages] = useState<string[]>([]);
  const [specialSkills, setSpecialSkills] = useState<string[]>([]);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [employers, setEmployers] = useState<EmployerItem[]>([]);

  // --- Auth redirect ---
  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  // --- Initialize form data from profile ---
  useEffect(() => {
    if (profile) {
      setFormData({
        profilePhotoUrl: profile.profilePhotoUrl || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        bio: profile.bio || "",
        streetAddress: profile.streetAddress || "",
        city: profile.city || "",
        province: profile.province || "",
        postalCode: profile.postalCode || "",
        workPermitStatus: profile.workPermitStatus || undefined,
        roleType: profile.roleType || undefined,
        sinNumber: profile.sinNumber || "",
        highestEducation: profile.highestEducation || undefined,
        institution: profile.institution || "",
        graduationYear: profile.graduationYear || undefined,
        yearsOfExperience: profile.yearsOfExperience ?? undefined,
        paymentMethod: profile.paymentMethod || undefined,
        bankName: profile.bankName || "",
        bankAccountLast4: profile.bankAccountLast4 || "",
        bankTransitNumber: profile.bankTransitNumber || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
      });
      setLanguages(profile.languages || []);
      setSpecialSkills(profile.specialSkills || []);
      setReferences(
        (profile.professionalReferences || []).map((r) => ({
          name: r.name || "",
          phone: r.phone || "",
          relationship: r.relationship || "",
        }))
      );
      setCertifications(
        (profile.certifications?.items || []).map((c) => ({
          name: c.name || "",
          expiryDate: c.expiryDate || undefined,
        }))
      );
      setEmployers(parseEmployers(profile.previousEmployers?.items));
    }
  }, [profile]);

  // --- Merge form data with profile for completion calculations ---
  const mergedProfile = useMemo(() => {
    return {
      ...profile,
      ...formData,
      languages,
      specialSkills,
      professionalReferences: references,
      certifications: { items: certifications },
      previousEmployers: serializeEmployers(employers),
    } as Partial<IStaffProfilesEntity>;
  }, [formData, profile, languages, specialSkills, references, certifications, employers]);

  // --- Derive worked facility IDs from timesheets ---
  const workedFacilityIds = useMemo(() => {
    if (!timesheets) return [];
    const ids = new Set<string>();
    timesheets.forEach((ts) => {
      if (ts.facilityProfileId) ids.add(ts.facilityProfileId);
    });
    return Array.from(ids);
  }, [timesheets]);

  // --- Section completion calculations ---
  const personalCompletion = useMemo(
    () => getPersonalInfoCompletion(mergedProfile),
    [mergedProfile]
  );
  const addressCompletion = useMemo(
    () => getAddressCompletion(mergedProfile),
    [mergedProfile]
  );
  const workCompletion = useMemo(
    () => getWorkEligibilityCompletion(mergedProfile),
    [mergedProfile]
  );
  const paymentsCompletion = useMemo(
    () => getPaymentsCompletion(mergedProfile),
    [mergedProfile]
  );

  // Education and Experience have no required fields - always "complete"
  const educationComplete = true;
  const experienceComplete = true;
  // Documents section - check based on compliance status
  const documentsComplete = profile?.complianceStatus === "compliant";

  // --- Field count summaries ---
  const personalFieldCount = useMemo(
    () => getPersonalInfoFieldCount(mergedProfile),
    [mergedProfile]
  );
  const addressFieldCount = useMemo(
    () => getAddressFieldCount(mergedProfile),
    [mergedProfile]
  );
  const workFieldCount = useMemo(
    () => getWorkEligibilityFieldCount(mergedProfile),
    [mergedProfile]
  );
  const educationFieldCount = useMemo(
    () => getEducationFieldCount(mergedProfile),
    [mergedProfile]
  );
  const experienceFieldCount = useMemo(
    () => getExperienceFieldCount(mergedProfile),
    [mergedProfile]
  );
  const paymentsFieldCount = useMemo(
    () => getPaymentsFieldCount(mergedProfile),
    [mergedProfile]
  );

  // --- Applications count ---
  const applicationsCount = useMemo(
    () => upgradeApplications?.length || 0,
    [upgradeApplications]
  );

  // --- Handlers ---
  const handleFormChange = useCallback(
    (data: Partial<IStaffProfilesEntity>) => {
      setFormData((prev) => ({ ...prev, ...data }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!profile) return;

    try {
      await updateFunction({
        id: profile.id || "",
        data: {
          ...formData,
          languages,
          specialSkills,
          professionalReferences: references,
          certifications: { items: certifications },
          previousEmployers: serializeEmployers(employers),
        },
      });

      await refetch();
      setIsEditMode(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  }, [
    profile,
    formData,
    languages,
    specialSkills,
    references,
    certifications,
    employers,
    updateFunction,
    refetch,
  ]);

  const handleCancel = useCallback(() => {
    if (profile) {
      setFormData({
        profilePhotoUrl: profile.profilePhotoUrl || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        bio: profile.bio || "",
        streetAddress: profile.streetAddress || "",
        city: profile.city || "",
        province: profile.province || "",
        postalCode: profile.postalCode || "",
        workPermitStatus: profile.workPermitStatus || undefined,
        roleType: profile.roleType || undefined,
        sinNumber: profile.sinNumber || "",
        highestEducation: profile.highestEducation || undefined,
        institution: profile.institution || "",
        graduationYear: profile.graduationYear || undefined,
        yearsOfExperience: profile.yearsOfExperience ?? undefined,
        paymentMethod: profile.paymentMethod || undefined,
        bankName: profile.bankName || "",
        bankAccountLast4: profile.bankAccountLast4 || "",
        bankTransitNumber: profile.bankTransitNumber || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
      });
      setLanguages(profile.languages || []);
      setSpecialSkills(profile.specialSkills || []);
      setReferences(
        (profile.professionalReferences || []).map((r) => ({
          name: r.name || "",
          phone: r.phone || "",
          relationship: r.relationship || "",
        }))
      );
      setCertifications(
        (profile.certifications?.items || []).map((c) => ({
          name: c.name || "",
          expiryDate: c.expiryDate || undefined,
        }))
      );
      setEmployers(parseEmployers(profile.previousEmployers?.items));
    }
    setIsEditMode(false);
  }, [profile]);

  const handlePhotoUploaded = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, profilePhotoUrl: url }));
  }, []);

  // --- Early returns ---
  if (!user.isAuthenticated) {
    return null;
  }

  if (loadingProfile || loadingRates) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal and professional information
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <UserCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">No profile found</p>
              <p className="text-sm text-muted-foreground">
                Contact ALJO to get set up.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("p-4 md:p-6 space-y-3", isEditMode && "pb-24")}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal and professional information
          </p>
        </div>
        {!isEditMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Profile Summary Card */}
      <ProfileSummaryCard
        profile={profile as IStaffProfilesEntity & { id: string }}
        email={user.email || ""}
        isEditMode={isEditMode}
        profilePhotoUrl={formData.profilePhotoUrl}
        onPhotoUploaded={handlePhotoUploaded}
      />

      {/* Section 1 — Personal Information */}
      <ProfileAccordionSection
        icon={User}
        iconColor="text-chart-1"
        title="Personal Information"
        fieldSummary={personalFieldCount}
        isComplete={personalCompletion.isComplete}
        defaultOpen={!personalCompletion.isComplete}
      >
        <PersonalInfoSection
          formData={formData}
          email={user.email || ""}
          isEditMode={isEditMode}
          onChange={handleFormChange}
        />
      </ProfileAccordionSection>

      {/* Section 2 — Address */}
      <ProfileAccordionSection
        icon={MapPin}
        iconColor="text-chart-2"
        title="Address"
        fieldSummary={addressFieldCount}
        isComplete={addressCompletion.isComplete}
        defaultOpen={!addressCompletion.isComplete}
      >
        <AddressSection
          formData={formData}
          isEditMode={isEditMode}
          onChange={handleFormChange}
        />
      </ProfileAccordionSection>

      {/* Section 3 — Work Eligibility */}
      <ProfileAccordionSection
        icon={Shield}
        iconColor="text-chart-4"
        title="Work Eligibility"
        fieldSummary={workFieldCount}
        isComplete={workCompletion.isComplete}
        defaultOpen={!workCompletion.isComplete}
      >
        <WorkEligibilitySection
          formData={formData}
          isEditMode={isEditMode}
          onChange={handleFormChange}
        />
      </ProfileAccordionSection>

      {/* Section 4 — Education */}
      <ProfileAccordionSection
        icon={GraduationCap}
        iconColor="text-chart-3"
        title="Education"
        fieldSummary={educationFieldCount}
        isComplete={educationComplete}
        defaultOpen={false}
      >
        <EducationSection
          formData={formData}
          certifications={certifications}
          isEditMode={isEditMode}
          onChange={handleFormChange}
          onCertificationsChange={setCertifications}
        />
      </ProfileAccordionSection>

      {/* Section 5 — Experience */}
      <ProfileAccordionSection
        icon={Briefcase}
        iconColor="text-primary"
        title="Experience"
        fieldSummary={experienceFieldCount}
        isComplete={experienceComplete}
        defaultOpen={false}
      >
        <ExperienceSection
          formData={formData}
          languages={languages}
          specialSkills={specialSkills}
          references={references}
          isEditMode={isEditMode}
          onChange={handleFormChange}
          onLanguagesChange={setLanguages}
          onSkillsChange={setSpecialSkills}
          onReferencesChange={setReferences}
          employers={employers}
          onEmployersChange={setEmployers}
          staffProfileId={profile?.id}
        />
      </ProfileAccordionSection>

      {/* Section 6 — Documents (read-only) */}
      <ProfileAccordionSection
        icon={FileCheck}
        iconColor="text-accent"
        title="Documents"
        fieldSummary={`${loadingDocs ? "Loading..." : `${(staffDocuments || []).length} uploaded`}`}
        isComplete={documentsComplete || false}
        defaultOpen={!documentsComplete}
      >
        {isEditMode && formData.roleType && formData.roleType !== profile.roleType && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Document requirements reflect your selected role. Save your profile to confirm.
            </span>
          </div>
        )}
        <DocumentsSection
          profile={mergedProfile as IStaffProfilesEntity & { id: string }}
          documents={(staffDocuments || []) as (typeof StaffDocumentsEntity.instanceType & { id: string })[]}
        />
      </ProfileAccordionSection>

      {/* Section 7 — Payments */}
      <ProfileAccordionSection
        icon={DollarSign}
        iconColor="text-chart-3"
        title="Payments"
        fieldSummary={paymentsFieldCount}
        isComplete={paymentsCompletion.isComplete}
        defaultOpen={!paymentsCompletion.isComplete}
      >
        <PaymentsSection
          formData={formData}
          staffRates={(staffRates || []) as (typeof StaffRatesEntity.instanceType & { id: string })[]}
          facilities={(facilities || []) as (typeof FacilitiesEntity.instanceType & { id: string })[]}
          workedFacilityIds={workedFacilityIds}
          isEditMode={isEditMode}
          onChange={handleFormChange}
          staffProfileId={profile?.id}
        />
      </ProfileAccordionSection>

      {/* Section 8 — My Applications (always visible, outside edit mode) */}
      {profile?.id && (
        <ProfileAccordionSection
          icon={TrendingUp}
          iconColor="text-chart-1"
          title="My Applications"
          fieldSummary={`${applicationsCount} application${applicationsCount !== 1 ? "s" : ""}`}
          isComplete={true}
          defaultOpen={applicationsCount > 0}
        >
          <MyApplicationsWithDocs staffProfileId={profile.id} />
        </ProfileAccordionSection>
      )}

      {/* Fixed Save Bar */}
      {isEditMode && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-background border-t p-4 z-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-11 sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updating}
              className="h-11 sm:w-auto w-full"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}