import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { StaffMyShiftsPage } from "@/product-types";
import { formatElapsedTime, getElapsedHours } from "@/utils/clockInOutUtils";
import { calculateBreak } from "@/utils/shiftUtils";

interface CurrentlyWorkingCardProps {
  facilityName: string;
  clockInTime: string;
  currentTime: Date;
}

export const CurrentlyWorkingCard = ({
  facilityName,
  clockInTime,
  currentTime,
}: CurrentlyWorkingCardProps) => {
  const elapsed = formatElapsedTime(clockInTime, currentTime);
  const elapsedHours = getElapsedHours(clockInTime, currentTime);
  const breakMinutes = calculateBreak(elapsedHours);

  return (
    <Card className="border-l-4 border-l-accent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 rounded-full bg-accent animate-pulse" />
          <Badge className="bg-accent/20 text-accent">Currently Working</Badge>
        </div>

        <p className="font-bold text-lg">{facilityName}</p>

        <p className="font-mono text-3xl font-bold text-accent">{elapsed}</p>

        <p className="text-xs text-muted-foreground">
          {breakMinutes > 0
            ? `${breakMinutes}-min break will be auto-deducted`
            : "No break deduction for shifts under 4 hours"}
        </p>

        <Button variant="outline" className="w-full h-12" asChild>
          <Link to={getPageUrl(StaffMyShiftsPage)}>Go to My Shifts</Link>
        </Button>
      </CardContent>
    </Card>
  );
};