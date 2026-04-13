import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  ROLE_FULL_NAMES,
  ROLE_DESCRIPTIONS,
  getAdditionalDocsForUpgrade,
} from "@/utils/roleUpgradeUtils";
import { DOCUMENT_TYPE_LABELS, getRequiredDocTypesForRole } from "@/utils/documentUtils";
import type { IStaffDocumentsEntity } from "@/product-types";
import { StaffMyDocumentsPage } from "@/product-types";
import { CheckCircle, XCircle, Loader2, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { useMemo, useCallback } from "react";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";

interface UpgradeRoleCardProps {
  currentRole: string;
  targetRole: string;
  approvedDocs: IStaffDocumentsEntity[];
  hasPendingApplication: boolean;
  isApplying: boolean;
  onApply: () => void;
}

export const UpgradeRoleCard = ({
  currentRole,
  targetRole,
  approvedDocs,
  hasPendingApplication,
  isApplying,
  onApply,
}: UpgradeRoleCardProps) => {
  const additionalDocs = useMemo(
    () => getAdditionalDocsForUpgrade(currentRole, targetRole),
    [currentRole, targetRole]
  );

  const approvedDocTypes = useMemo(() => {
    const types = new Set<string>();
    approvedDocs.forEach((doc) => {
      if (doc.reviewStatus === "approved" && doc.documentType) {
        types.add(doc.documentType);
      }
    });
    return types;
  }, [approvedDocs]);

  const handleApply = useCallback(() => {
    onApply();
  }, [onApply]);

  return (
    <div className="border rounded-lg p-4 space-y-4 transition-colors hover:border-primary/30">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Badge className={getRoleBadgeColor(targetRole)}>
          {targetRole}
        </Badge>
        <span className="font-semibold">
          {ROLE_FULL_NAMES[targetRole] || targetRole}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {ROLE_DESCRIPTIONS[targetRole] || ""}
      </p>

      {/* Additional Documents Needed */}
      {additionalDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Additional documents needed:</p>
          <div className="space-y-1.5">
            {additionalDocs.map((docType) => {
              const isApproved = approvedDocTypes.has(docType);
              return (
                <div
                  key={docType}
                  className="flex items-center gap-2 text-sm"
                >
                  {isApproved ? (
                    <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span
                    className={
                      isApproved ? "text-muted-foreground" : "text-foreground"
                    }
                  >
                    {DOCUMENT_TYPE_LABELS[docType] || docType}
                  </span>
                  {isApproved && (
                    <span className="text-xs text-accent">(Approved)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Application Warning with Document Status */}
      {hasPendingApplication && (
        <PendingApplicationInfo
          currentRole={currentRole}
          targetRole={targetRole}
          approvedDocs={approvedDocs}
        />
      )}

      {/* Apply Button */}
      <Button
        onClick={handleApply}
        disabled={hasPendingApplication || isApplying}
        className="w-full h-11"
      >
        {isApplying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          `Apply for ${targetRole}`
        )}
      </Button>
    </div>
  );
};

// --- Sub-component: Pending Application Info with doc statuses ---

interface PendingApplicationInfoProps {
  currentRole: string;
  targetRole: string;
  approvedDocs: IStaffDocumentsEntity[];
}

const PendingApplicationInfo = ({
  currentRole,
  targetRole,
  approvedDocs,
}: PendingApplicationInfoProps) => {
  const docsPageUrl = getPageUrl(StaffMyDocumentsPage);

  const { requiredDocs, hasMissingDocs } = useMemo(() => {
    const targetRequiredDocTypes = getRequiredDocTypesForRole(targetRole);

    const approvedDocTypes = new Set<string>();
    approvedDocs.forEach((doc) => {
      if (doc.reviewStatus === "approved" && doc.documentType) {
        approvedDocTypes.add(doc.documentType);
      }
    });

    const docs = targetRequiredDocTypes.map((docType) => ({
      type: docType,
      label: DOCUMENT_TYPE_LABELS[docType] || docType,
      isApproved: approvedDocTypes.has(docType),
    }));

    return {
      requiredDocs: docs,
      hasMissingDocs: docs.some((d) => !d.isApproved),
    };
  }, [targetRole, approvedDocs]);

  return (
    <div className="rounded-md bg-chart-3/10 border border-chart-3/20 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-chart-3 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-chart-3">
            Application pending review
          </p>
          <p className="text-xs text-muted-foreground">
            Your application is being processed. Make sure all documents are uploaded.
          </p>
        </div>
      </div>

      {/* Document checklist */}
      <div className="space-y-1.5 pl-6">
        {requiredDocs.map((doc) => (
          <div
            key={doc.type}
            className="flex items-center gap-2 text-sm"
          >
            {doc.isApproved ? (
              <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            <span
              className={
                doc.isApproved ? "text-muted-foreground" : "text-foreground"
              }
            >
              {doc.label}
            </span>
          </div>
        ))}
      </div>

      {/* Go to My Documents button if docs missing */}
      {hasMissingDocs && (
        <div className="pl-6">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5"
          >
            <Link to={docsPageUrl}>
              <FileText className="h-3.5 w-3.5" />
              Go to My Documents
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};