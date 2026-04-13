import { BlocksApiService } from '@blocksdiy/blocks-client-api';
import { AgentChat as SDKAgentChat } from '@blocksdiy/blocks-client-sdk';
import { useClient } from '@blocksdiy/blocks-client-sdk/reactSdk';
import * as AgentChatPrimitive from '@blocksdiy/react-common/agent-chat';
import { AgentChatData, MessageItem } from '@blocksdiy/react-common/agent-chat';
import { cva, type VariantProps } from 'class-variance-authority';
import { format } from 'date-fns';
import {
  File,
  FileImage,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { Markdown } from '@/components/ui/markdown';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const agentChatContentVariants = cva(
  'flex flex-col overflow-hidden h-full w-full',
  {
    variants: {
      variant: {
        bubble: '',
        minimal: '',
      },
      userPosition: {
        side: '',
        bottom: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'bubble',
      userPosition: 'side',
      size: 'md',
    },
  },
);

const agentChatMessagesVariants = cva('flex flex-col', {
  variants: {
    size: {
      sm: 'p-2',
      md: 'p-2',
      lg: 'p-3',
    },
    variant: {
      bubble: '',
      minimal: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'bubble',
  },
});

const agentChatMessageTimestampVariants = cva('flex items-center', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    role: {
      human: '',
      ai: '',
    },
    userPosition: {
      side: '',
      bottom: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    {
      userPosition: 'bottom',
      size: 'sm',
      className: 'gap-2',
    },
    {
      userPosition: 'bottom',
      size: 'md',
      className: 'gap-2',
    },
    {
      userPosition: 'bottom',
      size: 'lg',
      className: 'gap-3',
    },
    {
      variant: 'bubble',
      role: 'ai',
      className: 'flex-row',
    },
    {
      variant: 'bubble',
      role: 'human',
      className: 'flex-row-reverse',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    userPosition: 'side',
    size: 'md',
    role: 'ai',
  },
});

const messageVariants = cva('group relative flex transition-colors', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    role: {
      human: '',
      ai: '',
    },
  },
  compoundVariants: [
    {
      variant: 'bubble',
      size: 'sm',
      className: 'p-2 gap-2',
    },
    {
      variant: 'bubble',
      size: 'md',
      className: 'p-2 gap-2',
    },
    {
      variant: 'bubble',
      size: 'lg',
      className: 'p-3 gap-3',
    },
    {
      variant: 'bubble',
      role: 'ai',
      className: 'flex-row',
    },
    {
      variant: 'bubble',
      role: 'human',
      className: 'flex-row-reverse',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    size: 'md',
    role: 'ai',
  },
});

const messageContentVariants = cva('relative', {
  variants: {
    variant: {
      bubble: 'rounded-lg max-w-full md:max-w-[70%]',
      minimal: 'max-w-none',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    role: {
      human: '',
      ai: '',
    },
  },
  compoundVariants: [
    {
      role: 'human',
      variant: 'bubble',
      className: 'bg-primary text-primary-foreground',
    },
    {
      role: 'ai',
      variant: 'bubble',
      className: 'bg-muted text-foreground',
    },
    {
      variant: 'bubble',
      size: 'sm',
      className: 'px-2 py-0.5',
    },
    {
      variant: 'bubble',
      size: 'md',
      className: 'px-3 py-1',
    },
    {
      variant: 'bubble',
      size: 'lg',
      className: 'px-4 py-1.5',
    },
    {
      variant: 'bubble',
      size: 'md',
    },
    {
      variant: 'minimal',
      className: '!px-0 !py-0 !ml-0 !mr-0',
    },
  ],
  defaultVariants: {
    size: 'md',
    variant: 'bubble',
  },
});

const agentChatFooterVariants = cva('flex flex-col border-t shrink-0', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatThinkingVariants = cva(
  'flex items-center text-sm text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'gap-2 p-2 [&>svg]:h-4 [&>svg]:w-4 [&>span]:text-sm',
        md: 'gap-2 p-2 [&>svg]:h-4 [&>svg]:w-4 [&>span]:text-base',
        lg: 'gap-3 p-3 [&>svg]:h-5 [&>svg]:w-5 [&>span]:text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const agentChatFetchingContentVariants = cva('flex flex-col items-center', {
  variants: {
    size: {
      sm: 'gap-2 [&>svg]:h-7 [&>svg]:w-7 [&>span]:text-sm',
      md: 'gap-2 [&>svg]:h-9 [&>svg]:w-9 [&>span]:text-base',
      lg: 'gap-3 [&>svg]:h-11 [&>svg]:w-11 [&>span]:text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatAvatarVariants = cva('shrink-0', {
  variants: {
    role: {
      human: '',
      ai: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    userPosition: {
      side: '',
      bottom: 'h-7 w-7',
    },
  },
  compoundVariants: [
    {
      userPosition: 'side',
      size: 'sm',
      className: 'h-7 w-7',
    },
    {
      userPosition: 'side',
      size: 'md',
      className: 'h-9 w-9',
    },
    {
      userPosition: 'side',
      size: 'lg',
      className: 'h-11 w-11',
    },
  ],
  defaultVariants: {
    role: 'ai',
    size: 'md',
    userPosition: 'side',
  },
});

const agentChatAvatarFallbackVariants = cva('', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    userPosition: {
      side: '',
      bottom: 'text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatMessageContentWrapperVariants = cva('flex flex-col flex-1', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    role: {
      human: '',
      ai: '',
    },
  },
  compoundVariants: [
    {
      variant: 'minimal',
      size: 'md',
      className: 'gap-1',
    },
    {
      variant: 'minimal',
      size: 'lg',
      className: 'gap-1',
    },
    {
      variant: 'bubble',
      size: 'sm',
      className: 'gap-2',
    },
    {
      variant: 'bubble',
      size: 'md',
      className: 'gap-2',
    },
    {
      variant: 'bubble',
      size: 'lg',
      className: 'gap-3',
    },
    {
      role: 'human',
      variant: 'bubble',
      className: 'items-end',
    },
    {
      role: 'ai',
      variant: 'bubble',
      className: 'items-start',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    size: 'md',
    role: 'ai',
  },
});

const agentChatMessageAttachmentsVariants = cva('flex flex-wrap', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    role: {
      human: '',
      ai: '',
    },
    size: {
      sm: 'gap-2',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  compoundVariants: [
    {
      variant: 'bubble',
      role: 'ai',
      className: 'flex-row',
    },
    {
      variant: 'bubble',
      role: 'human',
      className: 'flex-row-reverse',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    role: 'ai',
    size: 'md',
  },
});

const agentChatFooterAttachmentsVariants = cva('flex overflow-auto pb-0', {
  variants: {
    size: {
      sm: 'gap-2 p-2',
      md: 'gap-2 p-2',
      lg: 'gap-3 p-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatAttachmentBadgeVariants = cva(
  'inline-flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 shrink-0',
  {
    variants: {
      size: {
        sm: 'text-sm gap-1 px-2 h-7 max-w-[150px]',
        md: 'text-base gap-1.5 px-3 h-9 max-w-[200px]',
        lg: 'text-lg gap-2 px-4 h-11 max-w-[250px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const agentChatInputVariants = cva(
  'resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none !min-h-0',
  {
    variants: {
      size: {
        sm: 'px-2 py-1.5 text-sm md:text-sm',
        md: 'px-3 py-1.5 text-sm md:text-base',
        lg: 'px-4 py-2 text-lg md:text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return FileImage;
  }

  if (fileType.includes('pdf') || fileType.includes('doc')) {
    return FileText;
  }

  return File;
};

export type Message = AgentChatPrimitive.MessageItem;
export type Attachment = AgentChatPrimitive.Attachment;

interface AgentChatAttachmentBadgeProps extends VariantProps<
  typeof agentChatAttachmentBadgeVariants
> {
  attachment: Attachment;
  onRemove?: () => void;
  className?: string;
}

function AgentChatAttachmentBadge({
  attachment,
  onRemove,
  size = 'md',
  className,
}: AgentChatAttachmentBadgeProps) {
  const Icon = getFileIcon(attachment.fileType);

  return (
    <Badge
      variant="outline"
      className={cn(
        'group/attachment',
        agentChatAttachmentBadgeVariants({ size }),
        className,
      )}
    >
      <Icon className="shrink-0" />
      <span className="font-normal truncate grow">{attachment.fileName}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 hover:bg-accent rounded-full p-1 -m-1 [&>svg]:h-4 [&>svg]:w-4 invisible group-hover/attachment:visible"
          aria-label="Remove attachment"
        >
          <X />
          <span className="sr-only">Remove attachment</span>
        </button>
      )}
    </Badge>
  );
}

interface AgentChatMessageProps {
  message: Message;
  index: number;
  showTimestamp?: boolean;
  dateFormat?: string;
  userPosition?: 'side' | 'bottom';
}

function AgentChatAvatar({
  role = 'ai',
  size = 'md',
  userPosition = 'side',
  className,
}: VariantProps<typeof agentChatAvatarVariants> & {
  className?: string;
}) {
  const client = useClient();
  const user = client.getUser();
  const { agentChatData } = useAgentChat();

  const displayName = React.useMemo(() => {
    if (role === 'ai') {
      if (agentChatData?.agent?.title) {
        const agentChatInitials = agentChatData.agent.title
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase();
        return agentChatInitials;
      }
      return 'AI';
    }

    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
    return initials || 'U';
  }, [role, user.firstName, user.lastName, agentChatData?.agent?.title]);

  return (
    <Avatar
      className={cn(
        agentChatAvatarVariants({
          role,
          size,
          userPosition,
          className,
        }),
      )}
    >
      <AvatarImage
        src={
          role === 'human'
            ? user.profileImageUrl
            : agentChatData?.agent?.photoUrl
        }
      />
      <AvatarFallback
        className={agentChatAvatarFallbackVariants({
          size,
          userPosition,
        })}
      >
        {displayName}
      </AvatarFallback>
    </Avatar>
  );
}

export function AgentChatMessage({
  message,
  index,
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  showTimestamp = true,
  dateFormat = 'HH:mm',
  className,
  ...props
}: AgentChatMessageProps &
  VariantProps<typeof messageVariants> &
  React.ComponentProps<'div'>) {
  const client = useClient();
  const { messages } = useAgentChat();
  const nextMessage = messages[index + 1];
  const previousMessage = messages[index - 1];
  const isLastInGroup =
    !nextMessage || nextMessage.msg.role !== message.msg.role;
  const isFirstInGroup =
    !previousMessage || previousMessage.msg.role !== message.msg.role;
  const user = client.getUser();

  const messageContent =
    variant === 'minimal' && userPosition === 'side'
      ? `**${message.msg.role === 'human' ? user.firstName || 'You' : 'AI'}:** ${
          message.msg.content || ''
        }`
      : message.msg.content;

  return (
    <AgentChatPrimitive.AgentChatMessage
      message={message}
      index={index}
      className={cn(
        messageVariants({ size, role: message.msg.role }),
        !isLastInGroup && 'pb-0',
        className,
      )}
      {...props}
    >
      {variant === 'bubble' && userPosition === 'side' && (
        <AgentChatAvatar
          role={message.msg.role}
          size={size}
          userPosition={userPosition}
          className={!isFirstInGroup ? 'invisible' : undefined}
        />
      )}

      <div
        className={agentChatMessageContentWrapperVariants({
          size,
          variant,
          role: message.msg.role,
        })}
      >
        {messageContent && (
          <div
            data-slot="agent-chat-message-content"
            className={cn(
              messageContentVariants({ size, role: message.msg.role, variant }),
            )}
          >
            <Markdown
              value={messageContent}
              size={size}
              className={cn(
                'prose-p:my-0',
                message.msg.role === 'human' &&
                  variant === 'bubble' &&
                  'text-primary-foreground',
              )}
            />
          </div>
        )}
        {message.msg.attachments && message.msg.attachments.length > 0 && (
          <div
            data-slot="agent-chat-message-attachments"
            className={agentChatMessageAttachmentsVariants({
              size,
              variant,
              role: message.msg.role,
            })}
          >
            {message.msg.attachments.map((attachment, i) => (
              <AgentChatAttachmentBadge
                key={i}
                attachment={attachment}
                size={size}
              />
            ))}
          </div>
        )}
        {showTimestamp && isLastInGroup && (
          <div
            data-slot="agent-chat-message-timestamp"
            className={agentChatMessageTimestampVariants({
              variant,
              userPosition,
              size,
              role: message.msg.role,
            })}
          >
            {userPosition === 'bottom' && (
              <AgentChatAvatar
                role={message.msg.role}
                size={size}
                userPosition={userPosition}
              />
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), dateFormat)}
            </span>
          </div>
        )}
      </div>
    </AgentChatPrimitive.AgentChatMessage>
  );
}

export function AgentChatThinking({
  size = 'md',
  className,
  ...props
}: VariantProps<typeof agentChatThinkingVariants> &
  React.ComponentProps<'div'>) {
  const { agentChatData } = useAgentChat();

  return (
    <AgentChatPrimitive.AgentChatThinking
      className={cn(agentChatThinkingVariants({ size }), className)}
      {...props}
    >
      <Loader2 className="animate-spin" />
      <span>{agentChatData?.agent?.title || 'AI'} is thinking...</span>
    </AgentChatPrimitive.AgentChatThinking>
  );
}

export function AgentChatFetching({
  size = 'md',
  className,
  ...props
}: VariantProps<typeof agentChatThinkingVariants> &
  React.ComponentProps<'div'>) {
  return (
    <AgentChatPrimitive.AgentChatFetching
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm',
        'flex items-center justify-center',
        className,
      )}
      {...props}
    >
      <div className={agentChatFetchingContentVariants({ size })}>
        <Loader2 className="animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading messages...</span>
      </div>
    </AgentChatPrimitive.AgentChatFetching>
  );
}

interface AgentChatProps {
  agentChat: SDKAgentChat;
  chatId?: string;
  defaultThreadId?: string;
  noPersistency?: boolean;
  chatContext?: any;
  chatContextFiles?: Attachment[];
  children?: React.ReactNode;
}

const getPhotoUrlFromAgentBlockData = (agentBlockData: any) => {
  const { photo } = agentBlockData || {};
  if (photo) {
    if (photo.fileBlockId) {
      return `/api/blocks/fileDataBlock/${photo.fileBlockId}/redirect`;
    }

    if (photo.url) {
      return photo.url;
    }
  }

  return undefined;
};

export function AgentChat({
  agentChat,
  chatContext,
  noPersistency,
  ...props
}: AgentChatProps) {
  const client = useClient();
  const user = client.getUser();
  const [agentChatData, setAgentChatData] = useState<AgentChatData | undefined>(
    undefined,
  );

  const agentChatProps = agentChat.getAgentChatComponentProps();
  const { agentChatId, appId, token } = agentChatProps;
  useEffect(() => {
    const fetchAgentChatData = async () => {
      if (!agentChatId) {
        return;
      }

      const blocksApiService = new BlocksApiService({ token: client.token });

      const agentChatBlock = await blocksApiService.getBlock(agentChatId);
      const agentChatBlockData = agentChatBlock?.data;
      if (!agentChatBlockData) {
        return;
      }

      const { agentBlockId, initialMessages, initialPrompt } =
        agentChatBlockData;
      let agentBlockData;
      if (agentBlockId) {
        const agentBlock = await blocksApiService.getBlock(agentBlockId);
        agentBlockData = agentBlock?.data;
      }

      setAgentChatData({
        agent: {
          title: agentBlockData?.title,
          jobTitle: agentBlockData?.jobTitle,
          photoUrl: getPhotoUrlFromAgentBlockData(agentBlockData),
          voiceId: agentChatBlockData?.voiceId || agentBlockData?.voiceId, // With fallback logic
        },
        initialMessages,
        initialPrompt,
      });
    };

    fetchAgentChatData();
  }, [agentChatId]);

  const finalChatContext = {
    currentUserData: user,
    chatContext: chatContext,
  };

  return (
    <AgentChatPrimitive.AgentChatRoot
      appId={appId}
      token={token}
      agentChatId={agentChatId}
      chatContext={finalChatContext}
      agentChatData={agentChatData}
      noPersistency={noPersistency || !user.isAuthenticated}
      {...props}
    />
  );
}

export function AgentChatContent({
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  className,
  ...props
}: VariantProps<typeof agentChatContentVariants> &
  React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="agent-chat-content"
      className={cn(
        agentChatContentVariants({ variant, size, userPosition, className }),
      )}
      {...props}
    />
  );
}

interface AgentChatMessagesProps {
  showTimestamps?: boolean;
  dateFormat?: string;
  userPosition?: 'side' | 'bottom';
}

export function AgentChatMessages({
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  showTimestamps = true,
  dateFormat = 'HH:mm',
  className,
  ...props
}: AgentChatMessagesProps &
  VariantProps<typeof messageVariants> &
  React.ComponentProps<'div'>) {
  const { messages } = useAgentChat();

  return (
    <AgentChatPrimitive.AgentChatMessages
      scrollAreaClassName="flex-1"
      autoScroll
      asChild
    >
      <div
        className={cn(agentChatMessagesVariants({ variant, size }), className)}
        {...props}
      >
        {messages.map((message, index) => {
          const flatMsg = message as MessageItem & MessageItem['msg'];
          if (flatMsg.payload?.isVoiceMarker) {
            return (
              <div
                key={message.id}
                className="flex items-center justify-center py-3"
              >
                <span className="text-xs text-muted-foreground">
                  {flatMsg.content}
                </span>
              </div>
            );
          }

          return (
            <AgentChatMessage
              key={message.id}
              message={message}
              index={index}
              variant={variant}
              size={size}
              userPosition={userPosition}
              showTimestamp={showTimestamps}
              dateFormat={dateFormat}
            />
          );
        })}

        <AgentChatThinking size={size} />
        <AgentChatFetching size={size} />
      </div>
    </AgentChatPrimitive.AgentChatMessages>
  );
}

interface AgentChatInputProps {
  acceptFiles?: boolean;
  sendOnEnter?: boolean;
}

export function AgentChatInput({
  className,
  onSubmit,
  sendOnEnter = true,
  placeholder = 'Type a message...',
  ...props
}: AgentChatInputProps &
  VariantProps<typeof agentChatInputVariants> &
  React.ComponentProps<'textarea'>) {
  return (
    <AgentChatPrimitive.AgentChatInput asChild>
      <Textarea
        placeholder={placeholder}
        rows={1}
        className={cn(agentChatInputVariants({ size: props.size }), className)}
        onSubmit={sendOnEnter ? undefined : onSubmit}
        {...props}
      />
    </AgentChatPrimitive.AgentChatInput>
  );
}

interface AgentChatFooterProps {
  hideAttachmentButton?: boolean;
  withVoice?: boolean;
}

export function AgentChatFooter({
  withVoice = false,
  ...props
}: AgentChatFooterProps &
  VariantProps<typeof agentChatFooterVariants> &
  React.ComponentProps<'div'>) {
  if (withVoice) {
    return (
      <AgentChatPrimitive.AgentChatVoice>
        <AgentChatFooterInner withVoice {...props} />
      </AgentChatPrimitive.AgentChatVoice>
    );
  }

  return <AgentChatFooterInner {...props} />;
}

function AgentChatFooterInner({
  size = 'md',
  className,
  hideAttachmentButton = false,
  withVoice = false,
  children,
  ...props
}: AgentChatFooterProps &
  VariantProps<typeof agentChatFooterVariants> &
  React.ComponentProps<'div'>) {
  const { attachments, isThinking, removeAttachment } = useAgentChat();
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    stream,
    startVoiceCall,
    endVoiceCall,
  } = AgentChatPrimitive.useAgentChatVoice();

  const buttonSize =
    size === 'sm' || size === 'md' ? 'size-8 [&>svg]:size-4' : undefined;

  const isVoiceActive = withVoice && (isConnected || isConnecting);

  const smoothFade = { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as const;

  return (
    <div
      className={cn(agentChatFooterVariants({ size, className }))}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isVoiceActive ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={smoothFade}
            className="flex items-center gap-2 px-2 py-1.5"
          >
            <LiveWaveform
              active={isConnected && !isSpeaking}
              processing={isConnecting || isSpeaking}
              stream={stream}
              mode="scrolling"
              height={size === 'lg' ? 44 : size === 'md' ? 36 : 32}
              barWidth={3}
              barGap={2}
              fadeEdges
              style={{
                transition: 'color 0.2s ease-in-out',
                color: isSpeaking
                  ? 'hsl(var(--muted-foreground))'
                  : !isConnected || isConnecting
                    ? 'hsl(var(--muted-foreground))'
                    : 'hsl(var(--primary))',
              }}
            />
            <Button
              onClick={endVoiceCall}
              variant="outline"
              className={cn(buttonSize, 'shrink-0 w-auto')}
            >
              <X />
              <span>{isConnecting ? 'Connecting...' : 'Voice mode'}</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={smoothFade}
          >
            <AnimatePresence initial={false}>
              {attachments.length > 0 && (
                <motion.div
                  key="attachments"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={smoothFade}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={agentChatFooterAttachmentsVariants({ size })}>
                    {attachments.map((attachment) => (
                      <AgentChatAttachmentBadge
                        key={attachment.url}
                        attachment={attachment}
                        size={size}
                        onRemove={() => removeAttachment(attachment.url)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 px-2 py-1.5">
              <AgentChatInput size={size} className="flex-1 min-w-0" />

              {!hideAttachmentButton && (
                <AgentChatPrimitive.AgentChatAttachmentTrigger asChild>
                  <Button size="icon" variant="outline" className={buttonSize}>
                    <Paperclip />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </AgentChatPrimitive.AgentChatAttachmentTrigger>
              )}

              {withVoice && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={startVoiceCall}
                  className={buttonSize}
                >
                  <Mic />
                  <span className="sr-only">Start voice mode</span>
                </Button>
              )}

              <AgentChatPrimitive.AgentChatSendTrigger asChild>
                <Button size="icon" variant="default" className={buttonSize}>
                  {isThinking ? <Loader2 className="animate-spin" /> : <Send />}
                  <span className="sr-only">Send message</span>
                </Button>
              </AgentChatPrimitive.AgentChatSendTrigger>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

export function AgentChatSimple({
  agentChat,
  chatId,
  defaultThreadId,
  noPersistency,
  chatContext,
  chatContextFiles,
  withVoice = false,
  size = 'md',
  variant = 'bubble',
  ...props
}: AgentChatProps &
  { withVoice?: boolean } &
  VariantProps<typeof agentChatContentVariants> &
  React.ComponentProps<'div'>) {
  return (
    <AgentChat
      agentChat={agentChat}
      chatId={chatId}
      defaultThreadId={defaultThreadId}
      noPersistency={noPersistency}
      chatContext={chatContext}
      chatContextFiles={chatContextFiles}
    >
      <AgentChatContent variant={variant} size={size} {...props}>
        <AgentChatMessages
          variant={variant}
          size={size}
          userPosition={props.userPosition || undefined}
        />
        <AgentChatFooter size={size} withVoice={withVoice} />
      </AgentChatContent>
    </AgentChat>
  );
}

export const useAgentChat = AgentChatPrimitive.useAgentChat;

export { AgentChatPrimitive };
