import { useMemo } from "react";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { StaffMyDocumentsPage } from "@/product-types";
import type { IStaffDocumentsEntity } from "@/product-types";
import { getDocumentCompletion, type WizardDocumentStatus } from "@/utils/onboardingUtils";

interface OnboardingStepDocumentsProps {
  roleType?: string;
  documents?: IStaffDocumentsEntity[];
  onNext: () => void;
  onBack: () => void;
}

const STATUS_CONFIG: Record<WizardDocumentStatus, { icon: typeof CheckCircle; className: string; label: string }> = {
  missing: {
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
    label: "Missing",
  },
  pending_review: {
    icon: Clock,
    className: "bg-chart-3/10 text-chart-3",
    label: "Pending Review",
  },
  approved: {
    icon: CheckCircle,
    className: "bg-accent/10 text-accent",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
    label: "Rejected — Re-upload needed",
  },
  expired: {
    icon: Clock,
    className: "bg-chart-3/10 text-chart-3",
    label: "Expired",
  },
};

export const OnboardingStepDocuments = ({
  roleType,
  documents,
  onNext,
  onBack,
}: OnboardingStepDocumentsProps) => {
  const completion = useMemo(
    () => getDocumentCompletion(roleType, documents),
    [roleType, documents]
  );

  const progressPercent = useMemo(
    () => (completion.total > 0 ? (completion.uploaded / completion.total) * 100 : 0),
    [completion.uploaded, completion.total]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Upload Your Documents</CardTitle>
            <CardDescription>
              Upload all required compliance documents for your role
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {completion.uploaded} of {completion.total} documents uploaded
            </span>
            <span className="text-sm font-medium">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Document checklist */}
        <div className="divide-y divide-border rounded-lg border">
          {completion.documentStatuses.map((doc) => {
            const config = STATUS_CONFIG[doc.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={doc.type}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium">{doc.label}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" className="h-10" onClick={onBack}>
              ← Back
            </Button>
            <Button variant="outline" className="h-10" asChild>
              <Link to={getPageUrl(StaffMyDocumentsPage)}>Go to My Documents</Link>
            </Button>
          </div>
          <Button
            className="h-12"
            disabled={!completion.allUploaded}
            onClick={onNext}
          >
            Next →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};