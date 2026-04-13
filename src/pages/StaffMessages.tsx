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
import { Plus, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  MessagesEntity,
  FacilityManagerProfilesEntity,
  StaffProfilesEntity,
  ShiftsEntity,
  FacilitiesEntity,
  ShiftApplicationsEntity,
  OrientationsEntity,
} from "@/product-types";
import { ConversationCard } from "@/components/ConversationCard";
import { ChatThread } from "@/components/ChatThread";
import { ComposeMessageSheet } from "@/components/ComposeMessageSheet";
import type { RecipientOption } from "@/components/ComposeMessageSheet";
import { EmptyMessagesState } from "@/components/EmptyMessagesState";
import { MessagesLoadingSkeleton } from "@/components/MessagesLoadingSkeleton";
import {
  type ConversationGroup,
  type MessageInstance,
  groupMessagesByConversation,
  getThreadMessages,
} from "@/utils/messageUtils";

export default function StaffMessages() {
  const user = useUser();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationGroup | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");

  // Fetch messages
  const { data: allMessages, isLoading: messagesLoading } =
    useEntityGetAll(MessagesEntity);
  const { data: fmProfiles } = useEntityGetAll(FacilityManagerProfilesEntity);
  const { data: staffProfiles } = useEntityGetAll(StaffProfilesEntity, {
    email: user.email,
  });
  const { data: shifts } = useEntityGetAll(ShiftsEntity);
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);
  const { createFunction, isLoading: isSending } =
    useEntityCreate(MessagesEntity);
  const { updateFunction } = useEntityUpdate(MessagesEntity);
  const { updateFunction: updateProfile } =
    useEntityUpdate(StaffProfilesEntity);

  const myProfile = staffProfiles?.[0];

  const { data: shiftApplications } = useEntityGetAll(ShiftApplicationsEntity, {
    staffProfileId: myProfile?.id,
  });
  const { data: orientations } = useEntityGetAll(OrientationsEntity, {
    staffProfileId: myProfile?.id,
  });

  // Update lastViewedMessagesDate when page loads
  useEffect(() => {
    if (myProfile?.id) {
      updateProfile({
        id: myProfile.id,
        data: { lastViewedMessagesDate: new Date().toISOString() },
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.id]);

  // Reset search when tab changes
  useEffect(() => {
    setConversationSearch("");
  }, [activeTab]);

  // Cast messages for utility functions
  const messages = useMemo(
    () => (allMessages as unknown as MessageInstance[]) || [],
    [allMessages]
  );

  // My messages (direct) - where I'm sender or recipient
  const myDirectMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.recipientType === "direct" &&
          (m.senderEmail === user.email || m.recipientEmail === user.email)
      ),
    [messages, user.email]
  );

  // Shift chat messages
  const myShiftMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.shiftId &&
          (m.senderEmail === user.email ||
            m.recipientEmail === user.email ||
            m.recipientType === "shift")
      ),
    [messages, user.email]
  );

  // Group conversations
  const allConversations = useMemo(
    () => groupMessagesByConversation(myDirectMessages, user.email),
    [myDirectMessages, user.email]
  );

  const directConversations = useMemo(
    () =>
      allConversations.filter((c) =>
        myDirectMessages.some(
          (m) =>
            m.recipientType === "direct" &&
            (m.senderEmail === c.partnerEmail ||
              m.recipientEmail === c.partnerEmail)
        )
      ),
    [allConversations, myDirectMessages]
  );

  // Shift threads grouped by shiftId
  const shiftThreads = useMemo(() => {
    const grouped = new Map<string, MessageInstance[]>();
    for (const msg of myShiftMessages) {
      if (!msg.shiftId) continue;
      const existing = grouped.get(msg.shiftId) || [];
      existing.push(msg);
      grouped.set(msg.shiftId, existing);
    }
    return grouped;
  }, [myShiftMessages]);

  // Thread messages for selected conversation
  const threadMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return getThreadMessages(
      messages,
      selectedConversation.rootMessageId,
      selectedConversation.partnerEmail,
      user.email
    );
  }, [selectedConversation, messages, user.email]);

  // Available recipients for compose
  const recipientOptions = useMemo((): RecipientOption[] => {
    const options: RecipientOption[] = [
      { email: "admin@aljocarecrew.com", name: "ALJO Admin", role: "admin" },
    ];

    // Build set of relevant facility IDs
    const relevantFacilityIds = new Set<string>();

    // 1. Facilities from approved shift applications
    if (shiftApplications && shifts) {
      for (const app of shiftApplications) {
        const appData = app as any;
        if (appData.status === "approved" && appData.shiftProfileId) {
          const shift = shifts.find((s: any) => s.id === appData.shiftProfileId);
          if (shift && (shift as any).facilityProfileId) {
            relevantFacilityIds.add((shift as any).facilityProfileId);
          }
        }
      }
    }

    // 2. Facilities from completed orientations
    if (orientations) {
      for (const orientation of orientations) {
        const oriData = orientation as any;
        if (oriData.status === "completed" && oriData.facilityId) {
          relevantFacilityIds.add(oriData.facilityId);
        }
      }
    }

    // 3. Facilities from staff profile's orientedFacilityIds
    if (myProfile) {
      const profileData = myProfile as any;
      if (Array.isArray(profileData.orientedFacilityIds)) {
        for (const facId of profileData.orientedFacilityIds) {
          if (facId) relevantFacilityIds.add(facId);
        }
      }
    }

    // Filter FM profiles to only those linked to relevant facilities
    if (fmProfiles) {
      for (const fm of fmProfiles) {
        const fmData = fm as any;
        if (
          fmData.email &&
          fmData.email !== user.email &&
          fmData.facilityProfileId &&
          relevantFacilityIds.has(fmData.facilityProfileId)
        ) {
          const facility = facilities?.find(
            (f: any) => f.id === fmData.facilityProfileId
          );
          const facilityName = (facility as any)?.name;
          const fmName = fmData.title || fmData.email;
          options.push({
            email: fmData.email,
            name: facilityName ? `${fmName} - ${facilityName}` : fmName,
            role: "facility_manager",
          });
        }
      }
    }

    return options;
  }, [fmProfiles, facilities, user.email, shiftApplications, shifts, orientations, myProfile]);

  // Mark messages as read when opening a thread
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
            senderName: user.name || user.firstName || "Staff",
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
            senderName: user.name || user.firstName || "Staff",
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

  // If a conversation is selected, show the thread view
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
            Stay connected with your team
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
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="direct">Direct</TabsTrigger>
          <TabsTrigger value="shift">Shift Chat</TabsTrigger>
        </TabsList>

        {/* All Messages Tab */}
        <TabsContent value="all" className="space-y-3">
          {messagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : allConversations.length === 0 ? (
            <EmptyMessagesState
              title="No messages yet"
              description="Send a message to admin or a facility manager to get started."
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
              description="Start a conversation with admin or a facility manager."
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

        {/* Shift Chat Tab */}
        <TabsContent value="shift" className="space-y-3">
          {messagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : shiftThreads.size === 0 ? (
            <EmptyMessagesState
              title="No shift conversations"
              description="Messages about specific shifts will appear here."
            />
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Search shift chats..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                />
              </div>
              {(() => {
                const search = conversationSearch.toLowerCase();
                const entries = Array.from(shiftThreads.entries());
                const filtered = conversationSearch
                  ? entries.filter(([shiftId, msgs]) => {
                      const shift = shifts?.find((s: any) => s.id === shiftId);
                      const shiftData = shift as any;
                      const facility = facilities?.find(
                        (f: any) => f.id === shiftData?.facilityProfileId
                      );
                      const facilityName = (facility as any)?.name || "";
                      const shiftRole = shiftData?.requiredRole || "";
                      const shiftDate = shiftData?.startDateTime
                        ? format(new Date(shiftData.startDateTime), "MMM d, yyyy")
                        : "";
                      return (
                        facilityName.toLowerCase().includes(search) ||
                        shiftRole.toLowerCase().includes(search) ||
                        shiftDate.toLowerCase().includes(search)
                      );
                    })
                  : entries;

                if (filtered.length === 0) {
                  return (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No shift conversations match your search
                    </p>
                  );
                }

                return filtered.map(([shiftId, msgs]) => {
                  const shift = shifts?.find((s: any) => s.id === shiftId);
                  const shiftData = shift as any;
                  const facility = facilities?.find(
                    (f: any) => f.id === shiftData?.facilityProfileId
                  );
                  const lastMsg = msgs[msgs.length - 1];
                  const shiftDate = shiftData?.startDateTime
                    ? format(new Date(shiftData.startDateTime), "MMM d, yyyy")
                    : "Unknown date";
                  const shiftRole = shiftData?.requiredRole || "Shift";
                  const unreadCount = msgs.filter(
                    (m) => m.recipientEmail === user.email && !m.isRead
                  ).length;

                  return (
                    <div
                      key={shiftId}
                      className="cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md"
                      onClick={() => {
                        const partnerMsg = msgs.find(
                          (m) => m.senderEmail !== user.email
                        );
                        setSelectedConversation({
                          partnerId: shiftId,
                          partnerEmail: partnerMsg?.senderEmail || "",
                          partnerName: `${shiftRole} - ${(facility as any)?.name || "Facility"} (${shiftDate})`,
                          lastMessage: lastMsg,
                          unreadCount,
                          rootMessageId: msgs[0].id,
                        });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                        )}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {shiftRole} - {(facility as any)?.name || "Facility"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {shiftDate}
                          </p>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {lastMsg?.messageBody}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          )}
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
    </div>
  );
}