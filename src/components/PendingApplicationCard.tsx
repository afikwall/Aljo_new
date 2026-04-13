import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Zap,
  Briefcase,
  FileText,
  Users,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLE_BADGE_COLORS,
  COMPLIANCE_BADGE_COLORS,
  formatShiftDateTime,
  getShiftDuration,
  getRelativeTime,
  getStaffDisplayName,
  getStaffInitials,
} from "@/utils/shiftApplicationUtils";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import type { IShiftsEntity, IStaffProfilesEntity, IFacilitiesEntity } from "@/product-types";

interface PendingApplicationCardProps {
  applicationId: string;
  shift: (IShiftsEntity & { id: string }) | null;
  staff: (IStaffProfilesEntity & { id: string }) | null;
  facility: (IFacilitiesEntity & { id: string }) | null;
  appliedAt?: string;
  otherApplicantCount: number;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  isProcessing: boolean;
  processingId: string | null;
  onShiftClick?: () => void;
  onStaffClick?: () => void;
}

export const PendingApplicationCard = ({
  applicationId,
  shift,
  staff,
  facility,
  appliedAt,
  otherApplicantCount,
  onApprove,
  onReject,
  isProcessing,
  processingId,
  onShiftClick,
  onStaffClick,
}: PendingApplicationCardProps) => {
  const staffName = getStaffDisplayName(staff?.firstName, staff?.lastName, staff?.email);
  const initials = getStaffInitials(staff?.firstName, staff?.lastName);
  const complianceInfo = COMPLIANCE_BADGE_COLORS[staff?.complianceStatus || ""] || {
    className: "bg-muted text-muted-foreground",
    label: "Unknown",
  };
  const isThisProcessing = isProcessing && processingId === applicationId;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT SIDE — Shift Details — clickable */}
          <div
            className="space-y-3 hover:bg-muted/50 cursor-pointer rounded-lg p-2 -m-2 transition-colors"
            onClick={onShiftClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onShiftClick?.();
              }
            }}
          >
            {/* Facility name and city */}
            <div>
              <p className="font-semibold">{facility?.name || "Unknown Facility"}</p>
              {facility?.city && (
                <p className="text-sm text-muted-foreground">{facility.city}</p>
              )}
            </div>

            {/* Date/time */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{formatShiftDateTime(shift?.startDateTime, shift?.endDateTime)}</span>
            </div>

            {/* Duration */}
            <p className="text-sm text-muted-foreground">
              {getShiftDuration(shift?.startDateTime, shift?.endDateTime)}
            </p>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {shift?.requiredRole && (
                <Badge
                  className={cn(
                    "rounded-full text-xs px-2 py-0.5",
                    ROLE_BADGE_COLORS[shift.requiredRole] || "bg-muted text-muted-foreground"
                  )}
                >
                  {shift.requiredRole}
                </Badge>
              )}
              {shift?.isShortNotice && (
                <Badge className="rounded-full text-xs px-2 py-0.5 bg-chart-3/20 text-chart-3">
                  <Zap className="h-3 w-3 mr-1" />
                  Short Notice
                </Badge>
              )}
            </div>

            {/* Shift notes */}
            {shift?.notes && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground italic">
                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{shift.notes}</span>
              </div>
            )}

            {/* Other applicants count */}
            {otherApplicantCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{otherApplicantCount} other applicant{otherApplicantCount !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* RIGHT SIDE — Applicant Details — clickable */}
          <div
            className="space-y-3 hover:bg-muted/50 cursor-pointer rounded-lg p-2 -m-2 transition-colors"
            onClick={onStaffClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onStaffClick?.();
              }
            }}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              {staff?.profilePhotoUrl ? (
                <img
                  src={staff.profilePhotoUrl}
                  alt={staffName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
              )}
              <div>
                <p className="font-semibold">{staffName}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {staff?.roleType && (
                    <Badge
                      className={cn(
                        "rounded-full text-xs px-2 py-0.5",
                        ROLE_BADGE_COLORS[staff.roleType] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {staff.roleType}
                    </Badge>
                  )}
                  <ReliabilityBadge totalShiftsCompleted={staff?.totalRatings || 0} size="sm" />
                </div>
              </div>
            </div>

            {/* Compliance badge */}
            <div>
              <Badge className={cn("rounded-full text-xs px-2 py-0.5", complianceInfo.className)}>
                {complianceInfo.label}
              </Badge>
            </div>

            {/* Years of experience */}
            {staff?.yearsOfExperience != null && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{staff.yearsOfExperience} yrs exp</span>
              </div>
            )}

            {/* Special skills */}
            {staff?.specialSkills && staff.specialSkills.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {staff.specialSkills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs px-2 py-0.5">
                    {skill}
                  </Badge>
                ))}
                {staff.specialSkills.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{staff.specialSkills.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Applied time ago */}
            <p className="text-xs text-muted-foreground">
              Applied {getRelativeTime(appliedAt)}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t md:justify-end">
          <Button
            className="h-11 flex-1 md:flex-none bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => onApprove(applicationId)}
            disabled={isProcessing}
          >
            {isThisProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1 md:flex-none border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => onReject(applicationId)}
            disabled={isProcessing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};