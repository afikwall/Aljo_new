import React from "react";
import { useEntityUpdate, useExecuteAction, useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffProfilesEntity, StaffDocumentsEntity, GetSignedFileUrlAction } from "@/product-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  User,
  Phone,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Eye,
  Download,
  CalendarX2,
  Loader2,
  Shield,
  User as UserIcon,
  ChevronDown,
  XCircle as XCircleIcon,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  isImageFile,
  getDocumentStatus,
  getDocumentDisplayName,
  filterRequiredDocuments,
  filterOptionalDocuments,
  getRequiredDocTypesForRole,
  DOCUMENT_TYPE_LABELS,
  type DocumentStatus,
} from "@/utils/documentUtils";
import { WeeklyAvailabilityReadOnly } from "@/components/WeeklyAvailabilityReadOnly";
import { OrientationHistory } from "@/components/OrientationHistory";

// --- Helpers ---

function formatDocumentType(type?: string): string {
  if (!type) return "Unknown";
  return DOCUMENT_TYPE_LABELS[type] || type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
          Pending Review
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
      return <Badge variant="outline">Unknown</Badge>;
  }
}

// --- Missing Document Placeholder ---

function MissingDocumentPlaceholder({ docType }: { docType: string }) {
  return (
    <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-3">
        <XCircleIcon className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{formatDocumentType(docType)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">No document uploaded yet</p>
        </div>
        <Badge className="bg-destructive/15 text-destructive border-transparent shrink-0">
          Not Uploaded
        </Badge>
      </div>
    </div>
  );
}

// --- Document Card (shared by required & optional sections) ---

interface DocumentReviewCardProps {
  doc: typeof StaffDocumentsEntity["instanceType"];
  displayName: string;
  updatingDoc: boolean;
  rejectingDocId: string | null;
  rejectionReason: string;
  loadingPreviewId: string | null;
  loadingDownloadId: string | null;
  isMobile: boolean;
  onApprove: (docId: string) => void;
  onStartReject: (docId: string) => void;
  onCancelReject: () => void;
  onRejectSubmit: (docId: string) => void;
  onRejectionReasonChange: (reason: string) => void;
  onView: (doc: typeof StaffDocumentsEntity["instanceType"]) => void;
  onDownload: (doc: typeof StaffDocumentsEntity["instanceType"]) => void;
}

function DocumentReviewCard({
  doc,
  displayName,
  updatingDoc,
  rejectingDocId,
  rejectionReason,
  loadingPreviewId,
  loadingDownloadId,
  isMobile,
  onApprove,
  onStartReject,
  onCancelReject,
  onRejectSubmit,
  onRejectionReasonChange,
  onView,
  onDownload,
}: DocumentReviewCardProps) {
  const docStatus = getDocumentStatus(doc);

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Document row: thumbnail + info + actions */}
          <div className="flex items-start gap-3">
            {/* Thumbnail / Icon */}
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

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {doc.fileName && (
                    <p className="text-sm font-medium truncate">
                      {doc.fileName}
                    </p>
                  )}
                  <div className="mt-1">
                    <ReviewStatusBadge status={docStatus} />
                  </div>
                </div>

                {/* View & Download buttons */}
                {doc.fileUrl && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(doc)}
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
                      onClick={() => onDownload(doc)}
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

              {/* Document details */}
              <div className="grid gap-1 text-sm mt-2">
                {doc.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <span className="font-medium">
                      {format(parseISO(doc.expiryDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {doc.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span className="font-medium">
                      {format(parseISO(doc.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection reason if rejected */}
          {doc.reviewStatus === "rejected" && doc.rejectionReason && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-0.5">
                  Rejection Reason:
                </p>
                <p className="text-sm">{doc.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Action buttons for pending documents */}
          {doc.reviewStatus === "pending_review" && (
            <div className="space-y-2">
              {rejectingDocId === doc.id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => onRejectionReasonChange(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
                    <Button
                      variant="destructive"
                      onClick={() => onRejectSubmit(doc.id)}
                      disabled={updatingDoc}
                      className={isMobile ? "w-full" : "flex-1"}
                    >
                      Submit Rejection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onCancelReject}
                      disabled={updatingDoc}
                      className={isMobile ? "w-full" : "flex-1"}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
                  <Button
                    onClick={() => onApprove(doc.id)}
                    disabled={updatingDoc}
                    className={isMobile ? "w-full min-h-[44px]" : "flex-1"}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onStartReject(doc.id)}
                    disabled={updatingDoc}
                    className={isMobile ? "w-full min-h-[44px]" : "flex-1"}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

interface StaffDetailPanelProps {
  staff: typeof StaffProfilesEntity["instanceType"];
  documents: Array<typeof StaffDocumentsEntity["instanceType"]>;
  onRefresh: () => void;
  getComplianceBadge: (status?: string) => React.ReactNode;
  getOnboardingBadge: (status?: string) => React.ReactNode;
  showOnboardingApproval?: boolean;
  onSheetClose?: () => void;
}

export function StaffDetailPanel({
  staff,
  documents,
  onRefresh,
  getComplianceBadge,
  getOnboardingBadge,
  showOnboardingApproval = false,
  onSheetClose,
}: StaffDetailPanelProps) {
  const currentUser = useUser();
  const isMobile = useIsMobile();
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
  const [loadingDownloadId, setLoadingDownloadId] = useState<string | null>(
    null
  );
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // Separate required and optional documents
  const requiredDocs = useMemo(
    () => filterRequiredDocuments(documents),
    [documents]
  );
  const optionalDocs = useMemo(
    () => filterOptionalDocuments(documents),
    [documents]
  );

  // Get the ordered list of required doc types for this staff member's role
  const requiredDocTypes = useMemo(
    () => getRequiredDocTypesForRole(staff.roleType),
    [staff.roleType]
  );

  // Build a map of docType -> uploaded docs (required only)
  const requiredDocsByType = useMemo(() => {
    const map: Record<string, Array<typeof StaffDocumentsEntity["instanceType"]>> = {};
    for (const doc of requiredDocs) {
      const type = doc.documentType || "unknown";
      if (!map[type]) map[type] = [];
      map[type].push(doc);
    }
    return map;
  }, [requiredDocs]);

  // Count how many required doc types have at least one uploaded document
  const uploadedRequiredCount = useMemo(
    () => requiredDocTypes.filter((t) => (requiredDocsByType[t]?.length ?? 0) > 0).length,
    [requiredDocTypes, requiredDocsByType]
  );

  // Profile completeness check
  const profileCompleteness = useMemo(() => {
    const requiredFields = [
      { field: 'firstName', label: 'First Name', value: staff.firstName },
      { field: 'lastName', label: 'Last Name', value: staff.lastName },
      { field: 'phone', label: 'Phone', value: staff.phone },
      { field: 'roleType', label: 'Role Type', value: staff.roleType },
      { field: 'city', label: 'City', value: staff.city },
      { field: 'province', label: 'Province', value: staff.province },
      { field: 'emergencyContactName', label: 'Emergency Contact Name', value: staff.emergencyContactName },
      { field: 'emergencyContactPhone', label: 'Emergency Contact Phone', value: staff.emergencyContactPhone },
    ];
    
    return requiredFields;
  }, [staff]);

  // Check if onboarding can be approved
  const canApproveOnboarding = useMemo(() => {
    return staff.complianceStatus === "compliant";
  }, [staff.complianceStatus]);

  const handleApprove = useCallback(
    async (docId: string) => {
      try {
        await updateDocument({
          id: docId,
          data: {
            reviewStatus: "approved",
          },
        });
        toast.success("Document approved successfully");
        onRefresh();
      } catch (error) {
        toast.error("Failed to approve document");
        console.error(error);
      }
    },
    [updateDocument, onRefresh]
  );

  const handleRejectSubmit = useCallback(
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
        onRefresh();
      } catch (error) {
        toast.error("Failed to reject document");
        console.error(error);
      }
    },
    [updateDocument, rejectionReason, onRefresh]
  );

  const handleStartReject = useCallback((docId: string) => {
    setRejectingDocId(docId);
    setRejectionReason("");
  }, []);

  const handleCancelReject = useCallback(() => {
    setRejectingDocId(null);
    setRejectionReason("");
  }, []);

  const handleViewDocument = useCallback(
    async (doc: typeof StaffDocumentsEntity["instanceType"]) => {
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
    async (doc: typeof StaffDocumentsEntity["instanceType"]) => {
      if (!doc.fileUrl) return;
      setLoadingDownloadId(doc.id);
      try {
        const result = await getSignedUrl({ fileUrl: doc.fileUrl });
        if (result?.signedUrl) {
          const anchor = document.createElement("a");
          anchor.href = result.signedUrl;
          anchor.download = doc.fileName || "document";
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
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

  const handleApproveOnboarding = useCallback(async () => {
    try {
      await updateStaff({
        id: staff.id,
        data: {
          onboardingStatus: "approved",
        },
      });
      
      const staffName = staff.firstName && staff.lastName 
        ? `${staff.firstName} ${staff.lastName}` 
        : staff.email || "Staff member";
      
      toast.success(`Onboarding approved! ${staffName} can now claim shifts.`);
      setApprovalDialogOpen(false);
      onRefresh();
      if (onSheetClose) {
        onSheetClose();
      }
    } catch (error) {
      toast.error("Failed to approve onboarding");
      console.error(error);
    }
  }, [updateStaff, staff, onRefresh, onSheetClose]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Staff Details</SheetTitle>
        <SheetDescription>
          View and manage staff profile and documents
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 mt-6">
        {/* Profile Completeness (only shown when showOnboardingApproval is true) */}
        {showOnboardingApproval && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {profileCompleteness.map((field) => (
                  <div key={field.field} className="flex items-center gap-2 text-sm">
                    {field.value ? (
                      <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className={field.value ? "" : "text-muted-foreground"}>
                      {field.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{staff.email || "N/A"}</p>
                  {(staff.withdrawalCount || 0) >= 3 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="h-4 w-4 text-chart-3 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Frequent withdrawer ({staff.withdrawalCount}{" "}
                            withdrawals)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {(staff.withdrawalCount || 0) >= 3 && (
                  <Badge className="bg-chart-3/20 text-chart-3 mt-1">
                    {staff.withdrawalCount} withdrawals
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role Type</p>
                <Badge variant="outline">{staff.roleType || "N/A"}</Badge>
              </div>
              {staff.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {staff.phone}
                  </p>
                </div>
              )}
              {staff.dateOfBirth && (
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(staff.dateOfBirth), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Compliance Status
                </p>
                {getComplianceBadge(staff.complianceStatus)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Onboarding Status
                </p>
                {getOnboardingBadge(staff.onboardingStatus)}
              </div>
            </div>

            {staff.emergencyContactName && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Emergency Contact
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {staff.emergencyContactName}
                      </p>
                    </div>
                    {staff.emergencyContactPhone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">
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

        {/* Weekly Availability (read-only, shown after profile info) */}
        {staff.isAvailabilitySet && staff.id && (
          <WeeklyAvailabilityReadOnly staffProfileId={staff.id} />
        )}

        {/* Required Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Required Documents ({uploadedRequiredCount} / {requiredDocTypes.length})
            </CardTitle>
            <CardDescription>
              Review and approve required compliance documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requiredDocTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No required documents for this role</p>
              </div>
            ) : (
              <div className="space-y-6">
                {requiredDocTypes.map((docType) => {
                  const docs = requiredDocsByType[docType] ?? [];
                  return (
                    <div key={docType} className="space-y-3">
                      <h3 className="font-semibold text-sm">
                        {formatDocumentType(docType)}
                      </h3>
                      {docs.length === 0 ? (
                        <MissingDocumentPlaceholder docType={docType} />
                      ) : (
                        docs.map((doc) => (
                          <DocumentReviewCard
                            key={doc.id}
                            doc={doc}
                            displayName={formatDocumentType(doc.documentType)}
                            updatingDoc={updatingDoc}
                            rejectingDocId={rejectingDocId}
                            rejectionReason={rejectionReason}
                            loadingPreviewId={loadingPreviewId}
                            loadingDownloadId={loadingDownloadId}
                            isMobile={isMobile}
                            onApprove={handleApprove}
                            onStartReject={handleStartReject}
                            onCancelReject={handleCancelReject}
                            onRejectSubmit={handleRejectSubmit}
                            onRejectionReasonChange={setRejectionReason}
                            onView={handleViewDocument}
                            onDownload={handleDownloadDocument}
                          />
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approve Onboarding Button (only shown when showOnboardingApproval is true) */}
        {showOnboardingApproval && (
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={() => setApprovalDialogOpen(true)}
                disabled={!canApproveOnboarding || updatingStaff}
                className="w-full h-12"
              >
                <CheckCircle className="h-5 w-5" />
                Approve Onboarding
              </Button>
              {!canApproveOnboarding && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  All required documents must be approved first
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Optional Documents Section */}
        {optionalDocs.length > 0 && (
          <Card>
            <CardHeader>
              <button
                onClick={() => setOptionalExpanded((prev) => !prev)}
                className="flex items-center justify-between w-full text-left"
              >
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Documents ({optionalDocs.length})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Optional documents submitted by staff
                  </CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground shrink-0 ml-2 transition-transform duration-200",
                    optionalExpanded && "rotate-180"
                  )}
                />
              </button>
            </CardHeader>
            {optionalExpanded && (
              <CardContent>
                <div className="space-y-4">
                  {optionalDocs.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <h3 className="font-semibold text-sm">
                        {getDocumentDisplayName(doc)}
                      </h3>
                      <DocumentReviewCard
                        doc={doc}
                        displayName={getDocumentDisplayName(doc)}
                        updatingDoc={updatingDoc}
                        rejectingDocId={rejectingDocId}
                        rejectionReason={rejectionReason}
                        loadingPreviewId={loadingPreviewId}
                        loadingDownloadId={loadingDownloadId}
                        isMobile={isMobile}
                        onApprove={handleApprove}
                        onStartReject={handleStartReject}
                        onCancelReject={handleCancelReject}
                        onRejectSubmit={handleRejectSubmit}
                        onRejectionReasonChange={setRejectionReason}
                        onView={handleViewDocument}
                        onDownload={handleDownloadDocument}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Orientation History Section */}
        {staff.id && <OrientationHistory staffId={staff.id} />}
      </div>

      {/* Onboarding Approval Confirmation Dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Onboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Approve onboarding for {staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : staff.email}? 
              This will grant them full access to claim shifts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveOnboarding} disabled={updatingStaff}>
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
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.signedUrl)}&embedded=true`}
                  title={previewFile.name}
                  className="w-full rounded-lg border"
                  style={{ height: "70vh", minHeight: "500px" }}
                />
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.open(previewFile.signedUrl, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}