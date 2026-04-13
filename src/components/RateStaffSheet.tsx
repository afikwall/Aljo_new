import { useState, useCallback, useMemo } from "react";
import {
  useExecuteAction,
  useEntityGetAll,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StarRating } from "@/components/StarRating";
import { SubmitStaffRatingAction, StaffRatingsEntity } from "@/product-types";
import { ChevronDown, Loader2, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/utils/shiftUtils";

interface RateStaffSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: {
    id: string;
    requiredRole?: string;
    startDateTime?: string;
    endDateTime?: string;
  } | null;
  staffProfile: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profilePhotoUrl?: string;
    roleType?: string;
  } | null;
  facilityId: string;
  ratedByEmail: string;
  onSuccess?: () => void;
}

export const RateStaffSheet = ({
  open,
  onOpenChange,
  shift,
  staffProfile,
  facilityId,
  ratedByEmail,
  onSuccess,
}: RateStaffSheetProps) => {
  const [overallRating, setOverallRating] = useState(0);
  const [reliabilityScore, setReliabilityScore] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [clinicalSkills, setClinicalSkills] = useState(0);
  const [comment, setComment] = useState("");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { executeFunction: submitRating, isLoading: submitting } =
    useExecuteAction(SubmitStaffRatingAction);

  // Check if already rated
  const { data: existingRatings } = useEntityGetAll(
    StaffRatingsEntity,
    { shiftId: shift?.id || "", staffProfileId: staffProfile?.id || "" },
    { enabled: !!shift?.id && !!staffProfile?.id && open }
  );

  const existingRating = useMemo(() => {
    if (!existingRatings || existingRatings.length === 0) return null;
    return existingRatings[0];
  }, [existingRatings]);

  const initials = useMemo(() => {
    const first = staffProfile?.firstName?.[0] || "";
    const last = staffProfile?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "S";
  }, [staffProfile?.firstName, staffProfile?.lastName]);

  const shiftDateDisplay = useMemo(() => {
    if (!shift?.startDateTime) return "";
    try {
      const start = parseISO(shift.startDateTime);
      const end = shift.endDateTime ? parseISO(shift.endDateTime) : null;
      const dateStr = format(start, "EEE, MMM d, yyyy");
      const timeStr = end
        ? `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
        : format(start, "h:mm a");
      return `${dateStr} • ${timeStr}`;
    } catch {
      return "";
    }
  }, [shift?.startDateTime, shift?.endDateTime]);

  const handleSubmit = useCallback(async () => {
    if (!shift || !staffProfile || overallRating === 0) return;

    try {
      const result = await submitRating({
        staffProfileId: staffProfile.id,
        shiftId: shift.id,
        facilityId,
        ratedByEmail,
        rating: overallRating,
        reliabilityScore: reliabilityScore > 0 ? reliabilityScore : undefined,
        professionalism: professionalism > 0 ? professionalism : undefined,
        clinicalSkills: clinicalSkills > 0 ? clinicalSkills : undefined,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setShowSuccess(true);
        toast.success(
          `Rating submitted! New average: ${result.newAverageRating.toFixed(1)} stars`
        );
        setTimeout(() => {
          onOpenChange(false);
          resetForm();
          onSuccess?.();
        }, 1500);
      }
    } catch {
      toast.error("Failed to submit rating. Please try again.");
    }
  }, [
    shift,
    staffProfile,
    facilityId,
    ratedByEmail,
    overallRating,
    reliabilityScore,
    professionalism,
    clinicalSkills,
    comment,
    submitRating,
    onOpenChange,
    onSuccess,
  ]);

  const resetForm = useCallback(() => {
    setOverallRating(0);
    setReliabilityScore(0);
    setProfessionalism(0);
    setClinicalSkills(0);
    setComment("");
    setBreakdownOpen(false);
    setShowSuccess(false);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetForm]
  );

  if (!shift || !staffProfile) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Rate Staff</SheetTitle>
          <SheetDescription className="sr-only">
            Rate staff member after completed shift
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Staff Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={staffProfile.profilePhotoUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-lg">
                {staffProfile.firstName} {staffProfile.lastName}
              </p>
              <div className="flex items-center gap-2">
                {(staffProfile.roleType || shift.requiredRole) && (
                  <Badge
                    className={getRoleBadgeColor(
                      staffProfile.roleType || shift.requiredRole
                    )}
                  >
                    {staffProfile.roleType || shift.requiredRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Shift date/time */}
          {shiftDateDisplay && (
            <p className="text-sm text-muted-foreground">{shiftDateDisplay}</p>
          )}

          <Separator />

          {/* Already rated state */}
          {existingRating ? (
            <div className="space-y-4">
              <Badge className="bg-accent/20 text-accent gap-1">
                <CheckCircle className="h-3 w-3" />
                Already Rated
              </Badge>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Overall Rating
                  </p>
                  <StarRating
                    rating={existingRating.rating || 0}
                    size="lg"
                    interactive={false}
                  />
                </div>
                {existingRating.reliabilityScore && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reliability</span>
                    <StarRating
                      rating={existingRating.reliabilityScore}
                      size="sm"
                      interactive={false}
                    />
                  </div>
                )}
                {existingRating.professionalism && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Professionalism</span>
                    <StarRating
                      rating={existingRating.professionalism}
                      size="sm"
                      interactive={false}
                    />
                  </div>
                )}
                {existingRating.clinicalSkills && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clinical Skills</span>
                    <StarRating
                      rating={existingRating.clinicalSkills}
                      size="sm"
                      interactive={false}
                    />
                  </div>
                )}
                {existingRating.comment && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{existingRating.comment}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <p className="text-lg font-semibold">Rating Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Thank you for your feedback
              </p>
            </div>
          ) : (
            <>
              {/* Overall Rating */}
              <div className="space-y-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Rate your experience
                </p>
                <div className="flex justify-center">
                  <StarRating
                    rating={overallRating}
                    size="lg"
                    interactive
                    onRate={setOverallRating}
                    showNumeric={false}
                  />
                </div>
                {overallRating > 0 && (
                  <p className="text-2xl font-bold">{overallRating}.0</p>
                )}
              </div>

              <Separator />

              {/* Detailed Breakdown */}
              <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                  <span className="text-sm font-medium">
                    Add detailed breakdown
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      breakdownOpen && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reliability</span>
                    <StarRating
                      rating={reliabilityScore}
                      size="sm"
                      interactive
                      onRate={setReliabilityScore}
                      showNumeric={false}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Professionalism</span>
                    <StarRating
                      rating={professionalism}
                      size="sm"
                      interactive
                      onRate={setProfessionalism}
                      showNumeric={false}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clinical Skills</span>
                    <StarRating
                      rating={clinicalSkills}
                      size="sm"
                      interactive
                      onRate={setClinicalSkills}
                      showNumeric={false}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Comment */}
              <div className="space-y-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this staff member..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full h-12"
                onClick={handleSubmit}
                disabled={overallRating === 0 || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};