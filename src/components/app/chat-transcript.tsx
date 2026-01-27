'use client';

import { AnimatePresence, type HTMLMotionProps, motion } from 'motion/react';
import { type ReceivedMessage } from '@livekit/components-react';
import { ChatEntry } from '@/components/livekit/chat-entry';

const MotionContainer = motion.create('div');
const MotionChatEntry = motion.create(ChatEntry);

const CONTAINER_MOTION_PROPS = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut' as const,
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1,
        ease: 'easeOut' as const,
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: 1,
      },
    },
  },
  initial: 'visible',
  animate: 'visible',
  exit: 'hidden',
};

const MESSAGE_MOTION_PROPS = {
  variants: {
    hidden: {
      opacity: 0,
      translateY: 10,
    },
    visible: {
      opacity: 1,
      translateY: 0,
    },
  },
  transition: {
    duration: 0.3,
    ease: 'easeOut' as const,
  },
};

interface ChatTranscriptProps {
  hidden?: boolean;
  messages?: ReceivedMessage[];
}

export function ChatTranscript({
  hidden = false,
  messages = [],
  ...props
}: ChatTranscriptProps & Omit<HTMLMotionProps<'div'>, 'ref'>) {
  // Debug logging
  console.log('📨 ChatTranscript render:', {
    hidden,
    messagesCount: messages.length,
    messages: messages.map(m => ({
      id: m.id,
      message: m.message?.substring(0, 50),
      from: m.from?.identity,
      isLocal: m.from?.isLocal,
    })),
  });

  if (hidden) {
    console.log('⚠️ ChatTranscript is hidden, returning null');
    return null;
  }

  if (messages.length === 0) {
    console.log('⚠️ ChatTranscript has no messages');
  }

  return (
    <MotionContainer 
      {...CONTAINER_MOTION_PROPS} 
      {...props}
    >
      <AnimatePresence mode="popLayout">
        {messages.map((receivedMessage, index) => {
          console.log(`📝 Rendering message ${index}:`, {
            id: receivedMessage.id,
            message: receivedMessage.message?.substring(0, 50),
          });
          const { id, timestamp, from, message } = receivedMessage;
          const locale = navigator?.language ?? 'en-US';
          const messageOrigin = from?.isLocal ? 'local' : 'remote';
          const hasBeenEdited =
            receivedMessage.type === 'chatMessage' && !!receivedMessage.editTimestamp;
          
          // Extract streaming props if they exist
          const isStreaming = (receivedMessage as any).isStreaming ?? false;
          const displayedLength = (receivedMessage as any).displayedLength;

          return (
            <MotionChatEntry
              key={id}
              locale={locale}
              timestamp={timestamp}
              message={message}
              messageOrigin={messageOrigin}
              hasBeenEdited={hasBeenEdited}
              isStreaming={isStreaming}
              displayedLength={displayedLength}
              initial="hidden"
              animate="visible"
              exit="hidden"
              {...MESSAGE_MOTION_PROPS}
            />
          );
        })}
      </AnimatePresence>
    </MotionContainer>
  );
}
