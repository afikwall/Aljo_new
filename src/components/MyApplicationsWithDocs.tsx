import { useMemo } from "react";
import { Link } from "react-router";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  RoleUpgradeApplicationsEntity,
  StaffDocumentsEntity,
  StaffMyDocumentsPage,
  type IStaffDocumentsEntity,
} from "@/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  getUpgradeStatusBadge,
  formatApplicationDate,
  ROLE_FULL_NAMES,
} from "@/utils/roleUpgradeUtils";
import {
  getRequiredDocTypesForRole,
  DOCUMENT_TYPE_LABELS,
  getDocumentStatus,
} from "@/utils/documentUtils";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  CalendarX2,
  Trophy,
  FileUp,
} from "lucide-react";
import { getPageUrl } from "@/lib/utils";

type DocumentStatus =
  | "missing"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired";

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

interface MyApplicationsWithDocsProps {
  staffProfileId: string;
}

export const MyApplicationsWithDocs = ({
  staffProfileId,
}: MyApplicationsWithDocsProps) => {
  const { data: applications, isLoading: loadingApps } = useEntityGetAll(
    RoleUpgradeApplicationsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { data: staffDocs, isLoading: loadingDocs } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const sortedApps = useMemo(() => {
    if (!applications) return [];
    return [...applications]
      .map((app) => ({ ...app, id: (app as any).id as string }))
      .sort((a, b) => {
        const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
        const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [applications]);

  const isLoading = loadingApps || loadingDocs;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (sortedApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed min-h-[140px] p-6 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No role upgrade applications yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Visit Career Path to apply.
        </p>
      </div>
    );
  }

  const allDocs = staffDocs || [];

  return (
    <div className="space-y-3">
      {sortedApps.map((app) => {
        const statusBadge = getUpgradeStatusBadge(app.status);
        const targetDocTypes = getRequiredDocTypesForRole(app.requestedRole);
        const approvedCount = targetDocTypes.filter(
          (dt) => getDocStatusForType(dt, allDocs) === "approved"
        ).length;
        const progressPercent =
          targetDocTypes.length > 0
            ? (approvedCount / targetDocTypes.length) * 100
            : 0;
        const hasMissingDocs = targetDocTypes.some((dt) => {
          const status = getDocStatusForType(dt, allDocs);
          return status === "missing" || status === "rejected";
        });

        return (
          <Card key={app.id} className="border rounded-lg">
            <CardContent className="p-4 space-y-3">
              {/* Header: Role transition + status + date */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(app.currentRole)}>
                    {app.currentRole}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className={getRoleBadgeColor(app.requestedRole)}>
                    {app.requestedRole}
                  </Badge>
                </div>
                <Badge className={statusBadge.className}>
                  {app.status === "approved" && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {app.status === "rejected" && (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {(app.status === "pending" ||
                    app.status === "under_review") && (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {statusBadge.label}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Applied {formatApplicationDate(app.appliedAt)}
              </p>

              {/* Required Documents Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {approvedCount} of {targetDocTypes.length} docs approved
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />

                <div className="space-y-1">
                  {targetDocTypes.map((dt) => {
                    const docStatus = getDocStatusForType(dt, allDocs);
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

              {/* Rejection banner */}
              {app.status === "rejected" && app.rejectionReason && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive">
                      Rejection Reason
                    </p>
                    <p className="text-xs mt-0.5">{app.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Congratulations banner */}
              {app.status === "approved" && (
                <div className="flex items-start gap-2 rounded-md bg-accent/10 border border-accent/20 p-3">
                  <Trophy className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">
                    Congratulations! Your upgrade to{" "}
                    {ROLE_FULL_NAMES[app.requestedRole || ""] ||
                      app.requestedRole}{" "}
                    has been approved!
                  </p>
                </div>
              )}

              {/* Upload Documents link if missing docs */}
              {hasMissingDocs &&
                app.status !== "approved" &&
                app.status !== "rejected" && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={getPageUrl(StaffMyDocumentsPage)}>
                      <FileUp className="h-4 w-4 mr-1.5" />
                      Upload Documents
                    </Link>
                  </Button>
                )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};