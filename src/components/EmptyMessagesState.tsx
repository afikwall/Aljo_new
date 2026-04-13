import { MessageCircle } from "lucide-react";

interface EmptyMessagesStateProps {
  title?: string;
  description?: string;
}

export const EmptyMessagesState = ({
  title = "No messages yet",
  description = "Start a conversation to get things going!",
}: EmptyMessagesStateProps) => {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
      <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
};