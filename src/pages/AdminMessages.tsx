import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useUser,
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Megaphone, Building2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  MessagesEntity,
  StaffProfilesEntity,
  FacilityManagerProfilesEntity,
  FacilitiesEntity,
} from "@/product-types";
import { ConversationCard } from "@/components/ConversationCard";
import { ChatThread } from "@/components/ChatThread";
import { ComposeMessageSheet } from "@/components/ComposeMessageSheet";
import type { RecipientOption } from "@/components/ComposeMessageSheet";
import { BroadcastComposeSheet } from "@/components/BroadcastComposeSheet";
import { BroadcastCard } from "@/components/BroadcastCard";
import { EmptyMessagesState } from "@/components/EmptyMessagesState";
import { MessagesLoadingSkeleton } from "@/components/MessagesLoadingSkeleton";
import {
  type ConversationGroup,
  type MessageInstance,
  groupMessagesByConversation,
  getThreadMessages,
} from "@/utils/messageUtils";

export default function AdminMessages() {
  const user = useUser();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationGroup | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [broadcastType, setBroadcastType] = useState<"team" | "facility">(
    "team"
  );
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");

  // Reset search when tab changes
  useEffect(() => {
    setConversationSearch("");
  }, [activeTab]);

  // Fetch all data
  const { data: allMessages, isLoading: messagesLoading } =
    useEntityGetAll(MessagesEntity);
  const { data: staffProfiles } = useEntityGetAll(StaffProfilesEntity);
  const { data: fmProfiles } = useEntityGetAll(FacilityManagerProfilesEntity);
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);
  const { createFunction, isLoading: isSending } =
    useEntityCreate(MessagesEntity);
  const { updateFunction } = useEntityUpdate(MessagesEntity);

  // Cast messages
  const messages = useMemo(
    () => (allMessages as unknown as MessageInstance[]) || [],
    [allMessages]
  );

  // All direct messages in the system
  const directMessages = useMemo(
    () => messages.filter((m) => m.recipientType === "direct"),
    [messages]
  );

  // Admin's own direct conversations
  const myConversations = useMemo(
    () =>
      groupMessagesByConversation(
        directMessages.filter(
          (m) => m.senderEmail === user.email || m.recipientEmail === user.email
        ),
        user.email
      ),
    [directMessages, user.email]
  );

  // All conversations (admin sees everything) grouped by unique pairs
  const allConversations = useMemo(() => {
    const pairMap = new Map<string, MessageInstance[]>();
    for (const msg of directMessages) {
      const pair = [msg.senderEmail, msg.recipientEmail].sort().join("|||");
      const existing = pairMap.get(pair) || [];
      existing.push(msg);
      pairMap.set(pair, existing);
    }

    const conversations: ConversationGroup[] = [];
    for (const [, msgs] of pairMap) {
      const sorted = [...msgs].sort(
        (a, b) =>
          new Date(b.sentAt || b.createdAt).getTime() -
          new Date(a.sentAt || a.createdAt).getTime()
      );
      const lastMsg = sorted[0];
      const partnerEmail =
        lastMsg.senderEmail === user.email
          ? lastMsg.recipientEmail || ""
          : lastMsg.senderEmail || "";

      // Try to find a better name from staff or FM profiles
      const staffProfile = staffProfiles?.find(
        (s: any) => (s as any).email === partnerEmail
      );
      const fmProfile = fmProfiles?.find(
        (f: any) => (f as any).email === partnerEmail
      );
      const sp = staffProfile as any;
      const fp = fmProfile as any;
      const displayName = sp
        ? `${sp.firstName || ""} ${sp.lastName || ""}`.trim() || partnerEmail
        : fp?.title || lastMsg.senderName || partnerEmail;

      conversations.push({
        partnerId: partnerEmail,
        partnerEmail,
        partnerName: displayName,
        lastMessage: lastMsg,
        unreadCount: msgs.filter(
          (m) => m.recipientEmail === user.email && !m.isRead
        ).length,
        rootMessageId:
          sorted[sorted.length - 1].parentMessageId ||
          sorted[sorted.length - 1].id,
      });
    }

    return conversations.sort(
      (a, b) =>
        new Date(
          b.lastMessage.sentAt || b.lastMessage.createdAt
        ).getTime() -
        new Date(
          a.lastMessage.sentAt || a.lastMessage.createdAt
        ).getTime()
    );
  }, [directMessages, user.email, staffProfiles, fmProfiles]);

  // Broadcast messages
  const broadcastMessages = useMemo(
    () =>
      messages
        .filter(
          (m) => m.recipientType === "team" || m.recipientType === "facility"
        )
        .sort(
          (a, b) =>
            new Date(b.sentAt || b.createdAt).getTime() -
            new Date(a.sentAt || a.createdAt).getTime()
        ),
    [messages]
  );

  // Facility lookup helper
  const getFacilityName = useCallback(
    (facilityId?: string) => {
      if (!facilityId || !facilities) return undefined;
      const facility = facilities.find((f: any) => f.id === facilityId);
      return (facility as any)?.name;
    },
    [facilities]
  );

  // Thread messages
  const threadMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return getThreadMessages(
      messages,
      selectedConversation.rootMessageId,
      selectedConversation.partnerEmail,
      user.email
    );
  }, [selectedConversation, messages, user.email]);

  // Recipient options for compose
  const recipientOptions = useMemo((): RecipientOption[] => {
    const options: RecipientOption[] = [];
    if (staffProfiles) {
      for (const sp of staffProfiles) {
        const s = sp as any;
        if (s.email && s.email !== user.email) {
          options.push({
            email: s.email,
            name:
              `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email,
            role: "staff",
          });
        }
      }
    }
    if (fmProfiles) {
      for (const fm of fmProfiles) {
        const f = fm as any;
        if (f.email && f.email !== user.email) {
          const facility = facilities?.find(
            (fac: any) => fac.id === f.facilityProfileId
          );
          options.push({
            email: f.email,
            name: f.title
              ? `${f.title}${facility ? ` - ${(facility as any).name}` : ""}`
              : f.email,
            role: "facility_manager",
          });
        }
      }
    }
    return options;
  }, [staffProfiles, fmProfiles, facilities, user.email]);

  // Facility options for broadcast
  const facilityOptions = useMemo(() => {
    if (!facilities) return [];
    return facilities
      .filter((f: any) => (f as any).status === "active")
      .map((f: any) => ({
        id: f.id,
        name: (f as any).name || "Unnamed Facility",
      }));
  }, [facilities]);

  // Mark thread as read
  const markThreadAsRead = useCallback(
    async (partnerEmail: string) => {
      const unreadMessages = messages.filter(
        (m) =>
          m.recipientEmail === user.email &&
          m.senderEmail === partnerEmail &&
          !m.isRead
      );
      for (const msg of unreadMessages) {
        try {
          await updateFunction({ id: msg.id, data: { isRead: true } });
        } catch {
          // silently fail
        }
      }
    },
    [messages, user.email, updateFunction]
  );

  const handleOpenConversation = useCallback(
    (conversation: ConversationGroup) => {
      setSelectedConversation(conversation);
      markThreadAsRead(conversation.partnerEmail);
    },
    [markThreadAsRead]
  );

  const handleSendReply = useCallback(
    async (messageBody: string) => {
      if (!selectedConversation) return;
      try {
        await createFunction({
          data: {
            senderEmail: user.email,
            senderName: user.name || "Admin",
            recipientEmail: selectedConversation.partnerEmail,
            recipientType: "direct",
            messageBody,
            sentAt: new Date().toISOString(),
            isRead: false,
            parentMessageId: selectedConversation.rootMessageId,
          },
        });
        toast.success("Message sent");
      } catch {
        toast.error("Failed to send message");
      }
    },
    [selectedConversation, createFunction, user]
  );

  const handleCompose = useCallback(
    async (data: {
      recipientEmail: string;
      recipientName: string;
      subject: string;
      messageBody: string;
    }) => {
      try {
        await createFunction({
          data: {
            senderEmail: user.email,
            senderName: user.name || "Admin",
            recipientEmail: data.recipientEmail,
            recipientType: "direct",
            subject: data.subject || undefined,
            messageBody: data.messageBody,
            sentAt: new Date().toISOString(),
            isRead: false,
          },
        });
        toast.success("Message sent!");
      } catch {
        toast.error("Failed to send message");
      }
    },
    [createFunction, user]
  );

  const handleBroadcast = useCallback(
    async (data: {
      recipientType: "team" | "facility";
      facilityId?: string;
      subject: string;
      messageBody: string;
    }) => {
      try {
        await createFunction({
          data: {
            senderEmail: user.email,
            senderName: user.name || "Admin",
            recipientType: data.recipientType,
            facilityId: data.facilityId || undefined,
            subject: data.subject || undefined,
            messageBody: data.messageBody,
            sentAt: new Date().toISOString(),
            isRead: false,
          },
        });
        toast.success("Broadcast sent!");
      } catch {
        toast.error("Failed to send broadcast");
      }
    },
    [createFunction, user]
  );

  const openTeamBroadcast = useCallback(() => {
    setBroadcastType("team");
    setBroadcastOpen(true);
  }, []);

  const openFacilityBroadcast = useCallback(() => {
    setBroadcastType("facility");
    setBroadcastOpen(true);
  }, []);

  // Thread view
  if (selectedConversation) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-6rem)]">
        <ChatThread
          partnerName={selectedConversation.partnerName}
          partnerEmail={selectedConversation.partnerEmail}
          messages={threadMessages}
          currentUserEmail={user.email}
          onBack={() => setSelectedConversation(null)}
          onSend={handleSendReply}
          isSending={isSending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Manage all communications
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="direct">Direct</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
        </TabsList>

        {/* All Messages Tab */}
        <TabsContent value="all" className="space-y-3">
          {messagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : allConversations.length === 0 ? (
            <EmptyMessagesState
              title="No messages yet"
              description="Send a message to staff or facility managers."
            />
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                />
              </div>
              {(() => {
                const search = conversationSearch.toLowerCase();
                const filtered = conversationSearch
                  ? allConversations.filter(
                      (conv) =>
                        conv.partnerName?.toLowerCase().includes(search) ||
                        conv.partnerEmail?.toLowerCase().includes(search)
                    )
                  : allConversations;
                if (filtered.length === 0) {
                  return (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No conversations match your search
                    </p>
                  );
                }
                return filtered.map((conv) => (
                  <ConversationCard
                    key={conv.partnerEmail}
                    conversation={conv}
                    onClick={handleOpenConversation}
                  />
                ));
              })()}
            </>
          )}
        </TabsContent>

        {/* Direct Tab */}
        <TabsContent value="direct" className="space-y-3">
          {messagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : myConversations.length === 0 ? (
            <EmptyMessagesState
              title="No direct messages"
              description="Start a conversation with a staff member or facility manager."
            />
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                />
              </div>
              {(() => {
                const search = conversationSearch.toLowerCase();
                const filtered = conversationSearch
                  ? myConversations.filter(
                      (conv) =>
                        conv.partnerName?.toLowerCase().includes(search) ||
                        conv.partnerEmail?.toLowerCase().includes(search)
                    )
                  : myConversations;
                if (filtered.length === 0) {
                  return (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No conversations match your search
                    </p>
                  );
                }
                return filtered.map((conv) => (
                  <ConversationCard
                    key={conv.partnerEmail}
                    conversation={conv}
                    onClick={handleOpenConversation}
                  />
                ));
              })()}
            </>
          )}
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts" className="space-y-4">
          {/* Broadcast Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={openTeamBroadcast} variant="outline">
              <Megaphone className="mr-2 h-4 w-4" />
              Message All Staff
            </Button>
            <Button onClick={openFacilityBroadcast} variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Message Facility Staff
            </Button>
          </div>

          {/* Broadcast History */}
          <div className="space-y-3">
            {messagesLoading ? (
              <MessagesLoadingSkeleton />
            ) : broadcastMessages.length === 0 ? (
              <EmptyMessagesState
                title="No broadcasts yet"
                description="Send a broadcast message to all staff or a specific facility."
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9"
                    placeholder="Search broadcasts..."
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                  />
                </div>
                {(() => {
                  const search = conversationSearch.toLowerCase();
                  const filtered = conversationSearch
                    ? broadcastMessages.filter(
                        (msg) =>
                          msg.subject?.toLowerCase().includes(search) ||
                          msg.messageBody?.toLowerCase().includes(search) ||
                          msg.senderName?.toLowerCase().includes(search)
                      )
                    : broadcastMessages;
                  if (filtered.length === 0) {
                    return (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No broadcasts match your search
                      </p>
                    );
                  }
                  return filtered.map((msg) => (
                    <BroadcastCard
                      key={msg.id}
                      message={msg}
                      facilityName={getFacilityName(msg.facilityId)}
                    />
                  ));
                })()}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Compose Sheet */}
      <ComposeMessageSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        recipients={recipientOptions}
        onSend={handleCompose}
        isSending={isSending}
      />

      {/* Broadcast Sheet */}
      <BroadcastComposeSheet
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        broadcastType={broadcastType}
        facilities={facilityOptions}
        onSend={handleBroadcast}
        isSending={isSending}
      />
    </div>
  );
}