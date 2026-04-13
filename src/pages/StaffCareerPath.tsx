import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate, useLocation } from "react-router";
import { StaffProfilesEntity, LoginPage } from "@/product-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { getPageUrl } from "@/lib/utils";
import { CareerAdvancementSection } from "@/components/CareerAdvancementSection";

export default function StaffCareerPathPage() {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  const { data: profiles, isLoading: loadingProfile } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email }
  );
  const profile = profiles?.[0];

  // Scroll to career advancement section if hash is present
  useEffect(() => {
    if (location.hash === "#career-advancement") {
      const element = document.getElementById("career-advancement");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash, profile]);

  if (!user.isAuthenticated) {
    return null;
  }

  if (loadingProfile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Career Path</h1>
          <p className="text-sm text-muted-foreground">
            Track your role advancement journey
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">No profile found</p>
              <p className="text-sm text-muted-foreground">
                Contact ALJO to get set up.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Career Path</h1>
        <p className="text-sm text-muted-foreground">
          Track your role advancement journey
        </p>
      </div>

      {/* Career Advancement Section with scroll target */}
      <div id="career-advancement">
        <CareerAdvancementSection profile={profile as typeof profile & { id: string }} />
      </div>
    </div>
  );
}