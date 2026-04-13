import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceProgressCardProps {
  approvedCount: number;
  totalRequired: number;
}

export const ComplianceProgressCard = ({
  approvedCount,
  totalRequired,
}: ComplianceProgressCardProps) => {
  const progressPercent =
    totalRequired > 0 ? Math.round((approvedCount / totalRequired) * 100) : 0;
  const allApproved = approvedCount === totalRequired;
  const noneApproved = approvedCount === 0;

  const progressColorClass = allApproved
    ? "text-accent"
    : noneApproved
      ? "text-destructive"
      : "text-chart-3";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Compliance Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Required Documents</span>
            <span className={cn("font-medium", progressColorClass)}>
              {approvedCount} of {totalRequired} approved
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {allApproved ? (
          <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 p-3">
            <CheckCircle className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm font-medium text-accent">
              You&apos;re fully compliant and ready to claim shifts!
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Complete the required documents below to start claiming shifts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};