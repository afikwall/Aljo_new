import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Search, X } from "lucide-react";

export interface RecipientOption {
  email: string;
  name: string;
  role?: string;
}

interface ComposeMessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: RecipientOption[];
  onSend: (data: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    messageBody: string;
  }) => Promise<void>;
  isSending?: boolean;
  defaultRecipient?: string;
  title?: string;
}

export const ComposeMessageSheet = ({
  open,
  onOpenChange,
  recipients,
  onSend,
  isSending = false,
  defaultRecipient,
  title = "New Message",
}: ComposeMessageSheetProps) => {
  const [selectedRecipient, setSelectedRecipient] = useState(defaultRecipient || "");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const recipientOptions = recipients.map((r) => ({
    value: r.email,
    label: `${r.name} (${r.email})`,
    name: r.name,
  }));

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setRecipientSearch("");
    }
    onOpenChange(isOpen);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !messageBody.trim()) return;

    const selectedOption = recipients.find((r) => r.email === selectedRecipient);
    const recipientName = selectedOption?.name || selectedRecipient;

    await onSend({
      recipientEmail: selectedRecipient,
      recipientName,
      subject: subject.trim(),
      messageBody: messageBody.trim(),
    });

    // Reset form
    setSelectedRecipient(defaultRecipient || "");
    setRecipientSearch("");
    setSubject("");
    setMessageBody("");
    onOpenChange(false);
  };

  const isValid = !!selectedRecipient && messageBody.trim().length > 0;

  const search = recipientSearch.toLowerCase();
  const filteredOptions = recipientOptions.filter(
    (opt) =>
      opt.name?.toLowerCase().includes(search) ||
      opt.value?.toLowerCase().includes(search)
  );

  const selectedOption = recipientOptions.find((opt) => opt.value === selectedRecipient);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Recipient */}
          <div className="space-y-2">
            <Label>To</Label>
            {selectedRecipient ? (
              <div className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm">
                <span>{selectedOption?.name || selectedRecipient}</span>
                <button
                  className="rounded p-0.5 hover:bg-accent"
                  onClick={() => {
                    setSelectedRecipient("");
                    setRecipientSearch("");
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9"
                    placeholder="Search by name or email..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded border">
                  {recipientOptions.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">No recipients available</p>
                  ) : filteredOptions.length === 0 && recipientSearch ? (
                    <p className="p-2 text-sm text-muted-foreground">No recipients found</p>
                  ) : (
                    filteredOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className="cursor-pointer p-2 hover:bg-accent"
                        onClick={() => {
                          setSelectedRecipient(opt.value);
                          setRecipientSearch("");
                        }}
                      >
                        <p className="text-sm font-medium">{opt.name}</p>
                        <p className="text-xs text-muted-foreground">{opt.value}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject (optional)</Label>
            <Input
              placeholder="Subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message Body */}
          <div className="flex-1 space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message..."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!isValid || isSending}
            className="h-12 w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};