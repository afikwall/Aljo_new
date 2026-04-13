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
import { Plus, Megaphone, Search } from "lucide-react";
import { toast } from "sonner";
import {
  MessagesEntity,
  StaffProfilesEntity,
  FacilityManagerProfilesEntity,
  FacilitiesEntity,
  ShiftsEntity,
  ShiftApplicationsEntity,
  OrientationsEntity,
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

export default function FMMessages() {
  const user = useUser();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationGroup | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");

  // Fetch data
  const { data: allMessages, isLoading: messagesLoading } =
    useEntityGetAll(MessagesEntity);
  const { data: staffProfiles } = useEntityGetAll(StaffProfilesEntity);
  const { data: fmProfiles } = useEntityGetAll(FacilityManagerProfilesEntity, {
    email: user.email,
  });
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);
  const { data: allShifts } = useEntityGetAll(ShiftsEntity);
  const { data: allShiftApplications } = useEntityGetAll(ShiftApplicationsEntity);
  const { data: allOrientations } = useEntityGetAll(OrientationsEntity);
  const { createFunction, isLoading: isSending } =
    useEntityCreate(MessagesEntity);
  const { updateFunction } = useEntityUpdate(MessagesEntity);
  const { updateFunction: updateFmProfile } = useEntityUpdate(
    FacilityManagerProfilesEntity
  );

  const myFmProfile = fmProfiles?.[0];
  const myFacilityId = (myFmProfile as any)?.facilityProfileId;

  // Update lastViewedMessagesDate when page loads
  useEffect(() => {
    if (myFmProfile?.id) {
      updateFmProfile({
        id: myFmProfile.id,
        data: { lastViewedMessagesDate: new Date().toISOString() },
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myFmProfile?.id]);

  // Reset search when tab changes
  useEffect(() => {
    setConversationSearch("");
  }, [activeTab]);

  // Cast messages
  const messages = useMemo(
    () => (allMessages as unknown as MessageInstance[]) || [],
    [allMessages]
  );

  // FM sees: direct to/from them + facility broadcasts for their facility
  const myMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.senderEmail === user.email ||
          m.recipientEmail === user.email ||
          (m.recipientType === "facility" && m.facilityId === myFacilityId)
      ),
    [messages, user.email, myFacilityId]
  );

  // Direct messages
  const directMessages = useMemo(
    () =>
      myMessages.filter(
        (m) =>
          m.recipientType === "direct" &&
          (m.senderEmail === user.email || m.recipientEmail === user.email)
      ),
    [myMessages, user.email]
  );

  // Group direct conversations
  const directConversations = useMemo(
    () => groupMessagesByConversation(directMessages, user.email),
    [directMessages, user.email]
  );

  // All conversations = direct conversations
  const allConversations = useMemo(
    () => directConversations,
    [directConversations]
  );

  // Broadcast messages (team broadcasts + facility broadcasts for my facility + my sent broadcasts)
  const broadcastMessages = useMemo(
    () =>
      messages
        .filter(
          (m) =>
            m.recipientType === "team" ||
            (m.recipientType === "facility" &&
              m.facilityId === myFacilityId) ||
            (m.senderEmail === user.email &&
              (m.recipientType === "facility" || m.recipientType === "team"))
        )
        .sort(
          (a, b) =>
            new Date(b.sentAt || b.createdAt).getTime() -
            new Date(a.sentAt || a.createdAt).getTime()
        ),
    [messages, user.email, myFacilityId]
  );

  // My sent broadcasts only
  const mySentBroadcasts = useMemo(
    () => broadcastMessages.filter((m) => m.senderEmail === user.email),
    [broadcastMessages, user.email]
  );

  // Facility lookup
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

  // Recipient options - all eligible staff for this facility + admin
  const recipientOptions = useMemo((): RecipientOption[] => {
    const options: RecipientOption[] = [
      { email: "admin@aljocarecrew.com", name: "ALJO Admin", role: "admin" },
    ];

    if (!staffProfiles) return options;

    // Build a set of eligible staff profile IDs
    const eligibleProfileIds = new Set<string>();

    // 1. Staff with orientedFacilityIds containing myFacilityId
    if (myFacilityId) {
      for (const sp of staffProfiles) {
        const s = sp as any;
        if (s.orientedFacilityIds && s.orientedFacilityIds.includes(myFacilityId)) {
          eligibleProfileIds.add(s.id);
        }
      }
    }

    // 2. Staff assigned to upcoming shifts at the facility
    if (myFacilityId && allShifts && allShiftApplications) {
      const now = new Date();
      const upcomingStatuses = new Set(["open", "claimed", "assigned", "in_progress"]);

      // Build set of upcoming shift IDs at this facility
      const upcomingShiftIds = new Set<string>();
      for (const shift of allShifts) {
        const s = shift as any;
        if (
          s.facilityProfileId === myFacilityId &&
          upcomingStatuses.has(s.status) &&
          s.startDateTime &&
          new Date(s.startDateTime) > now
        ) {
          upcomingShiftIds.add(s.id);
        }
      }

      // Find approved applications for those shifts
      for (const app of allShiftApplications) {
        const a = app as any;
        if (a.status === "approved" && upcomingShiftIds.has(a.shiftProfileId) && a.staffProfileId) {
          eligibleProfileIds.add(a.staffProfileId);
        }
      }
    }

    // 3. Staff who completed orientation at the facility
    if (myFacilityId && allOrientations) {
      for (const orientation of allOrientations) {
        const o = orientation as any;
        if (
          o.facilityId === myFacilityId &&
          o.status === "completed" &&
          o.staffProfileId
        ) {
          eligibleProfileIds.add(o.staffProfileId);
        }
      }
    }

    // 4. Staff who worked past shifts at the facility (completed applications)
    if (myFacilityId && allShifts && allShiftApplications) {
      const now = new Date();

      // Build set of past completed shift IDs at this facility
      const pastShiftIds = new Set<string>();
      for (const shift of allShifts) {
        const s = shift as any;
        if (
          s.facilityProfileId === myFacilityId &&
          s.startDateTime &&
          new Date(s.startDateTime) <= now
        ) {
          pastShiftIds.add(s.id);
        }
      }

      // Find approved applications for those past shifts
      for (const app of allShiftApplications) {
        const a = app as any;
        if (a.status === "approved" && pastShiftIds.has(a.shiftProfileId) && a.staffProfileId) {
          eligibleProfileIds.add(a.staffProfileId);
        }
      }
    }

    // Map eligible profile IDs to email-deduped recipient options
    const seenEmails = new Set<string>(["admin@aljocarecrew.com"]);
    for (const sp of staffProfiles) {
      const s = sp as any;
      if (
        s.id &&
        eligibleProfileIds.has(s.id) &&
        s.email &&
        s.email !== user.email &&
        !seenEmails.has(s.email)
      ) {
        seenEmails.add(s.email);
        options.push({
          email: s.email,
          name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email,
          role: "staff",
        });
      }
    }

    return options;
  }, [staffProfiles, user.email, myFacilityId, allShifts, allShiftApplications, allOrientations]);

  // Facility option for broadcast (FM's own facility)
  const facilityOptions = useMemo(() => {
    if (!myFacilityId || !facilities) return [];
    const myFacility = facilities.find((f: any) => f.id === myFacilityId);
    if (!myFacility) return [];
    return [
      {
        id: myFacilityId,
        name: (myFacility as any).name || "My Facility",
      },
    ];
  }, [myFacilityId, facilities]);

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
            senderName: user.name || "Facility Manager",
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
            senderName: user.name || "Facility Manager",
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
            senderName: user.name || "Facility Manager",
            recipientType: "facility",
            facilityId: myFacilityId,
            subject: data.subject || undefined,
            messageBody: data.messageBody,
            sentAt: new Date().toISOString(),
            isRead: false,
          },
        });
        toast.success("Broadcast sent to facility staff!");
      } catch {
        toast.error("Failed to send broadcast");
      }
    },
    [createFunction, user, myFacilityId]
  );

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
            Communicate with your team
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
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
        </TabsList>

        {/* All Messages */}
        <TabsContent value="all" className="space-y-3">
          {messagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : allConversations.length === 0 ? (
            <EmptyMessagesState
              title="No messages yet"
              description="Send a message to staff or admin to get started."
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
          ) : directConversations.length === 0 ? (
            <EmptyMessagesState
              title="No direct messages"
              description="Start a conversation with a staff member or admin."
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
                  ? directConversations.filter(
                      (conv) =>
                        conv.partnerName?.toLowerCase().includes(search) ||
                        conv.partnerEmail?.toLowerCase().includes(search)
                    )
                  : directConversations;
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

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="space-y-4">
          {/* Broadcast Action */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setBroadcastOpen(true)}
              variant="outline"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Message My Facility Staff
            </Button>
          </div>

          {/* Broadcast History */}
          <div className="space-y-3">
            {messagesLoading ? (
              <MessagesLoadingSkeleton />
            ) : mySentBroadcasts.length === 0 ? (
              <EmptyMessagesState
                title="No broadcasts yet"
                description="Send a broadcast message to your facility staff."
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
                    ? mySentBroadcasts.filter(
                        (msg) =>
                          msg.subject?.toLowerCase().includes(search) ||
                          msg.messageBody?.toLowerCase().includes(search)
                      )
                    : mySentBroadcasts;
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
        broadcastType="facility"
        facilities={facilityOptions}
        onSend={handleBroadcast}
        isSending={isSending}
        preselectedFacilityId={myFacilityId}
      />
    </div>
  );
}