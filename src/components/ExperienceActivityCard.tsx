import { useEffect, useMemo } from "react";
import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { GetStaffActivityStatsAction, type IStaffProfilesEntity } from "@/product-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { StarRating } from "@/components/StarRating";
import {
  Briefcase,
  Stethoscope,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Building2,
} from "lucide-react";
import {
  formatHoursWorked,
  getReliabilityColor,
  getReliabilityTextColor,
} from "@/utils/reliabilityUtils";

interface EmployerItem {
  company: string;
  role: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

const parseEmployers = (
  items?: { name: string; expiryDate?: string }[]
): EmployerItem[] => {
  if (!items) return [];
  return items
    .map((item) => {
      try {
        return JSON.parse(item.name) as EmployerItem;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as EmployerItem[];
};

const formatDateRange = (emp: EmployerItem): string => {
  const start =
    emp.startMonth && emp.startYear
      ? `${emp.startMonth} ${emp.startYear}`
      : "Unknown";
  const end = emp.isCurrent
    ? "Present"
    : emp.endMonth && emp.endYear
      ? `${emp.endMonth} ${emp.endYear}`
      : "Unknown";
  return `${start} – ${end}`;
};

interface ExperienceActivityCardProps {
  staff: IStaffProfilesEntity & { id: string };
}

export const ExperienceActivityCard = ({
  staff,
}: ExperienceActivityCardProps) => {
  const { executeFunction, result, isLoading, isDone } = useExecuteAction(
    GetStaffActivityStatsAction
  );

  useEffect(() => {
    if (staff.id) {
      executeFunction({ staffProfileId: staff.id });
    }
  }, [staff.id, executeFunction]);

  const stats = result;

  const employers = useMemo(
    () => parseEmployers(staff.previousEmployers?.items),
    [staff.previousEmployers]
  );

  const reliabilityBarColor = useMemo(() => {
    if (!stats) return "bg-muted";
    return getReliabilityColor(stats.reliabilityScore);
  }, [stats]);

  const reliabilityTextColor = useMemo(() => {
    if (!stats) return "text-muted-foreground";
    return getReliabilityTextColor(stats.reliabilityScore);
  }, [stats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Experience &amp; Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Experience Section */}
        <div className="space-y-3">
          {/* Total Healthcare Years */}
          {(staff.totalHealthcareYears ?? staff.yearsOfExperience) != null && (
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-sm">
                {staff.totalHealthcareYears ?? staff.yearsOfExperience} year
                {(staff.totalHealthcareYears ?? staff.yearsOfExperience ?? 0) !== 1 ? "s" : ""}{" "}
                in healthcare
              </Badge>
            </div>
          )}

          {/* Special Skills */}
          {staff.specialSkills && staff.specialSkills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Special Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {staff.specialSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {staff.certifications?.items &&
            staff.certifications.items.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Certifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staff.certifications.items.map((cert, i) => (
                    <Badge
                      key={`${cert.name}-${i}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {cert.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Languages */}
          {staff.languages && staff.languages.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {staff.languages.map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Previous Employers */}
          {employers.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Previous Employers
              </p>
              <div className="space-y-2">
                {employers.map((emp, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-l-primary/30 pl-3 py-1"
                  >
                    <p className="font-bold text-sm">{emp.company}</p>
                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(emp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* ALJO Activity Stats Section */}
        <div className="bg-primary/5 rounded-lg p-3 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            ALJO Activity Stats
          </p>

          {(isLoading || !isDone) ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <div className="grid grid-cols-4 gap-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ) : !stats || stats.totalShiftsCompleted === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No shifts completed yet
            </p>
          ) : (
            <>
              {/* ReliabilityBadge */}
              <ReliabilityBadge
                totalShiftsCompleted={stats.totalShiftsCompleted}
                size="md"
              />

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-background rounded p-2 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs text-muted-foreground">
                      Shifts
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {stats.totalShiftsCompleted}
                  </p>
                </div>
                <div className="bg-background rounded p-2 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-chart-1" />
                    <span className="text-xs text-muted-foreground">
                      Hours
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {formatHoursWorked(stats.totalHoursWorked)}
                  </p>
                </div>
                <div className="bg-background rounded p-2 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-chart-2" />
                    <span className="text-xs text-muted-foreground">
                      Reliability
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {stats.reliabilityScore.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-background rounded p-2 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-chart-3" />
                    <span className="text-xs text-muted-foreground">
                      Rating
                    </span>
                  </div>
                  {stats.averageRating > 0 ? (
                    <StarRating
                      rating={stats.averageRating}
                      size="sm"
                      showNumeric
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              {/* Reliability Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Reliability Score
                  </span>
                  <span className={`font-semibold ${reliabilityTextColor}`}>
                    {stats.reliabilityScore.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${reliabilityBarColor}`}
                    style={{
                      width: `${Math.min(stats.reliabilityScore, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Roles Performed */}
              {stats.rolesPerformed.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Roles Performed
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {stats.rolesPerformed.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="text-xs"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Facility Names */}
              {stats.uniqueFacilityNames.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Facilities Worked
                  </p>
                  <div className="space-y-0.5">
                    {stats.uniqueFacilityNames.slice(0, 5).map((name) => (
                      <p
                        key={name}
                        className="text-xs text-muted-foreground"
                      >
                        {name}
                      </p>
                    ))}
                    {stats.uniqueFacilityNames.length > 5 && (
                      <p className="text-xs text-muted-foreground italic">
                        +{stats.uniqueFacilityNames.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};