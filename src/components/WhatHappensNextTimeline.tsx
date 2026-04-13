import React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Clock, ArrowRight, Info } from "lucide-react";
import { Link } from "react-router";
import { getPageUrl, cn } from "@/lib/utils";
import { StaffMyDocumentsPage } from "@/product-types";
import type { IStaffDocumentsEntity } from "@/product-types";
import { DOCUMENT_TYPE_LABELS, getRequiredDocTypesForRole } from "@/utils/documentUtils";
import {
  getAdditionalDocsForUpgrade,
  ROLE_FULL_NAMES,
} from "@/utils/roleUpgradeUtils";

interface WhatHappensNextTimelineProps {
  currentRole: string;
  targetRole: string;
  staffDocs: IStaffDocumentsEntity[];
}

interface TimelineStep {
  number: number;
  title: string;
  description: string;
  status: "completed" | "active" | "pending";
  content?: React.ReactNode;
}

export const WhatHappensNextTimeline = ({
  currentRole,
  targetRole,
  staffDocs,
}: WhatHappensNextTimelineProps) => {
  const docsPageUrl = getPageUrl(StaffMyDocumentsPage);

  // Compute required docs for the TARGET role and their statuses
  const { requiredDocs, allDocsApproved, hasMissingDocs } = useMemo(() => {
    const targetRequiredDocTypes = getRequiredDocTypesForRole(targetRole);

    const approvedDocTypes = new Set<string>();
    staffDocs.forEach((doc) => {
      if (doc.reviewStatus === "approved" && doc.documentType) {
        approvedDocTypes.add(doc.documentType);
      }
    });

    const docs = targetRequiredDocTypes.map((docType) => ({
      type: docType,
      label: DOCUMENT_TYPE_LABELS[docType] || docType,
      isApproved: approvedDocTypes.has(docType),
    }));

    const allApproved = docs.every((d) => d.isApproved);
    const hasMissing = docs.some((d) => !d.isApproved);

    return { requiredDocs: docs, allDocsApproved: allApproved, hasMissingDocs: hasMissing };
  }, [targetRole, staffDocs]);

  const steps = useMemo<TimelineStep[]>(() => {
    const step2Status: "completed" | "active" | "pending" = allDocsApproved
      ? "completed"
      : "active";
    const step3Status: "completed" | "active" | "pending" = allDocsApproved
      ? "active"
      : "pending";

    return [
      {
        number: 1,
        title: "Application Submitted",
        description: `Your application to upgrade to ${ROLE_FULL_NAMES[targetRole] || targetRole} has been received.`,
        status: "completed" as const,
      },
      {
        number: 2,
        title: "Upload Required Documents",
        description: allDocsApproved
          ? "All required documents have been approved."
          : "Please ensure all required documents are uploaded and approved.",
        status: step2Status,
        content: (
          <div className="mt-2 space-y-2">
            <div className="space-y-1.5">
              {requiredDocs.map((doc) => (
                <div
                  key={doc.type}
                  className="flex items-center gap-2 text-sm"
                >
                  {doc.isApproved ? (
                    <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                  ) : (
                    <span className="flex h-3.5 w-3.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      doc.isApproved
                        ? "text-muted-foreground line-through"
                        : "text-foreground font-medium"
                    )}
                  >
                    {doc.label}
                  </span>
                </div>
              ))}
            </div>
            {hasMissingDocs && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="mt-2 gap-1.5"
              >
                <Link to={docsPageUrl}>
                  <FileText className="h-3.5 w-3.5" />
                  Go to My Documents
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        ),
      },
      {
        number: 3,
        title: "Admin Review",
        description:
          "ALJO will review your application and documents. This usually takes 2-5 business days.",
        status: step3Status,
      },
      {
        number: 4,
        title: "Role Updated",
        description:
          "Once approved, your role will be updated and you'll gain access to higher-level shifts.",
        status: "pending" as const,
      },
    ];
  }, [targetRole, allDocsApproved, requiredDocs, hasMissingDocs, docsPageUrl]);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-sm">What happens next?</h4>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex gap-3 pb-4 last:pb-0">
              {/* Left: Circle + Connecting Line */}
              <div className="flex flex-col items-center">
                {/* Circle Indicator */}
                <div className="relative shrink-0">
                  {step.status === "completed" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : step.status === "active" ? (
                    <div className="relative">
                      {hasMissingDocs && step.number === 2 && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-primary/5 animate-pulse" />
                      )}
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        {step.number}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                      {step.number}
                    </div>
                  )}
                </div>
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[16px] mt-1",
                      step.status === "completed"
                        ? "bg-accent/40"
                        : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Right: Content */}
              <div className="flex-1 pt-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.status === "completed" && "text-accent",
                    step.status === "active" && "text-foreground",
                    step.status === "pending" && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "text-sm mt-0.5",
                    step.status === "pending"
                      ? "text-muted-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {step.description}
                </p>
                {step.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};