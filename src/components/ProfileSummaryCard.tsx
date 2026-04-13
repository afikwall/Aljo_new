import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import {
  getComplianceStatusConfig,
  getUserInitials,
  getOverallCompletion,
} from "@/utils/profileUtils";
import type { IStaffProfilesEntity } from "@/product-types";

interface ProfileSummaryCardProps {
  profile: IStaffProfilesEntity & { id: string };
  email: string;
  isEditMode: boolean;
  profilePhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
}

export const ProfileSummaryCard = ({
  profile,
  email,
  isEditMode,
  profilePhotoUrl,
  onPhotoUploaded,
}: ProfileSummaryCardProps) => {
  const initials = useMemo(
    () => getUserInitials(profile.firstName, profile.lastName),
    [profile.firstName, profile.lastName]
  );

  const complianceConfig = useMemo(
    () => getComplianceStatusConfig(profile.complianceStatus),
    [profile.complianceStatus]
  );

  const completion = useMemo(
    () => getOverallCompletion(profile),
    [profile]
  );

  const fullName = useMemo(() => {
    const parts = [profile.firstName, profile.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "New Staff Member";
  }, [profile.firstName, profile.lastName]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="flex-shrink-0">
            <ProfilePhotoUpload
              photoUrl={profilePhotoUrl || profile.profilePhotoUrl}
              initials={initials}
              isEditMode={isEditMode}
              onPhotoUploaded={onPhotoUploaded}
            />
          </div>

          <div className="flex-1 w-full text-center sm:text-left space-y-2">
            <h2 className="text-2xl font-bold">{fullName}</h2>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {profile.roleType && (
                <Badge className={getRoleBadgeColor(profile.roleType)}>
                  {profile.roleType}
                </Badge>
              )}
              <Badge className={complianceConfig.className}>
                {complianceConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 justify-center sm:justify-start text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{email}</span>
            </div>

            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Profile {completion.percentage}% complete
                </span>
                <span className="text-muted-foreground text-xs">
                  {completion.filled}/{completion.total} fields
                </span>
              </div>
              <Progress value={completion.percentage} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};