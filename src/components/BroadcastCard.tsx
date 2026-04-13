import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type MessageInstance, truncateText, formatRelativeTime } from "@/utils/messageUtils";

interface BroadcastCardProps {
  message: MessageInstance;
  facilityName?: string;
  onClick?: (message: MessageInstance) => void;
}

export const BroadcastCard = ({ message, facilityName, onClick }: BroadcastCardProps) => {
  const isTeam = message.recipientType === "team";
  const preview = truncateText(message.messageBody);
  const timeAgo = formatRelativeTime(message.sentAt || message.createdAt);

  return (
    <Card
      className={cn(
        "cursor-pointer border transition-shadow hover:shadow-md",
        isTeam ? "border-l-4 border-l-primary" : "border-l-4 border-l-chart-2"
      )}
      onClick={() => onClick?.(message)}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", isTeam ? "bg-primary/10 text-primary" : "bg-chart-2/10 text-chart-2")}>
              {isTeam ? "All Staff" : facilityName || "Facility"}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {message.subject && (
            <p className="mb-0.5 font-semibold text-sm">{message.subject}</p>
          )}
          <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            From: {message.senderName || message.senderEmail}
          </p>
        </div>
      </div>
    </Card>
  );
};