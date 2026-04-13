import React from "react";
import { useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Trash2 } from "lucide-react";
import { getInitials } from "@/utils/fmUtils";

interface FMListRowProps {
  email?: string;
  name?: string;
  phone?: string;
  linkedFacilities?: string[];
  onResendInvite: () => void;
  onRemove: () => void;
  isResending: boolean;
}

export const FMListRow = ({
  email,
  name,
  phone,
  linkedFacilities,
  onResendInvite,
  onRemove,
  isResending,
}: FMListRowProps) => {
  const initials = getInitials(email, name);

  const handleResend = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onResendInvite();
    },
    [onResendInvite]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
    },
    [onRemove]
  );

  return (
    <div className="flex items-center gap-3 py-3 px-2">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{email}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {name && (
            <span className="text-xs text-muted-foreground">{name}</span>
          )}
          {name && phone && (
            <span className="text-xs text-muted-foreground">·</span>
          )}
          {phone && (
            <span className="text-xs text-muted-foreground">{phone}</span>
          )}
        </div>
        {linkedFacilities && linkedFacilities.length > 1 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Also manages: {linkedFacilities.slice(0, 3).join(", ")}
            {linkedFacilities.length > 3 &&
              ` +${linkedFacilities.length - 3} more`}
          </p>
        )}
      </div>

      <Badge className="bg-accent/20 text-accent shrink-0">Active</Badge>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={isResending}
          className="h-8 w-8 p-0"
        >
          <Mail className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};