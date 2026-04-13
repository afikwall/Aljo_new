import { useMemo } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffRatingsEntity, FacilitiesEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/StarRating";
import { Star, Building2 } from "lucide-react";
import {
  formatRatingDate,
  getRatingBorderColor,
  getSubScoreLabel,
} from "@/utils/ratingUtils";
import { cn } from "@/lib/utils";

interface StaffReviewsProps {
  staffProfileId: string;
}

export const StaffReviews = ({ staffProfileId }: StaffReviewsProps) => {
  const { data: ratings, isLoading: loadingRatings } = useEntityGetAll(
    StaffRatingsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { data: facilities } = useEntityGetAll(FacilitiesEntity);

  // Build facility lookup
  const facilityMap = useMemo(() => {
    const map = new Map<string, string>();
    facilities?.forEach((f) => {
      if (f.id && f.name) map.set(f.id, f.name);
    });
    return map;
  }, [facilities]);

  // Sort ratings by ratedAt descending
  const sortedRatings = useMemo(() => {
    if (!ratings) return [];
    return [...ratings].sort((a, b) => {
      const dateA = a.ratedAt ? new Date(a.ratedAt).getTime() : 0;
      const dateB = b.ratedAt ? new Date(b.ratedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [ratings]);

  if (loadingRatings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            My Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          My Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedRatings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
            <Star className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete shifts to receive ratings from facilities.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRatings.map((rating) => {
              const facilityName = rating.facilityId
                ? facilityMap.get(rating.facilityId) || "Unknown Facility"
                : "Unknown Facility";
              const ratingValue = rating.rating || 0;
              const borderColor = getRatingBorderColor(ratingValue);

              const subScores = [
                {
                  key: "reliabilityScore",
                  value: rating.reliabilityScore,
                },
                {
                  key: "professionalism",
                  value: rating.professionalism,
                },
                {
                  key: "clinicalSkills",
                  value: rating.clinicalSkills,
                },
              ].filter((s) => s.value && s.value > 0);

              return (
                <div
                  key={rating.id}
                  className={cn(
                    "p-4 rounded-lg border border-l-4",
                    borderColor
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{facilityName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Building2 className="h-3 w-3" />
                        <span>Facility Manager</span>
                        <span className="mx-1">&bull;</span>
                        <span>{formatRatingDate(rating.ratedAt)}</span>
                      </div>
                    </div>
                    <StarRating
                      rating={ratingValue}
                      size="sm"
                      showNumeric
                    />
                  </div>

                  {/* Sub-scores */}
                  {subScores.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subScores.map((score) => (
                        <Badge
                          key={score.key}
                          variant="outline"
                          className="text-xs gap-1"
                        >
                          {getSubScoreLabel(score.key)} {score.value}
                          <Star className="h-2.5 w-2.5 fill-chart-3 text-chart-3" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  {rating.comment && (
                    <p className="text-sm italic text-muted-foreground mt-2">
                      &ldquo;{rating.comment}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};