import React from "react";
import { Info } from "lucide-react";

interface HelpInfoBoxProps {
  children: React.ReactNode;
}

export const HelpInfoBox = ({ children }: HelpInfoBoxProps) => {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
};