import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns";

/** Base entity type from the SDK */
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Message instance type with base entity fields */
export type MessageInstance = BaseEntity & {
  sentAt?: string;
  subject?: string;
  parentMessageId?: string;
  shiftId?: string;
  senderEmail?: string;
  senderName?: string;
  recipientType?: "direct" | "team" | "facility" | "shift";
  messageBody?: string;
  isRead?: boolean;
  recipientEmail?: string;
  facilityId?: string;
};

/** Conversation grouping - one card per unique conversation partner */
export interface ConversationGroup {
  partnerId: string;
  partnerEmail: string;
  partnerName: string;
  lastMessage: MessageInstance;
  unreadCount: number;
  rootMessageId: string;
}

/** Broadcast message summary */
export interface BroadcastSummary {
  message: MessageInstance;
  type: "team" | "facility";
  facilityName?: string;
}

/**
 * Get initials from a name string
 */
export const getInitials = (name?: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Format a timestamp as relative time (e.g., "2h ago")
 */
export const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
};

/**
 * Format a date for date separators in chat threads
 */
export const formatDateSeparator = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  } catch {
    return "";
  }
};

/**
 * Format timestamp for chat bubble
 */
export const formatBubbleTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "h:mm a");
  } catch {
    return "";
  }
};

/**
 * Check if two dates are on different days (for date separators)
 */
export const isDifferentDay = (date1?: string, date2?: string): boolean => {
  if (!date1 || !date2) return true;
  try {
    return !isSameDay(new Date(date1), new Date(date2));
  } catch {
    return true;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text?: string, maxLength = 80): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "…";
};

/**
 * Group direct messages by conversation partner for a given user email.
 * Returns one entry per unique conversation partner, sorted by most recent message.
 */
export const groupMessagesByConversation = (
  messages: MessageInstance[],
  userEmail: string
): ConversationGroup[] => {
  const conversationMap = new Map<string, ConversationGroup>();

  // Filter to direct messages only
  const directMessages = messages.filter(
    (m) =>
      m.recipientType === "direct" &&
      (m.senderEmail === userEmail || m.recipientEmail === userEmail)
  );

  for (const msg of directMessages) {
    // The conversation partner is the other person
    const partnerEmail =
      msg.senderEmail === userEmail ? msg.recipientEmail : msg.senderEmail;
    if (!partnerEmail) continue;

    const existing = conversationMap.get(partnerEmail);

    // Determine root message id (the original message, not a reply)
    const rootId = msg.parentMessageId || msg.id;

    const sentAt = msg.sentAt || msg.createdAt;
    const existingSentAt = existing?.lastMessage.sentAt || existing?.lastMessage.createdAt;

    if (!existing || (sentAt && existingSentAt && new Date(sentAt) > new Date(existingSentAt))) {
      const partnerName =
        msg.senderEmail === userEmail
          ? msg.recipientEmail || "Unknown"
          : msg.senderName || partnerEmail;

      conversationMap.set(partnerEmail, {
        partnerId: partnerEmail,
        partnerEmail,
        partnerName: existing?.partnerName && existing.partnerName !== partnerEmail
          ? existing.partnerName
          : partnerName,
        lastMessage: msg,
        unreadCount: (existing?.unreadCount || 0) +
          (msg.recipientEmail === userEmail && !msg.isRead ? 1 : 0) -
          (existing && msg.recipientEmail === userEmail && !msg.isRead ? 0 : 0),
        rootMessageId: rootId,
      });
    } else if (existing) {
      // Update unread count
      if (msg.recipientEmail === userEmail && !msg.isRead) {
        existing.unreadCount += 1;
      }
    }
  }

  // Recalculate unread counts properly
  for (const [partnerEmail, group] of conversationMap) {
    group.unreadCount = directMessages.filter(
      (m) =>
        m.recipientEmail === userEmail &&
        !m.isRead &&
        m.senderEmail === partnerEmail
    ).length;
  }

  // Sort by most recent message
  return Array.from(conversationMap.values()).sort((a, b) => {
    const aTime = a.lastMessage.sentAt || a.lastMessage.createdAt;
    const bTime = b.lastMessage.sentAt || b.lastMessage.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};

/**
 * Get all messages in a thread (root + replies)
 */
export const getThreadMessages = (
  allMessages: MessageInstance[],
  rootMessageId: string,
  partnerEmail: string,
  userEmail: string
): MessageInstance[] => {
  // Get the root message
  const rootMessage = allMessages.find((m) => m.id === rootMessageId);

  // Get all replies to this root
  const replies = allMessages.filter(
    (m) => m.parentMessageId === rootMessageId
  );

  // Also include any direct messages between the two users that are either
  // the root, a reply, or stand-alone direct messages between them
  const conversationMessages = allMessages.filter(
    (m) =>
      m.recipientType === "direct" &&
      ((m.senderEmail === userEmail && m.recipientEmail === partnerEmail) ||
        (m.senderEmail === partnerEmail && m.recipientEmail === userEmail))
  );

  // Combine and deduplicate
  const messageMap = new Map<string, MessageInstance>();
  if (rootMessage) messageMap.set(rootMessage.id, rootMessage);
  for (const r of replies) {
    messageMap.set(r.id, r);
  }
  for (const m of conversationMessages) {
    messageMap.set(m.id, m);
  }

  // Sort by sentAt ascending (chronological)
  return Array.from(messageMap.values()).sort((a, b) => {
    const aTime = a.sentAt || a.createdAt;
    const bTime = b.sentAt || b.createdAt;
    return new Date(aTime).getTime() - new Date(bTime).getTime();
  });
};

/**
 * Group shift-related messages by shiftId
 */
export const groupMessagesByShift = (
  messages: MessageInstance[],
  userEmail: string
): Map<string, MessageInstance[]> => {
  const shiftMap = new Map<string, MessageInstance[]>();

  const shiftMessages = messages.filter(
    (m) =>
      m.shiftId &&
      (m.senderEmail === userEmail ||
        m.recipientEmail === userEmail ||
        m.recipientType === "shift")
  );

  for (const msg of shiftMessages) {
    const shiftId = msg.shiftId!;
    const existing = shiftMap.get(shiftId) || [];
    existing.push(msg);
    shiftMap.set(shiftId, existing);
  }

  // Sort each group by sentAt
  for (const [, msgs] of shiftMap) {
    msgs.sort((a, b) => {
      const aTime = a.sentAt || a.createdAt;
      const bTime = b.sentAt || b.createdAt;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
  }

  return shiftMap;
};

/**
 * Count unread direct messages for a user
 */
export const countUnreadDirect = (
  messages: MessageInstance[],
  userEmail: string
): number => {
  return messages.filter(
    (m) =>
      m.recipientType === "direct" &&
      m.recipientEmail === userEmail &&
      !m.isRead
  ).length;
};

/**
 * Count unread broadcast messages since a given date
 */
export const countUnreadBroadcasts = (
  messages: MessageInstance[],
  lastViewedDate?: string,
  facilityId?: string
): number => {
  if (!lastViewedDate) {
    // If never viewed, all broadcasts are unread
    return messages.filter(
      (m) =>
        m.recipientType === "team" ||
        (m.recipientType === "facility" && (!facilityId || m.facilityId === facilityId))
    ).length;
  }

  const viewedDate = new Date(lastViewedDate);
  return messages.filter((m) => {
    const sentAt = m.sentAt ? new Date(m.sentAt) : new Date(m.createdAt);
    if (m.recipientType === "team") return sentAt > viewedDate;
    if (m.recipientType === "facility" && (!facilityId || m.facilityId === facilityId)) {
      return sentAt > viewedDate;
    }
    return false;
  }).length;
};

/**
 * Format unread count for badge display (cap at 99+)
 */
export const formatUnreadCount = (count: number): string => {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return count.toString();
};