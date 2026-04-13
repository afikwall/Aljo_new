import { useState, useMemo, useCallback } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffDocumentsEntity,
  StaffProfilesEntity,
} from "@/product-types";
import type { IStaffProfilesEntity, IStaffDocumentsEntity } from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  getRequiredDocTypesForRole,
  DOCUMENT_TYPE_LABELS,
} from "@/utils/documentUtils";

interface PendingReviewTabProps {
  staffProfiles: (IStaffProfilesEntity & { id: string })[] | undefined;
  isLoadingStaff: boolean;
  onRefresh: () => void;
}

export const PendingReviewTab = ({
  staffProfiles,
  isLoadingStaff,
  onRefresh,
}: PendingReviewTabProps) => {
  const { data: allStaffDocuments, isLoading: isLoadingDocs, refetch: refetchDocs } =
    useEntityGetAll(StaffDocumentsEntity);
  const { updateFunction: updateDocument } = useEntityUpdate(StaffDocumentsEntity);
  const { updateFunction: updateStaffProfile } = useEntityUpdate(StaffProfilesEntity);

  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [approvingStaffId, setApprovingStaffId] = useState<string | null>(null);

  // Filter staff to those with pending compliance or pending_review onboarding
  const pendingStaff = useMemo(() => {
    if (!staffProfiles) return [];
    return staffProfiles.filter(
      (s) =>
        s.complianceStatus === "pending" ||
        s.onboardingStatus === "pending_review"
    );
  }, [staffProfiles]);

  // Build map of staffId -> documents
  const staffDocumentsMap = useMemo(() => {
    const map = new Map<string, (IStaffDocumentsEntity & { id: string })[]>();
    if (!allStaffDocuments) return map;
    allStaffDocuments.forEach((doc) => {
      if (doc.staffProfileId) {
        const existing = map.get(doc.staffProfileId) || [];
        existing.push(doc as IStaffDocumentsEntity & { id: string });
        map.set(doc.staffProfileId, existing);
      }
    });
    return map;
  }, [allStaffDocuments]);

  const getStaffName = useCallback(
    (staff: IStaffProfilesEntity) => {
      if (staff.firstName && staff.lastName) {
        return `${staff.firstName} ${staff.lastName}`;
      }
      return staff.email || "Unknown";
    },
    []
  );

  const getInitials = useCallback(
    (staff: IStaffProfilesEntity) => {
      if (staff.firstName && staff.lastName) {
        return `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`.toUpperCase();
      }
      if (staff.email) {
        return staff.email.charAt(0).toUpperCase();
      }
      return "?";
    },
    []
  );

  const toggleExpand = useCallback(
    (staffId: string) => {
      setExpandedStaffId((prev) => (prev === staffId ? null : staffId));
      setRejectingDocId(null);
      setRejectionReason("");
    },
    []
  );

  const handleApproveDocument = useCallback(
    async (docId: string, staffProfileId: string) => {
      setProcessingDocId(docId);
      try {
        await updateDocument({
          id: docId,
          data: { reviewStatus: "approved" },
        });

        // Refetch to get latest document states
        await refetchDocs();
        onRefresh();

        // Check if ALL required documents for this staff member are now approved
        const staffMember = staffProfiles?.find((s) => s.id === staffProfileId);
        if (staffMember && staffMember.onboardingStatus === "pending_review") {
          const requiredDocTypes = getRequiredDocTypesForRole(staffMember.roleType);
          const staffDocs = staffDocumentsMap.get(staffProfileId) || [];

          // Simulate the just-approved doc being approved in the current map
          const updatedDocs = staffDocs.map((d) =>
            d.id === docId ? { ...d, reviewStatus: "approved" as const } : d
          );

          const allRequiredApproved = requiredDocTypes.every((reqType) => {
            const matchingDoc = updatedDocs.find(
              (d) => d.documentType === reqType && d.isRequired !== false
            );
            return matchingDoc?.reviewStatus === "approved";
          });

          if (allRequiredApproved && requiredDocTypes.length > 0) {
            await updateStaffProfile({
              id: staffProfileId,
              data: { onboardingStatus: "approved" },
            });
            onRefresh();
            toast.success("All documents approved! Onboarding status updated to Approved.");
          } else {
            toast.success("Document approved!");
          }
        } else {
          toast.success("Document approved!");
        }
      } catch {
        toast.error("Failed to approve document.");
      } finally {
        setProcessingDocId(null);
      }
    },
    [updateDocument, updateStaffProfile, refetchDocs, onRefresh, staffProfiles, staffDocumentsMap]
  );

  const handleStartReject = useCallback((docId: string) => {
    setRejectingDocId(docId);
    setRejectionReason("");
  }, []);

  const handleSubmitRejection = useCallback(
    async (docId: string, staffProfileId: string) => {
      if (!rejectionReason.trim()) {
        toast.error("Please provide a reason for rejection.");
        return;
      }
      setProcessingDocId(docId);
      try {
        await updateDocument({
          id: docId,
          data: {
            reviewStatus: "rejected",
            rejectionReason: rejectionReason.trim(),
          },
        });

        // Refetch
        await refetchDocs();
        onRefresh();

        setRejectingDocId(null);
        setRejectionReason("");
        toast.success("Document rejected.");
      } catch {
        toast.error("Failed to reject document.");
      } finally {
        setProcessingDocId(null);
      }
    },
    [rejectionReason, updateDocument, refetchDocs, onRefresh]
  );

  const handleApproveStaff = useCallback(
    async (staffId: string) => {
      setApprovingStaffId(staffId);
      try {
        await updateStaffProfile({
          id: staffId,
          data: { complianceStatus: "compliant" },
        });
        toast.success("Staff approved as compliant!");
        onRefresh();
        await refetchDocs();
      } catch {
        toast.error("Failed to approve staff.");
      } finally {
        setApprovingStaffId(null);
      }
    },
    [updateStaffProfile, onRefresh, refetchDocs]
  );

  const isLoading = isLoadingStaff || isLoadingDocs;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (pendingStaff.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <ClipboardCheck className="mb-3 size-10 text-muted-foreground" />
        <p className="font-medium text-base">No pending reviews</p>
        <p className="text-sm text-muted-foreground mt-1">
          All staff documents and onboarding have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pendingStaff.map((staff) => {
        const staffId = staff.id;
        const docs = staffDocumentsMap.get(staffId) || [];
        const requiredDocTypes = getRequiredDocTypesForRole(staff.roleType);
        const isExpanded = expandedStaffId === staffId;
        const isApprovingThis = approvingStaffId === staffId;
        const isAnyApproving = approvingStaffId !== null;

        // Compute per-required-doc status for approve button logic
        type BlockerKind = "missing" | "pending" | "rejected" | "expired";
        interface Blocker {
          label: string;
          kind: BlockerKind;
        }

        const blockers: Blocker[] = [];
        let canApproveStaff = staff.complianceStatus !== "compliant";

        if (canApproveStaff) {
          for (const reqType of requiredDocTypes) {
            const matchingDoc = docs.find(
              (d) => d.documentType === reqType && d.isRequired !== false
            );
            const label = DOCUMENT_TYPE_LABELS[reqType] || reqType;
            if (!matchingDoc) {
              blockers.push({ label, kind: "missing" });
            } else if (matchingDoc.reviewStatus === "pending_review") {
              blockers.push({ label, kind: "pending" });
            } else if (matchingDoc.reviewStatus === "rejected") {
              blockers.push({ label, kind: "rejected" });
            } else if (matchingDoc.reviewStatus === "expired") {
              blockers.push({ label, kind: "expired" });
            }
          }
          canApproveStaff = blockers.length === 0 && requiredDocTypes.length > 0;
        }

        const approvedCount = requiredDocTypes.filter((reqType) => {
          const matchingDoc = docs.find(
            (d) => d.documentType === reqType && d.isRequired !== false
          );
          return matchingDoc?.reviewStatus === "approved";
        }).length;
        const totalRequired = requiredDocTypes.length;
        const progressPercent = totalRequired > 0 ? (approvedCount / totalRequired) * 100 : 0;
        const allDocsApproved = approvedCount >= totalRequired && staff.complianceStatus === "compliant";

        return (
          <Card
            key={staffId}
            className={cn("border-l-4 border-l-chart-3 overflow-hidden")}
          >
            <CardContent className="p-4 flex flex-col gap-3">
              {/* Staff Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(staff)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {getStaffName(staff)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {staff.roleType && (
                        <Badge
                          className={cn(
                            "rounded-full text-xs",
                            getRoleBadgeColor(staff.roleType)
                          )}
                        >
                          {staff.roleType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {staff.onboardingStatus === "incomplete" && (
                  <Badge className="bg-destructive/20 text-destructive gap-1">
                    <XCircle className="h-3 w-3" />
                    Incomplete
                  </Badge>
                )}
                {staff.onboardingStatus === "pending_review" && (
                  <Badge className="bg-chart-3/20 text-chart-3 gap-1">
                    <Clock className="h-3 w-3" />
                    Awaiting Review
                  </Badge>
                )}
                {staff.onboardingStatus === "approved" && (
                  <Badge className="bg-accent/20 text-accent gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Onboarding Approved
                  </Badge>
                )}

                {staff.complianceStatus === "compliant" && (
                  <Badge className="bg-accent/20 text-accent gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Compliant
                  </Badge>
                )}
                {staff.complianceStatus === "pending" && (
                  <Badge className="bg-chart-3/20 text-chart-3 gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
                {(staff.complianceStatus === "expired" ||
                  staff.complianceStatus === "blocked") && (
                  <Badge className="bg-destructive/20 text-destructive gap-1">
                    <XCircle className="h-3 w-3" />
                    {staff.complianceStatus === "expired" ? "Expired" : "Blocked"}
                  </Badge>
                )}
              </div>

              {/* Document Progress */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {approvedCount} of {totalRequired} docs approved
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* All Compliant Banner */}
              {allDocsApproved && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                  <p className="text-sm font-medium text-accent">
                    All documents approved! Staff is now compliant.
                  </p>
                </div>
              )}

              {/* Expand/Collapse Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toggleExpand(staffId)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Documents
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Review Documents ({docs.length})
                  </>
                )}
              </Button>

              {/* Approve Staff Button */}
              {canApproveStaff && (
                <p className="text-xs text-accent">
                  ✓ All required documents approved — ready to approve
                </p>
              )}
              <Button
                className="w-full h-11"
                disabled={!canApproveStaff || isAnyApproving}
                onClick={() => handleApproveStaff(staffId)}
              >
                {isApprovingThis ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve Staff
              </Button>

              {/* Blockers list when button is disabled */}
              {!canApproveStaff && staff.complianceStatus !== "compliant" && blockers.length > 0 && (
                <div className="bg-muted/50 rounded-md p-2 flex flex-col gap-1 mt-2">
                  {blockers.map((blocker, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {blocker.kind === "pending" || blocker.kind === "expired" ? (
                        <Clock className="h-3.5 w-3.5 shrink-0 text-chart-3" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {blocker.kind === "missing"
                          ? `Missing: ${blocker.label}`
                          : blocker.kind === "pending"
                          ? `Pending review: ${blocker.label}`
                          : blocker.kind === "rejected"
                          ? `Rejected: ${blocker.label}`
                          : `Expired: ${blocker.label}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded Document List */}
              {isExpanded && (
                <div className="flex flex-col gap-2 pt-2 border-t">
                  {docs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No documents uploaded yet.
                    </p>
                  ) : (
                    docs.map((doc) => {
                      const docTypeLabel =
                        doc.documentType
                          ? DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType
                          : doc.customDocumentName || "Unknown";
                      const isReviewing = rejectingDocId === doc.id;
                      const isProcessing = processingDocId === doc.id;

                      return (
                        <div
                          key={doc.id}
                          className="rounded-lg border p-3 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {docTypeLabel}
                                </p>
                                {doc.fileName && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.fileName}
                                  </p>
                                )}
                              </div>
                            </div>

                            {doc.reviewStatus === "approved" && (
                              <Badge className="bg-accent/20 text-accent gap-1 shrink-0">
                                <CheckCircle className="h-3 w-3" />
                                Approved
                              </Badge>
                            )}
                            {doc.reviewStatus === "pending_review" && (
                              <Badge className="bg-chart-3/20 text-chart-3 gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            {doc.reviewStatus === "rejected" && (
                              <Badge className="bg-destructive/20 text-destructive gap-1 shrink-0">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </Badge>
                            )}
                          </div>

                          {doc.expiryDate && (
                            <p className="text-xs text-muted-foreground">
                              Expires:{" "}
                              {(() => {
                                try {
                                  return format(parseISO(doc.expiryDate), "MMM d, yyyy");
                                } catch {
                                  return doc.expiryDate;
                                }
                              })()}
                            </p>
                          )}

                          {doc.reviewStatus === "rejected" && doc.rejectionReason && (
                            <p className="text-xs text-destructive">
                              Reason: {doc.rejectionReason}
                            </p>
                          )}

                          {doc.reviewStatus === "pending_review" && !isReviewing && (
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                size="sm"
                                className="h-9"
                                onClick={() =>
                                  handleApproveDocument(doc.id, staffId)
                                }
                                disabled={isProcessing}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleStartReject(doc.id)}
                                disabled={isProcessing}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {isReviewing && (
                            <div className="flex flex-col gap-2 pt-1">
                              <Textarea
                                placeholder="Enter reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) =>
                                  setRejectionReason(e.target.value)
                                }
                                className="min-h-[80px]"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-9"
                                  onClick={() =>
                                    handleSubmitRejection(doc.id, staffId)
                                  }
                                  disabled={isProcessing || !rejectionReason.trim()}
                                >
                                  Submit Rejection
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9"
                                  onClick={() => {
                                    setRejectingDocId(null);
                                    setRejectionReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};