import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface HelpPageHeaderProps {
  title: string;
  subtitle: string;
}

export const HelpPageHeader = ({ title, subtitle }: HelpPageHeaderProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {subtitle}
          </p>
        </div>
      </div>
      <Separator />
    </div>
  );
};