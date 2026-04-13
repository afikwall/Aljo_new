import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  ROLE_FULL_NAMES,
  formatApplicationDate,
} from "@/utils/roleUpgradeUtils";
import {
  getRequiredDocTypesForRole,
  DOCUMENT_TYPE_LABELS,
  getDocumentStatus,
} from "@/utils/documentUtils";
import type {
  IRoleUpgradeApplicationsEntity,
  IStaffProfilesEntity,
  IStaffDocumentsEntity,
  StaffDocumentsEntityDocumentTypeEnum,
} from "@/product-types";
import {
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ExternalLink,
  Upload,
  CalendarX2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadOnBehalfSheet } from "@/components/UploadOnBehalfSheet";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";

type DocumentStatus = "missing" | "pending_review" | "approved" | "rejected" | "expired";

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

interface PendingUpgradeCardProps {
  application: IRoleUpgradeApplicationsEntity & { id: string };
  staffProfile?: IStaffProfilesEntity & { id: string };
  staffDocs: IStaffDocumentsEntity[];
  onApprove: (applicationId: string, staffProfileId: string, newRole: string) => Promise<void>;
  onReject: (applicationId: string, reason: string) => Promise<void>;
  isProcessing: boolean;
  onViewProfile?: (staffProfileId: string) => void;
  onUploadSuccess?: () => void;
}

export const PendingUpgradeCard = ({
  application,
  staffProfile,
  staffDocs,
  onApprove,
  onReject,
  isProcessing,
  onViewProfile,
  onUploadSuccess,
}: PendingUpgradeCardProps) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<"approve" | "reject" | null>(null);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<StaffDocumentsEntityDocumentTypeEnum | undefined>();

  const staffName = useMemo(() => {
    if (staffProfile?.firstName || staffProfile?.lastName) {
      return `${staffProfile.firstName || ""} ${staffProfile.lastName || ""}`.trim();
    }
    return application.staffEmail || "Unknown Staff";
  }, [staffProfile, application.staffEmail]);

  const staffInitials = useMemo(() => {
    if (staffProfile?.firstName && staffProfile?.lastName) {
      return `${staffProfile.firstName[0]}${staffProfile.lastName[0]}`.toUpperCase();
    }
    return (application.staffEmail?.[0] || "U").toUpperCase();
  }, [staffProfile, application.staffEmail]);

  // Required doc types for the TARGET role
  const requiredDocTypes = useMemo(
    () => getRequiredDocTypesForRole(application.requestedRole),
    [application.requestedRole]
  );

  // Document compliance for requested role
  const docCompliance = useMemo(() => {
    const approvedCount = requiredDocTypes.filter(
      (docType) => getDocStatusForType(docType, staffDocs) === "approved"
    ).length;
    return { approved: approvedCount, total: requiredDocTypes.length };
  }, [requiredDocTypes, staffDocs]);

  const progressPercent = useMemo(
    () =>
      docCompliance.total > 0
        ? (docCompliance.approved / docCompliance.total) * 100
        : 0,
    [docCompliance]
  );

  const handleApprove = useCallback(async () => {
    if (!application.staffProfileId || !application.requestedRole) return;
    setProcessingAction("approve");
    try {
      await onApprove(application.id, application.staffProfileId, application.requestedRole);
    } finally {
      setProcessingAction(null);
    }
  }, [application, onApprove]);

  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) return;
    setProcessingAction("reject");
    try {
      await onReject(application.id, rejectionReason.trim());
      setDialogOpen(false);
      setRejectionReason("");
    } finally {
      setProcessingAction(null);
    }
  }, [application.id, rejectionReason, onReject]);

  const handleUploadForDoc = useCallback(
    (docType: StaffDocumentsEntityDocumentTypeEnum) => {
      setUploadDocType(docType);
      setUploadSheetOpen(true);
    },
    []
  );

  const handleUploadSuccess = useCallback(() => {
    onUploadSuccess?.();
  }, [onUploadSuccess]);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Top section: Staff info + View Profile button */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* Left: Staff Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={staffProfile?.profilePhotoUrl} />
                  <AvatarFallback>{staffInitials}</AvatarFallback>
                </Avatar>

                <div className="space-y-2 min-w-0">
                  {/* Staff Name */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{staffName}</p>
                    <ReliabilityBadge totalShiftsCompleted={staffProfile?.totalRatings || 0} size="sm" />
                    {onViewProfile && application.staffProfileId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() =>
                          onViewProfile(application.staffProfileId!)
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Full Profile
                      </Button>
                    )}
                  </div>

                  {/* Role Transition */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getRoleBadgeColor(application.currentRole)}>
                      {application.currentRole}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge className={getRoleBadgeColor(application.requestedRole)}>
                      {application.requestedRole}
                    </Badge>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    Applied {formatApplicationDate(application.appliedAt)}
                  </p>

                  {/* Document Compliance Progress */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {docCompliance.approved} of {docCompliance.total} documents
                      approved
                    </p>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing || processingAction !== null}
                  className="h-10"
                >
                  {processingAction === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>

                <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={isProcessing || processingAction !== null}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Role Upgrade</AlertDialogTitle>
                      <AlertDialogDescription>
                        Reject {staffName}&apos;s application to upgrade from{" "}
                        {application.currentRole} to {application.requestedRole}.
                        Please provide a reason.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <Textarea
                      placeholder="Enter rejection reason (required)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px]"
                    />

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleReject();
                        }}
                        disabled={!rejectionReason.trim() || processingAction === "reject"}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {processingAction === "reject" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Reject Application"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Required Documents Checklist (collapsible) */}
            <div>
              <button
                onClick={() => setDocsExpanded((prev) => !prev)}
                className="flex items-center gap-2 w-full text-left text-sm font-medium py-1"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    docsExpanded && "rotate-180"
                  )}
                />
                Required Documents for{" "}
                {ROLE_FULL_NAMES[application.requestedRole || ""] ||
                  application.requestedRole}
              </button>

              {docsExpanded && (
                <div className="mt-2 space-y-1.5 rounded-lg bg-muted/30 p-3">
                  {requiredDocTypes.map((docType) => {
                    const docStatus = getDocStatusForType(docType, staffDocs);
                    const showUpload =
                      docStatus === "missing" || docStatus === "rejected";

                    return (
                      <div
                        key={docType}
                        className="flex items-center gap-3 py-1"
                      >
                        <DocStatusIcon status={docStatus} />
                        <span className="text-sm flex-1">
                          {DOCUMENT_TYPE_LABELS[docType] || docType}
                        </span>
                        {showUpload && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleUploadForDoc(docType)}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload On Behalf Sheet */}
      {application.staffProfileId && (
        <UploadOnBehalfSheet
          open={uploadSheetOpen}
          onOpenChange={setUploadSheetOpen}
          staffProfileId={application.staffProfileId}
          staffName={staffName}
          applicationId={application.id}
          onSuccess={handleUploadSuccess}
          preselectedDocType={uploadDocType}
        />
      )}
    </>
  );
};