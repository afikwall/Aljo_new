import { useState, useCallback, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";

interface FacilityOption {
  id: string;
  name: string;
}

interface BroadcastComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broadcastType: "team" | "facility";
  facilities: FacilityOption[];
  onSend: (data: {
    recipientType: "team" | "facility";
    facilityId?: string;
    subject: string;
    messageBody: string;
  }) => Promise<void>;
  isSending?: boolean;
  preselectedFacilityId?: string;
}

export const BroadcastComposeSheet = ({
  open,
  onOpenChange,
  broadcastType,
  facilities,
  onSend,
  isSending = false,
  preselectedFacilityId,
}: BroadcastComposeSheetProps) => {
  const [selectedFacility, setSelectedFacility] = useState(preselectedFacilityId || "");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const facilityOptions = useMemo(
    () => facilities.map((f) => ({ value: f.id, label: f.name })),
    [facilities]
  );

  const handleSend = useCallback(async () => {
    if (!messageBody.trim()) return;
    if (broadcastType === "facility" && !selectedFacility) return;

    await onSend({
      recipientType: broadcastType,
      facilityId: broadcastType === "facility" ? selectedFacility : undefined,
      subject: subject.trim(),
      messageBody: messageBody.trim(),
    });

    // Reset form
    setSelectedFacility(preselectedFacilityId || "");
    setSubject("");
    setMessageBody("");
    onOpenChange(false);
  }, [broadcastType, selectedFacility, subject, messageBody, onSend, preselectedFacilityId, onOpenChange]);

  const isValid = useMemo(() => {
    if (broadcastType === "facility" && !selectedFacility) return false;
    return messageBody.trim().length > 0;
  }, [broadcastType, selectedFacility, messageBody]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>
            {broadcastType === "team" ? "Message All Staff" : "Message Facility Staff"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Facility selector (only for facility broadcast) */}
          {broadcastType === "facility" && (
            <div className="space-y-2">
              <Label>Facility</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a facility..." />
                </SelectTrigger>
                <SelectContent>
                  {facilityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Broadcast subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message Body */}
          <div className="flex-1 space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your broadcast message..."
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
                Send Broadcast
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};