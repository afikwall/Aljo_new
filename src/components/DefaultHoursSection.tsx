import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyAvailabilityGrid } from "@/components/WeeklyAvailabilityGrid";
import { useIsMobile } from "@/hooks/use-mobile";

interface DefaultHoursSectionProps {
  staffProfileId: string;
  staffEmail: string;
}

export const DefaultHoursSection = ({
  staffProfileId,
  staffEmail,
}: DefaultHoursSectionProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-0 h-auto hover:bg-transparent [&>*]:w-full"
          >
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <CardTitle className="text-base">
                      Default Weekly Hours
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Set your preferred working hours for each day of the week
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-0">
            <WeeklyAvailabilityGrid
              staffProfileId={staffProfileId}
              staffEmail={staffEmail}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};