import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffProfilesEntity,
  StaffDocumentsEntity,
  ShiftApplicationsEntity,
  ShiftsEntity,
  FacilitiesEntity,
  RoleUpgradeApplicationsEntity,
  GetSignedFileUrlAction,
  type IStaffDocumentsEntity,
} from "@/product-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  MapPin,
  Briefcase,
  FileCheck,
  CalendarDays,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Eye,
  Download,
  Loader2,
  FileText,
  CalendarX2,
  AlertTriangle,
  X,
  Gift,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  DOCUMENT_TYPE_LABELS,
  getRequiredDocTypesForRole,
  getDocumentStatus,
  isImageFile,
  filterRequiredDocuments,
  filterOptionalDocuments,
  getDocumentDisplayName,
  type DocumentStatus,
} from "@/utils/documentUtils";
import {
  ROLE_FULL_NAMES,
  getUpgradeStatusBadge,
  formatApplicationDate,
} from "@/utils/roleUpgradeUtils";
import {
  getUserInitials,
  getMaskedSin,
  EDUCATION_LABELS,
  WORK_PERMIT_LABELS,
  getComplianceStatusConfig,
} from "@/utils/profileUtils";
import { OrientationHistory } from "@/components/OrientationHistory";
import { WeeklyAvailabilityReadOnly } from "@/components/WeeklyAvailabilityReadOnly";
import { StaffReviews } from "@/components/StaffReviews";
import { StarRating } from "@/components/StarRating";
import { ExperienceActivityCard } from "@/components/ExperienceActivityCard";
import { GiveBonusDialog } from "@/components/GiveBonusDialog";
import { BonusHistoryCard } from "@/components/BonusHistoryCard";

// --- Helpers ---

function ReviewStatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-accent/20 text-accent gap-1 border-transparent">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    case "pending_review":
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1 border-transparent">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-destructive/20 text-destructive gap-1 border-transparent">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1 border-transparent">
          <CalendarX2 className="h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return <Badge variant="outline">Missing</Badge>;
  }
}

function getDocStatusForType(
  docType: string,
  docs: IStaffDocumentsEntity[]
): DocumentStatus {
  const matching = docs.filter((d) => d.documentType === docType);
  if (matching.length === 0) return "missing";
  const statuses = matching.map(getDocumentStatus);
  if (statuses.includes("approved")) return "approved";
  if (statuses.includes("pending_review")) return "pending_review";
  if (statuses.includes("rejected")) return "rejected";
  if (statuses.includes("expired")) return "expired";
  return "missing";
}

function DocStatusIcon({ status }: { status: DocumentStatus }) {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-accent shrink-0" />;
    case "pending_review":
      return <Clock className="h-4 w-4 text-chart-3 shrink-0" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "expired":
      return <CalendarX2 className="h-4 w-4 text-chart-3 shrink-0" />;
    default:
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  }
}

// --- Props ---

interface FullStaffProfilePanelProps {
  staffId: string;
  staffDocuments: (IStaffDocumentsEntity & { id: string })[];
  showOnboardingApproval?: boolean;
  onRefresh?: () => void;
  onSheetClose?: () => void;
}

export const FullStaffProfilePanel = ({
  staffId,
  staffDocuments,
  showOnboardingApproval = false,
  onRefresh,
  onSheetClose,
}: FullStaffProfilePanelProps) => {
  const currentUser = useUser();
  const isMobile = useIsMobile();

  // --- Data Fetching ---
  const { data: staffProfiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    {},
    { enabled: !!staffId }
  );
  const staff = useMemo(
    () => staffProfiles?.find((s) => s.id === staffId),
    [staffProfiles, staffId]
  );

  const { data: shiftApps, isLoading: loadingShiftApps } = useEntityGetAll(
    ShiftApplicationsEntity,
    { staffProfileId: staffId },
    { enabled: !!staffId }
  );

  const { data: allShifts } = useEntityGetAll(ShiftsEntity);
  const { data: allFacilities } = useEntityGetAll(FacilitiesEntity);

  const { data: allUpgradeApps, isLoading: loadingUpgrades } = useEntityGetAll(
    RoleUpgradeApplicationsEntity,
    { staffProfileId: staffId },
    { enabled: !!staffId }
  );

  // --- Document review state ---
  const { updateFunction: updateDocument, isLoading: updatingDoc } =
    useEntityUpdate(StaffDocumentsEntity);
  const { updateFunction: updateStaff, isLoading: updatingStaff } =
    useEntityUpdate(StaffProfilesEntity);
  const { executeFunction: getSignedUrl } = useExecuteAction(
    GetSignedFileUrlAction
  );
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewFile, setPreviewFile] = useState<{
    signedUrl: string;
    name: string;
    isImage: boolean;
  } | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [loadingDownloadId, setLoadingDownloadId] = useState<string | null>(null);
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // --- Give Bonus state ---
  const [giveBonusOpen, setGiveBonusOpen] = useState(false);
  const [bonusKey, setBonusKey] = useState(0);

  // --- Shift History Date Filters ---
  const [shiftStartFilter, setShiftStartFilter] = useState("");
  const [shiftEndFilter, setShiftEndFilter] = useState("");

  // --- Derived Data ---
  const staffName = useMemo(() => {
    if (staff?.firstName || staff?.lastName) {
      return `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
    }
    return staff?.email || "Staff Member";
  }, [staff]);

  const staffInitials = useMemo(
    () => getUserInitials(staff?.firstName, staff?.lastName),
    [staff]
  );

  const complianceConfig = useMemo(
    () => getComplianceStatusConfig(staff?.complianceStatus),
    [staff?.complianceStatus]
  );

  const onboardingBadge = useMemo(() => {
    const s = staff?.onboardingStatus;
    if (s === "approved")
      return { className: "bg-accent/20 text-accent", label: "Approved" };
    if (s === "pending_review")
      return { className: "bg-chart-3/20 text-chart-3", label: "Pending Review" };
    if (s === "rejected")
      return { className: "bg-destructive/20 text-destructive", label: "Rejected" };
    return { className: "bg-muted text-muted-foreground", label: "Incomplete" };
  }, [staff?.onboardingStatus]);

  // Facility map
  const facilityMap = useMemo(() => {
    const map = new Map<string, string>();
    allFacilities?.forEach((f) => {
      if (f.id && f.name) map.set(f.id, f.name);
    });
    return map;
  }, [allFacilities]);

  // Shift map
  const shiftMap = useMemo(() => {
    const map = new Map<string, typeof ShiftsEntity.instanceType>();
    allShifts?.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return map;
  }, [allShifts]);

  // Shift history: approved applications with shift details
  const shiftHistory = useMemo(() => {
    if (!shiftApps) return [];
    const filtered = shiftApps
      .filter((app) => app.status === "approved")
      .map((app) => {
        const shift = app.shiftProfileId
          ? shiftMap.get(app.shiftProfileId)
          : undefined;
        const shiftDateStr = shift?.startDateTime
          ? shift.startDateTime.slice(0, 10)
          : "";
        const facilityName = shift?.facilityProfileId
          ? facilityMap.get(shift.facilityProfileId) || "Unknown Facility"
          : "Unknown Facility";
        return { app, shift, facilityName, shiftDateStr };
      })
      .filter(({ shiftDateStr }) => {
        if (shiftStartFilter && shiftDateStr < shiftStartFilter) return false;
        if (shiftEndFilter && shiftDateStr > shiftEndFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = a.shift?.startDateTime
          ? new Date(a.shift.startDateTime).getTime()
          : 0;
        const dateB = b.shift?.startDateTime
          ? new Date(b.shift.startDateTime).getTime()
          : 0;
        return dateB - dateA;
      });
    return filtered;
  }, [shiftApps, shiftMap, facilityMap, shiftStartFilter, shiftEndFilter]);

  // Document sections
  const requiredDocs = useMemo(
    () => filterRequiredDocuments(staffDocuments),
    [staffDocuments]
  );
  const optionalDocs = useMemo(
    () => filterOptionalDocuments(staffDocuments),
    [staffDocuments]
  );

  const hasActiveFilters = shiftStartFilter !== "" || shiftEndFilter !== "";

  // Required doc types for this role and compliance progress
  const requiredDocTypes = useMemo(
    () => getRequiredDocTypesForRole(staff?.roleType),
    [staff?.roleType]
  );

  const docProgress = useMemo(() => {
    const approved = requiredDocTypes.filter(
      (dt) => getDocStatusForType(dt, staffDocuments) === "approved"
    ).length;
    return { approved, total: requiredDocTypes.length };
  }, [requiredDocTypes, staffDocuments]);

  // Upgrade applications
  const upgradeApps = useMemo(() => {
    if (!allUpgradeApps) return [];
    return [...allUpgradeApps].sort((a, b) => {
      const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [allUpgradeApps]);

  // --- Document Approval/Rejection ---
  const handleDocApprove = useCallback(
    async (docId: string) => {
      try {
        await updateDocument({
          id: docId,
          data: { reviewStatus: "approved" },
        });
        toast.success("Document approved");
        onRefresh?.();
      } catch {
        toast.error("Failed to approve document");
      }
    },
    [updateDocument, onRefresh]
  );

  const handleDocRejectSubmit = useCallback(
    async (docId: string) => {
      if (!rejectionReason.trim()) {
        toast.error("Please provide a rejection reason");
        return;
      }
      try {
        await updateDocument({
          id: docId,
          data: {
            reviewStatus: "rejected",
            rejectionReason: rejectionReason.trim(),
          },
        });
        toast.success("Document rejected");
        setRejectingDocId(null);
        setRejectionReason("");
        onRefresh?.();
      } catch {
        toast.error("Failed to reject document");
      }
    },
    [updateDocument, rejectionReason, onRefresh]
  );

  const handleViewDocument = useCallback(
    async (doc: IStaffDocumentsEntity & { id: string }) => {
      if (!doc.fileUrl) return;
      setLoadingPreviewId(doc.id);
      try {
        const result = await getSignedUrl({ fileUrl: doc.fileUrl });
        if (result?.signedUrl) {
          setPreviewFile({
            signedUrl: result.signedUrl,
            name: doc.fileName || "Document",
            isImage: isImageFile(doc.fileUrl, doc.fileName),
          });
        } else {
          toast.error("Failed to load document preview");
        }
      } catch {
        toast.error("Failed to load document preview");
      } finally {
        setLoadingPreviewId(null);
      }
    },
    [getSignedUrl]
  );

  const handleDownloadDocument = useCallback(
    async (doc: IStaffDocumentsEntity & { id: string }) => {
      if (!doc.fileUrl) return;
      setLoadingDownloadId(doc.id);
      try {
        const result = await getSignedUrl({ fileUrl: doc.fileUrl });
        if (result?.signedUrl) {
          window.open(result.signedUrl, '_blank');
        } else {
          toast.error("Failed to download document");
        }
      } catch {
        toast.error("Failed to download document");
      } finally {
        setLoadingDownloadId(null);
      }
    },
    [getSignedUrl]
  );

  // Onboarding approval
  const canApproveOnboarding = useMemo(() => {
    const requiredDocTypes = getRequiredDocTypesForRole(staff?.roleType);
    const docBlockers = requiredDocTypes.filter((docType) => {
      const status = getDocStatusForType(docType, staffDocuments);
      return status !== "approved";
    });
    const requiredFields: { key: keyof typeof staff; label: string }[] = [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "phone", label: "Phone Number" },
      { key: "roleType", label: "Role Type" },
      { key: "city", label: "City" },
      { key: "province", label: "Province" },
      { key: "emergencyContactName", label: "Emergency Contact Name" },
      { key: "emergencyContactPhone", label: "Emergency Contact Phone" },
    ];
    const fieldBlockers = requiredFields.filter(({ key }) => !staff?.[key]);
    return docBlockers.length === 0 && fieldBlockers.length === 0;
  }, [staff, staffDocuments]);

  const handleApproveOnboarding = useCallback(async () => {
    if (!staff?.id) return;
    try {
      await updateStaff({
        id: staff.id,
        data: { onboardingStatus: "approved" },
      });
      toast.success(
        `Onboarding approved! ${staffName} can now claim shifts.`
      );
      setApprovalDialogOpen(false);
      onRefresh?.();
      onSheetClose?.();
    } catch {
      toast.error("Failed to approve onboarding");
    }
  }, [updateStaff, staff, staffName, onRefresh, onSheetClose]);

  // Profile completeness for onboarding approval
  const profileCompleteness = useMemo(() => {
    if (!staff) return [];
    return [
      { field: "firstName", label: "First Name", value: staff.firstName },
      { field: "lastName", label: "Last Name", value: staff.lastName },
      { field: "phone", label: "Phone", value: staff.phone },
      { field: "roleType", label: "Role Type", value: staff.roleType },
      { field: "city", label: "City", value: staff.city },
      { field: "province", label: "Province", value: staff.province },
      {
        field: "emergencyContactName",
        label: "Emergency Contact Name",
        value: staff.emergencyContactName,
      },
      {
        field: "emergencyContactPhone",
        label: "Emergency Contact Phone",
        value: staff.emergencyContactPhone,
      },
    ];
  }, [staff]);

  const handleBonusSuccess = useCallback(() => {
    setBonusKey((k) => k + 1);
  }, []);

  // --- Loading State ---
  if (loadingProfile || !staff) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>
            <Skeleton className="h-6 w-48" />
          </SheetTitle>
          <SheetDescription>Loading staff profile...</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{staffName}</SheetTitle>
        <SheetDescription>Full staff profile and history</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 mt-6">
        {/* 1. Profile Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src={staff.profilePhotoUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {staffInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h3 className="font-bold text-lg truncate">{staffName}</h3>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <Badge className={getRoleBadgeColor(staff.roleType)}>
                      {staff.roleType || "N/A"}
                    </Badge>
                    <Badge className={complianceConfig.className}>
                      {complianceConfig.label}
                    </Badge>
                    <Badge className={onboardingBadge.className}>
                      {onboardingBadge.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {staff.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {staff.email}
                    </span>
                  )}
                  {staff.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {staff.phone}
                    </span>
                  )}
                  {(staff.city || staff.province) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {[staff.city, staff.province].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                {(staff.withdrawalCount || 0) >= 3 && (
                  <Badge className="bg-chart-3/20 text-chart-3">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {staff.withdrawalCount} withdrawals
                  </Badge>
                )}
                {/* Give Bonus Button */}
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGiveBonusOpen(true)}
                    className="gap-1.5"
                  >
                    <Gift className="h-4 w-4 text-chart-4" />
                    Give Bonus 🎁
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Profile Completeness (conditional) */}
        {showOnboardingApproval && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {profileCompleteness.map((field) => (
                  <div
                    key={field.field}
                    className="flex items-center gap-2 text-sm"
                  >
                    {field.value ? (
                      <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span
                      className={field.value ? "" : "text-muted-foreground"}
                    >
                      {field.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {staff.dateOfBirth && (
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(staff.dateOfBirth), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {staff.sinNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">SIN</p>
                  <p className="text-sm font-medium">
                    {getMaskedSin(staff.sinNumber)}
                  </p>
                </div>
              )}
              {staff.workPermitStatus && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Work Permit Status
                  </p>
                  <Badge variant="outline" className="mt-0.5">
                    {WORK_PERMIT_LABELS[staff.workPermitStatus] ||
                      staff.workPermitStatus}
                  </Badge>
                </div>
              )}
            </div>
            {staff.bio && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bio</p>
                <p className="text-sm">{staff.bio}</p>
              </div>
            )}
            {staff.emergencyContactName && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Emergency Contact
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">
                        {staff.emergencyContactName}
                      </p>
                    </div>
                    {staff.emergencyContactPhone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">
                          {staff.emergencyContactPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Address */}
        {(staff.streetAddress || staff.city || staff.province || staff.postalCode) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {staff.streetAddress && <p>{staff.streetAddress}</p>}
                <p>
                  {[staff.city, staff.province].filter(Boolean).join(", ")}
                  {staff.postalCode ? ` ${staff.postalCode}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Professional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {staff.yearsOfExperience !== undefined &&
                staff.yearsOfExperience !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Years of Experience
                    </p>
                    <p className="text-sm font-medium">
                      {staff.yearsOfExperience}
                    </p>
                  </div>
                )}
              {staff.highestEducation && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Highest Education
                  </p>
                  <p className="text-sm font-medium">
                    {EDUCATION_LABELS[staff.highestEducation] ||
                      staff.highestEducation}
                  </p>
                </div>
              )}
              {staff.institution && (
                <div>
                  <p className="text-xs text-muted-foreground">Institution</p>
                  <p className="text-sm font-medium">{staff.institution}</p>
                </div>
              )}
              {staff.graduationYear && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Graduation Year
                  </p>
                  <p className="text-sm font-medium">{staff.graduationYear}</p>
                </div>
              )}
            </div>

            {staff.languages && staff.languages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Languages
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staff.languages.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {staff.specialSkills && staff.specialSkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Special Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staff.specialSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {staff.certifications?.items &&
              staff.certifications.items.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Certifications
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {staff.certifications.items.map((cert, i) => (
                      <Badge
                        key={`${cert.name}-${i}`}
                        variant="outline"
                        className="text-xs"
                      >
                        {cert.name}
                        {cert.expiryDate && (
                          <span className="text-muted-foreground ml-1">
                            (exp.{" "}
                            {format(parseISO(cert.expiryDate), "MMM yyyy")})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* 5. Experience & Activity */}
        <ExperienceActivityCard staff={staff as typeof staff & { id: string }} />

        {/* 6. Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              {docProgress.approved} of {docProgress.total} required documents
              approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={
                docProgress.total > 0
                  ? (docProgress.approved / docProgress.total) * 100
                  : 0
              }
              className="h-2"
            />

            <div className="space-y-2">
              {requiredDocTypes.map((docType) => {
                const docStatus = getDocStatusForType(docType, staffDocuments);
                const matchingDocs = staffDocuments.filter(
                  (d) => d.documentType === docType
                );
                const latestDoc = matchingDocs.length > 0 ? matchingDocs[0] : null;

                return (
                  <div
                    key={docType}
                    className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2"
                  >
                    <DocStatusIcon status={docStatus} />
                    <span className="text-sm flex-1">
                      {DOCUMENT_TYPE_LABELS[docType] || docType}
                    </span>
                    <ReviewStatusBadge status={docStatus} />
                    {latestDoc?.expiryDate && (
                      <span className="text-xs text-muted-foreground">
                        Exp: {format(parseISO(latestDoc.expiryDate), "MMM yyyy")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {requiredDocs
              .filter((d) => d.reviewStatus === "pending_review")
              .map((doc) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {isImageFile(doc.fileUrl, doc.fileName) ? (
                        <img
                          src={doc.fileUrl}
                          alt={doc.fileName || "Document"}
                          className="h-12 w-12 rounded object-cover border shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted border shrink-0">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {DOCUMENT_TYPE_LABELS[doc.documentType || ""] ||
                            doc.fileName ||
                            "Document"}
                        </p>
                        {doc.fileName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.fileName}
                          </p>
                        )}
                        <ReviewStatusBadge
                          status={getDocumentStatus(doc)}
                        />
                      </div>
                      {doc.fileUrl && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleViewDocument(
                                doc as IStaffDocumentsEntity & { id: string }
                              )
                            }
                            className="h-8 w-8 p-0"
                            disabled={loadingPreviewId === doc.id}
                          >
                            {loadingPreviewId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadDocument(
                                doc as IStaffDocumentsEntity & { id: string }
                              )
                            }
                            className="h-8 w-8 p-0"
                            disabled={loadingDownloadId === doc.id}
                          >
                            {loadingDownloadId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {rejectingDocId === doc.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Enter rejection reason..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={() => handleDocRejectSubmit(doc.id)}
                            disabled={updatingDoc}
                            className="flex-1"
                          >
                            Submit Rejection
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectingDocId(null);
                              setRejectionReason("");
                            }}
                            disabled={updatingDoc}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDocApprove(doc.id)}
                          disabled={updatingDoc}
                          className="flex-1 min-h-[44px]"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setRejectingDocId(doc.id);
                            setRejectionReason("");
                          }}
                          disabled={updatingDoc}
                          className="flex-1 min-h-[44px]"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

            {optionalDocs.length > 0 && (
              <div>
                <button
                  onClick={() => setOptionalExpanded((prev) => !prev)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium py-2"
                >
                  <span>Additional Documents ({optionalDocs.length})</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      optionalExpanded && "rotate-180"
                    )}
                  />
                </button>
                {optionalExpanded && (
                  <div className="space-y-2 mt-2">
                    {optionalDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2"
                      >
                        <DocStatusIcon status={getDocumentStatus(doc)} />
                        <span className="text-sm flex-1 truncate">
                          {getDocumentDisplayName(doc)}
                        </span>
                        <ReviewStatusBadge status={getDocumentStatus(doc)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Approval Button */}
        {showOnboardingApproval && (
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={() => setApprovalDialogOpen(true)}
                disabled={!canApproveOnboarding || updatingStaff}
                className="w-full h-12"
              >
                <CheckCircle className="h-5 w-5 mr-1" />
                Approve Onboarding
              </Button>
              {!canApproveOnboarding && (() => {
                const requiredDocTypes = getRequiredDocTypesForRole(staff?.roleType);
                const docBlockers = requiredDocTypes.filter((docType) => {
                  const status = getDocStatusForType(docType, staffDocuments);
                  return status !== "approved";
                });

                const requiredFields: { key: keyof typeof staff; label: string }[] = [
                  { key: "firstName", label: "First Name" },
                  { key: "lastName", label: "Last Name" },
                  { key: "phone", label: "Phone Number" },
                  { key: "roleType", label: "Role Type" },
                  { key: "city", label: "City" },
                  { key: "province", label: "Province" },
                  { key: "emergencyContactName", label: "Emergency Contact Name" },
                  { key: "emergencyContactPhone", label: "Emergency Contact Phone" },
                ];
                const fieldBlockers = requiredFields.filter(({ key }) => !staff?.[key]);

                return (
                  <div className="mt-3 rounded-lg border border-chart-3/30 bg-chart-3/5 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                      <span className="text-xs font-semibold text-chart-3">Needs to be completed:</span>
                    </div>
                    <div className="space-y-1.5">
                      {docBlockers.map((docType) => {
                        const status = getDocStatusForType(docType, staffDocuments);
                        const label = DOCUMENT_TYPE_LABELS[docType as keyof typeof DOCUMENT_TYPE_LABELS] ?? docType;
                        return (
                          <div key={docType} className="flex items-center gap-2">
                            {status === "pending_review" ? (
                              <Clock className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                            ) : status === "expired" ? (
                              <CalendarX2 className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                            )}
                            <span className="text-xs text-foreground flex-1">{label}</span>
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                              status === "pending_review"
                                ? "bg-chart-3/20 text-chart-3"
                                : status === "expired"
                                ? "bg-chart-3/20 text-chart-3"
                                : status === "rejected"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {status === "pending_review"
                                ? "Awaiting review"
                                : status === "expired"
                                ? "Expired"
                                : status === "rejected"
                                ? "Rejected"
                                : "Missing"}
                            </span>
                          </div>
                        );
                      })}
                      {fieldBlockers.map(({ label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          <span className="text-xs text-foreground flex-1">{label}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Missing
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* 7. Orientation History */}
        {staffId && <OrientationHistory staffId={staffId} />}

        {/* 8. Weekly Availability */}
        {staff.isAvailabilitySet && staffId && (
          <WeeklyAvailabilityReadOnly staffProfileId={staffId} />
        )}

        {/* 9. Shift History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Shift History
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {shiftHistory.length} shift{shiftHistory.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mt-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      From
                    </label>
                    <Input
                      type="date"
                      value={shiftStartFilter}
                      onChange={(e) => setShiftStartFilter(e.target.value)}
                      className="h-9 text-sm w-full"
                      max={shiftEndFilter || undefined}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      To
                    </label>
                    <Input
                      type="date"
                      value={shiftEndFilter}
                      onChange={(e) => setShiftEndFilter(e.target.value)}
                      className="h-9 text-sm w-full"
                      min={shiftStartFilter || undefined}
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShiftStartFilter("");
                      setShiftEndFilter("");
                    }}
                    className="h-8 px-2 text-xs shrink-0"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingShiftApps ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : shiftHistory.length === 0 && hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  No shifts found for the selected date range
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting or clearing the date filters
                </p>
              </div>
            ) : shiftHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No shift history found
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {shiftHistory.map(({ app, shift, facilityName }) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {facilityName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shift?.startDateTime
                          ? format(
                              parseISO(shift.startDateTime),
                              "MMM d, yyyy h:mm a"
                            )
                          : "Unknown date"}
                        {shift?.endDateTime &&
                          ` – ${format(parseISO(shift.endDateTime), "h:mm a")}`}
                      </p>
                    </div>
                    <Badge className={getRoleBadgeColor(shift?.requiredRole)}>
                      {shift?.requiredRole || "N/A"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        shift?.status === "completed" &&
                          "bg-accent/20 text-accent border-transparent",
                        shift?.status === "in_progress" &&
                          "bg-chart-1/20 text-chart-1 border-transparent",
                        shift?.status === "claimed" &&
                          "bg-chart-3/20 text-chart-3 border-transparent"
                      )}
                    >
                      {shift?.status === "completed"
                        ? "Completed"
                        : shift?.status === "in_progress"
                          ? "In Progress"
                          : shift?.status === "claimed"
                            ? "Claimed"
                            : shift?.status || "N/A"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 10. Ratings & Reviews */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-5 w-5" />
              <h3 className="font-semibold">Ratings & Reviews</h3>
              {staff.averageRating !== undefined &&
                staff.averageRating !== null &&
                staff.averageRating > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <StarRating
                      rating={staff.averageRating}
                      size="sm"
                      showNumeric
                    />
                    {staff.totalRatings !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({staff.totalRatings} review
                        {staff.totalRatings !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                )}
            </div>
            <StaffReviews staffProfileId={staffId} />
          </CardContent>
        </Card>

        {/* 11. Role Upgrade Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Role Upgrade Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUpgrades ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : upgradeApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
                <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No role upgrade applications
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upgradeApps.map((app) => {
                  const statusBadge = getUpgradeStatusBadge(app.status);
                  const targetDocTypes = getRequiredDocTypesForRole(
                    app.requestedRole
                  );

                  return (
                    <div
                      key={app.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getRoleBadgeColor(app.currentRole)}
                          >
                            {app.currentRole}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge
                            className={getRoleBadgeColor(app.requestedRole)}
                          >
                            {app.requestedRole}
                          </Badge>
                        </div>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Applied {formatApplicationDate(app.appliedAt)}
                      </p>

                      <div className="space-y-1.5">
                        {targetDocTypes.map((dt) => {
                          const docStatus = getDocStatusForType(
                            dt,
                            staffDocuments
                          );
                          return (
                            <div
                              key={dt}
                              className="flex items-center gap-2 text-sm"
                            >
                              <DocStatusIcon status={docStatus} />
                              <span className="flex-1">
                                {DOCUMENT_TYPE_LABELS[dt] || dt}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 12. Bonus History */}
        <BonusHistoryCard key={bonusKey} staffProfileId={staffId} />
      </div>

      {/* Give Bonus Dialog */}
      <GiveBonusDialog
        open={giveBonusOpen}
        onOpenChange={setGiveBonusOpen}
        staffId={staffId}
        staffName={staffName}
        staffEmail={staff.email || ""}
        awardedByEmail={currentUser.email || ""}
        onSuccess={handleBonusSuccess}
      />

      {/* Onboarding Approval Dialog */}
      <AlertDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Onboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Approve onboarding for {staffName}? This will grant them full
              access to claim shifts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveOnboarding}
              disabled={updatingStaff}
            >
              {updatingStaff ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {previewFile.isImage ? (
                <div className="flex items-center justify-center">
                  <img
                    src={previewFile.signedUrl}
                    alt={previewFile.name}
                    className="max-h-[70vh] w-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={previewFile.signedUrl}
                  title={previewFile.name}
                  className="w-full rounded-lg border"
                  style={{ height: "70vh", minHeight: "500px" }}
                />
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={previewFile.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};