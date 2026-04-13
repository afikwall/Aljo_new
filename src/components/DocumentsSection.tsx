import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { StaffMyDocumentsPage } from "@/product-types";
import type { IStaffDocumentsEntity, IStaffProfilesEntity } from "@/product-types";
import {
  getRequiredDocTypesForRole,
  DOCUMENT_TYPE_LABELS,
  getDocumentStatus,
} from "@/utils/documentUtils";
import { getComplianceStatusConfig } from "@/utils/profileUtils";
import {
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";

interface DocumentsSectionProps {
  profile: IStaffProfilesEntity & { id: string };
  documents: (IStaffDocumentsEntity & { id: string })[];
}

export const DocumentsSection = ({
  profile,
  documents,
}: DocumentsSectionProps) => {
  const requiredDocTypes = useMemo(
    () => getRequiredDocTypesForRole(profile.roleType),
    [profile.roleType]
  );

  const docStatusMap = useMemo(() => {
    const map: Record<string, { status: string; doc?: IStaffDocumentsEntity & { id: string } }> = {};

    for (const docType of requiredDocTypes) {
      const matchingDocs = documents.filter((d) => d.documentType === docType);
      if (matchingDocs.length === 0) {
        map[docType] = { status: "missing" };
      } else {
        // Pick best status: approved > pending_review > rejected > expired
        const approved = matchingDocs.find((d) => getDocumentStatus(d) === "approved");
        const pending = matchingDocs.find((d) => getDocumentStatus(d) === "pending_review");
        if (approved) {
          map[docType] = { status: "approved", doc: approved };
        } else if (pending) {
          map[docType] = { status: "pending_review", doc: pending };
        } else {
          const latest = matchingDocs[0];
          map[docType] = { status: getDocumentStatus(latest), doc: latest };
        }
      }
    }
    return map;
  }, [requiredDocTypes, documents]);

  const approvedCount = useMemo(
    () => Object.values(docStatusMap).filter((v) => v.status === "approved").length,
    [docStatusMap]
  );

  const totalRequired = requiredDocTypes.length;
  const progressPercent = totalRequired > 0 ? Math.round((approvedCount / totalRequired) * 100) : 0;

  const complianceConfig = useMemo(
    () => getComplianceStatusConfig(profile.complianceStatus),
    [profile.complianceStatus]
  );

  const onboardingLabel = useMemo(() => {
    const labels: Record<string, { className: string; label: string }> = {
      incomplete: { className: "bg-chart-3/20 text-chart-3", label: "Incomplete" },
      pending_review: { className: "bg-chart-1/20 text-chart-1", label: "Pending Review" },
      approved: { className: "bg-accent/20 text-accent", label: "Approved" },
      rejected: { className: "bg-destructive/20 text-destructive", label: "Rejected" },
    };
    return labels[profile.onboardingStatus || ""] || labels.incomplete;
  }, [profile.onboardingStatus]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {approvedCount} of {totalRequired} required documents approved
          </span>
          <span className="text-muted-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={complianceConfig.className}>
          Compliance: {complianceConfig.label}
        </Badge>
        <Badge className={onboardingLabel.className}>
          Onboarding: {onboardingLabel.label}
        </Badge>
      </div>

      {/* Document Checklist */}
      <div className="space-y-2">
        {requiredDocTypes.map((docType) => {
          const entry = docStatusMap[docType];
          const label = DOCUMENT_TYPE_LABELS[docType] || docType;
          return (
            <div
              key={docType}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
            >
              <StatusIcon status={entry?.status || "missing"} />
              <span className="text-sm flex-1">{label}</span>
              <StatusBadge status={entry?.status || "missing"} />
            </div>
          );
        })}
      </div>

      {/* Go to Documents Button */}
      <Button asChild className="w-full h-11">
        <Link to={getPageUrl(StaffMyDocumentsPage)}>
          <FileText className="h-4 w-4 mr-2" />
          Go to My Documents
        </Link>
      </Button>
    </div>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />;
    case "pending_review":
      return <Clock className="h-4 w-4 text-chart-3 flex-shrink-0" />;
    default:
      return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { className: string; label: string }> = {
    approved: { className: "bg-accent/20 text-accent", label: "Approved" },
    pending_review: { className: "bg-chart-3/20 text-chart-3", label: "Pending" },
    missing: { className: "bg-destructive/20 text-destructive", label: "Missing" },
    rejected: { className: "bg-destructive/20 text-destructive", label: "Rejected" },
    expired: { className: "bg-chart-3/20 text-chart-3", label: "Expired" },
  };
  const config = configs[status] || configs.missing;
  return (
    <Badge className={config.className} variant="secondary">
      {config.label}
    </Badge>
  );
};