import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type ConversationGroup,
  getInitials,
  truncateText,
  formatRelativeTime,
} from "@/utils/messageUtils";

interface ConversationCardProps {
  conversation: ConversationGroup;
  onClick: (conversation: ConversationGroup) => void;
}

export const ConversationCard = ({ conversation, onClick }: ConversationCardProps) => {
  const isUnread = conversation.unreadCount > 0;
  const message = conversation.lastMessage;
  const initials = getInitials(conversation.partnerName);
  const preview = truncateText(message.messageBody);
  const timeAgo = formatRelativeTime(message.sentAt || message.createdAt);

  return (
    <Card
      className={cn(
        "cursor-pointer border transition-shadow hover:shadow-md",
        isUnread && "bg-primary/5"
      )}
      onClick={() => onClick(conversation)}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Unread indicator */}
        <div className="flex shrink-0 items-center">
          {isUnread && (
            <div className="mr-2 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-semibold text-primary">{initials}</span>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm", isUnread ? "font-bold" : "font-semibold")}>
            {conversation.partnerName}
          </p>
          {message.subject && (
            <p className="truncate text-xs text-muted-foreground">{message.subject}</p>
          )}
          <p className="line-clamp-1 text-sm text-muted-foreground">{preview}</p>
        </div>

        {/* Timestamp */}
        <div className="shrink-0 text-right">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
    </Card>
  );
};