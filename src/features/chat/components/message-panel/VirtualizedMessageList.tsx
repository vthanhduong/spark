import { memo, type RefObject, useMemo } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import type { ChatMessage } from '../../stores/chat.store';
import { CachedMessage } from './CachedMessage';
import { ThrottledStreamingMessage } from './ThrottledStreamingMessage';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  onDeleteFromIndex: (index: number) => void;
  isLoadingOlderMessages: boolean;
  isLoadingMessages: boolean;
  isAuthenticated: boolean;
}

// Only render messages within viewport + buffer
const MESSAGES_BUFFER = 50; // Render 50 messages above and below viewport

export const VirtualizedMessageList = memo(
  ({
    messages,
    streamingMessage,
    isStreaming,
    containerRef,
    onScroll,
    onDeleteFromIndex,
    isLoadingOlderMessages,
    isLoadingMessages,
    isAuthenticated,
  }: VirtualizedMessageListProps) => {
    
    // Optimize: Only render recent messages to reduce DOM nodes
    const visibleMessages = useMemo(() => {
      // Always show latest messages for better UX
      if (messages.length <= MESSAGES_BUFFER) {
        return messages;
      }
      // Only show last N messages to reduce DOM load
      return messages.slice(-MESSAGES_BUFFER);
    }, [messages]);

    const handleCopy = async (content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        toast.success('Đã sao chép tin nhắn.');
      } catch (error) {
        console.error('Không thể sao chép tin nhắn', error);
        toast.error('Không thể sao chép tin nhắn.');
      }
    };

    return (
      <ScrollArea
        className="relative flex-1 min-h-0 overflow-hidden"
        viewportRef={containerRef}
        onViewportScroll={onScroll}
        viewportClassName="h-full"
      >
        <div className="flex min-h-full flex-col gap-4 px-4 py-6">
          {/* Loading state when switching conversations */}
          {isLoadingMessages && messages.length === 0 && (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải hội thoại...</p>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoadingMessages && messages.length === 0 && !isStreaming && (
            <div className="flex h-[30vh] items-center justify-center text-center text-4xl font-semibold text-muted-foreground">
              <p>Chào bạn, Hãy cùng trò chuyện ngay!</p>
            </div>
          )}
          
          {/* Loading older messages indicator */}
          {isLoadingOlderMessages && (
            <div className="text-center text-xs text-muted-foreground">Đang tải thêm tin nhắn...</div>
          )}
          
          {/* Virtualization info */}
          {visibleMessages.length < messages.length && (
            <div className="text-center text-xs text-muted-foreground">
              Đang hiển thị {visibleMessages.length} tin nhắn gần nhất (Tổng: {messages.length})
            </div>
          )}
          {visibleMessages.map((message, index) => {
            // Adjust index for original array
            const originalIndex = messages.length - visibleMessages.length + index;
            const isUser = message.sender === 'user';
            const alignmentClass = isUser ? 'justify-end' : 'justify-start';
            const bubbleClass = isUser
              ? 'bg-slate-100/90 text-black'
              : 'bg-muted/80 text-foreground';

            return (
              <div key={message.id} className={`flex w-full ${alignmentClass}`}>
                {
                  isAuthenticated ? (
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div 
                        className={`max-w-full rounded-3xl px-5 py-2 text-sm shadow-sm select-none ${bubbleClass}`}
                      >
                        <CachedMessage messageId={message.id} content={message.content} isStreaming={false} />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => handleCopy(message.content)}>
                        Sao chép
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => onDeleteFromIndex(originalIndex)}
                        className="text-destructive focus:text-destructive"
                      >
                        Xoá từ đây
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  ) : (
                    <div className={`max-w-full rounded-2xl px-2.5 py-1 text-sm shadow-sm select-none ${bubbleClass}`}>
                        <CachedMessage messageId={message.id} content={message.content} isStreaming={false} />
                    </div>
                  )
                }
              </div>
            );
          })}
          {isStreaming && streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-full rounded-3xl bg-muted/80 px-5 py-3 text-sm text-foreground">
                <ThrottledStreamingMessage content={streamingMessage} isStreaming />
              </div>
            </div>
          )}
          {isStreaming && !streamingMessage && (
            <div className="flex justify-start text-sm text-muted-foreground">Đang trả lời...</div>
          )}
        </div>
      </ScrollArea>
    );
  },
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';
