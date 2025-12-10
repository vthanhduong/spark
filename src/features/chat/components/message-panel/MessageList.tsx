import { memo, type RefObject } from 'react';
import { toast } from 'sonner';

import type { ChatMessage } from '../../stores/chat.store';
import { LLMMessageRenderer } from './LLMMessageRenderer';
import { CachedMessage } from './CachedMessage';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  onDeleteFromIndex: (index: number) => void;
  isLoadingOlderMessages: boolean;
  isAuthenticated: boolean;
}

export const MessageList = memo(
  ({
    messages,
    streamingMessage,
    isStreaming,
    containerRef,
    onScroll,
    onDeleteFromIndex,
    isLoadingOlderMessages,
    isAuthenticated,
  }: MessageListProps) => {
    
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
          {messages.length === 0 && !isStreaming && (
            <div className="flex h-[30vh] items-center justify-center text-center text-4xl font-semibold text-muted-foreground">
              <p>Chào bạn, Hãy cùng trò chuyện ngay!</p>
            </div>
          )}
          {isLoadingOlderMessages && (
            <div className="text-center text-xs text-muted-foreground">Đang tải thêm tin nhắn...</div>
          )}
          {messages.map((message, index) => {
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
                      <div className={`max-w-full rounded-3xl px-5 py-2 text-sm shadow-sm ${bubbleClass}`}>
                        <CachedMessage messageId={message.id} content={message.content} isStreaming={false} />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => handleCopy(message.content)}>
                        Sao chép
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => onDeleteFromIndex(index)}
                        className="text-destructive focus:text-destructive"
                      >
                        Xoá từ đây
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  ) : (
                    <div className={`max-w-full rounded-2xl px-2.5 py-1 text-sm shadow-sm ${bubbleClass}`}>
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
                <LLMMessageRenderer content={streamingMessage} isStreaming />
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

MessageList.displayName = 'MessageList';
