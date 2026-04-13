import React from "react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type MessageInstance,
  getInitials,
  formatBubbleTime,
  formatDateSeparator,
  isDifferentDay,
} from "@/utils/messageUtils";

interface ChatThreadProps {
  partnerName: string;
  partnerEmail: string;
  messages: MessageInstance[];
  currentUserEmail: string;
  onBack: () => void;
  onSend: (messageBody: string) => Promise<void>;
  isSending?: boolean;
  partnerRole?: string;
}

export const ChatThread = ({
  partnerName,
  partnerEmail,
  messages,
  currentUserEmail,
  onBack,
  onSend,
  isSending = false,
  partnerRole,
}: ChatThreadProps) => {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    setNewMessage("");
    await onSend(trimmed);
  }, [newMessage, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const aTime = a.sentAt || a.createdAt;
        const bTime = b.sentAt || b.createdAt;
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      }),
    [messages]
  );

  const partnerInitials = getInitials(partnerName);

  return (
    <div className="flex h-full flex-col">
      {/* Thread Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-semibold text-primary">{partnerInitials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{partnerName}</p>
            <p className="truncate text-xs text-muted-foreground">{partnerEmail}</p>
          </div>
        </div>
        {partnerRole && (
          <Badge variant="secondary" className="shrink-0">
            {partnerRole === "admin"
              ? "Admin"
              : partnerRole === "facility_manager"
              ? "FM"
              : partnerRole}
          </Badge>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {sortedMessages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        {sortedMessages.map((msg, index) => {
          const isSent = msg.senderEmail === currentUserEmail;
          const prevMsg = index > 0 ? sortedMessages[index - 1] : null;
          const showDateSeparator = isDifferentDay(
            prevMsg?.sentAt || prevMsg?.createdAt,
            msg.sentAt || msg.createdAt
          );
          const senderName = isSent ? "You" : msg.senderName || partnerName;

          return (
            <div key={msg.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {formatDateSeparator(msg.sentAt || msg.createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={cn("flex", isSent ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[80%]">
                  <p className={cn("mb-1 text-xs text-muted-foreground", isSent && "text-right")}>
                    {senderName}
                  </p>
                  <div
                    className={cn(
                      "px-4 py-2.5",
                      isSent
                        ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-2xl rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.messageBody}</p>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-xs text-muted-foreground",
                      isSent && "text-right"
                    )}
                  >
                    {formatBubbleTime(msg.sentAt || msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="h-10 w-10 shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};