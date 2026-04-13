import React from "react";
import type { IStaffProfilesEntity } from "@/product-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
} from "lucide-react";

interface StaffProfilePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: (IStaffProfilesEntity & { id: string }) | null;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  RN: "bg-chart-1/20 text-chart-1",
  LPN: "bg-chart-2/20 text-chart-2",
  CCA: "bg-chart-3/20 text-chart-3",
  CITR: "bg-chart-4/20 text-chart-4",
};

function getInitials(staff: IStaffProfilesEntity): string {
  if (staff.firstName && staff.lastName) {
    return `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
  }
  if (staff.firstName) return staff.firstName.slice(0, 2).toUpperCase();
  if (staff.email) return staff.email.slice(0, 2).toUpperCase();
  return "??";
}

function ComplianceBadge({ status }: { status?: string }) {
  if (!status) return null;
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    compliant: {
      label: "Compliant",
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "bg-accent/20 text-accent",
    },
    pending: {
      label: "Pending",
      icon: <Clock className="h-3 w-3" />,
      className: "bg-chart-2/20 text-chart-2",
    },
    expired: {
      label: "Expired",
      icon: <XCircle className="h-3 w-3" />,
      className: "bg-destructive/20 text-destructive",
    },
    blocked: {
      label: "Blocked",
      icon: <AlertCircle className="h-3 w-3" />,
      className: "bg-destructive/20 text-destructive",
    },
  };
  const c = config[status] || { label: status, icon: null, className: "bg-muted text-muted-foreground" };
  return (
    <Badge className={cn("flex items-center gap-1", c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

function OnboardingBadge({ status }: { status?: string }) {
  if (!status) return null;
  const config: Record<string, { label: string; className: string }> = {
    approved: { label: "Approved", className: "bg-accent/20 text-accent" },
    pending_review: { label: "Pending Review", className: "bg-chart-2/20 text-chart-2" },
    incomplete: { label: "Incomplete", className: "bg-destructive/20 text-destructive" },
    rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
  };
  const c = config[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cn(c.className)}>{c.label}</Badge>;
}

export const StaffProfilePopup = ({
  open,
  onOpenChange,
  staff,
}: StaffProfilePopupProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="sr-only">Staff Profile</SheetTitle>
          {!staff ? (
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Avatar className="size-16 shrink-0">
                <AvatarImage src={staff.profilePhotoUrl} alt={`${staff.firstName ?? ""} ${staff.lastName ?? ""}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(staff)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-base font-semibold leading-tight">
                  {[staff.firstName, staff.lastName].filter(Boolean).join(" ") || "Unknown Staff"}
                </p>
                {staff.email && (
                  <p className="text-sm text-muted-foreground truncate">{staff.email}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {staff.roleType && (
                    <Badge className={cn("text-xs", ROLE_BADGE_COLORS[staff.roleType] ?? "bg-muted text-muted-foreground")}>
                      {staff.roleType}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!staff ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Status Badges */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {staff.complianceStatus && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Compliance</span>
                      <ComplianceBadge status={staff.complianceStatus} />
                    </div>
                  )}
                  {staff.onboardingStatus && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Onboarding</span>
                      <OnboardingBadge status={staff.onboardingStatus} />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              {(staff.phone || staff.city || staff.province) && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</p>
                  <div className="flex flex-col gap-2">
                    {staff.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                    {(staff.city || staff.province) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{[staff.city, staff.province].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(staff.emergencyContactName || staff.emergencyContactPhone) && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
                    <div className="flex flex-col gap-1">
                      {staff.emergencyContactName && (
                        <span className="text-sm font-medium">{staff.emergencyContactName}</span>
                      )}
                      {staff.emergencyContactPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{staff.emergencyContactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Experience */}
              {staff.yearsOfExperience != null && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Experience</p>
                    <span className="text-sm">{staff.yearsOfExperience} year{staff.yearsOfExperience !== 1 ? "s" : ""}</span>
                  </div>
                </>
              )}

              {/* Oriented Facilities */}
              {staff.orientedFacilityIds != null && staff.orientedFacilityIds.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">
                      Oriented at <span className="font-medium">{staff.orientedFacilityIds.length}</span> facilit{staff.orientedFacilityIds.length === 1 ? "y" : "ies"}
                    </span>
                  </div>
                </>
              )}

              {/* Special Skills */}
              {staff.specialSkills && staff.specialSkills.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Special Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {staff.specialSkills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Languages */}
              {staff.languages && staff.languages.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {staff.languages.map((lang, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};