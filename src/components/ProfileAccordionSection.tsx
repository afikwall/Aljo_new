import React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAccordionSectionProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  fieldSummary: string;
  isComplete: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const ProfileAccordionSection = ({
  icon: Icon,
  iconColor,
  title,
  fieldSummary,
  isComplete,
  defaultOpen = false,
  children,
}: ProfileAccordionSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full min-h-[3.5rem] px-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
          <span className="font-semibold text-sm truncate">{title}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline truncate">
            {fieldSummary}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isComplete ? (
            <CheckCircle className="h-4 w-4 text-accent" />
          ) : (
            <AlertCircle className="h-4 w-4 text-chart-3" />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${height + 32}px` : "0px" }}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-2 space-y-4">
          {children}
        </div>
      </div>
    </Card>
  );
};