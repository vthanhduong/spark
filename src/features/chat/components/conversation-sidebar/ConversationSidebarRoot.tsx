import { useEffect, useRef, useState } from 'react';
import { EllipsisVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useChatStore, type ConversationSummary } from '../../stores/chat.store';
import { useSessionStore } from '@/features/auth/stores/session.store';

export const ConversationSidebar = () => {
  const conversations = useChatStore((state) => state.conversations);
  const hasMore = useChatStore((state) => state.hasMoreConversations);
  const isLoading = useChatStore((state) => state.isLoadingConversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const authMode = useChatStore((state) => state.authMode);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const isAuthenticated = useSessionStore((state) => state.status) === "authenticated";
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authMode !== 'authenticated') return;
    fetchConversations(true);
  }, [authMode, fetchConversations]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      if (hasMore && !isLoading) {
        fetchConversations(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteConversation(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Đã xoá hội thoại.');
    } catch (error) {
      console.error('Không thể xoá hội thoại', error);
      toast.error('Không thể xoá hội thoại. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <aside className="shrink-0 border-r border-border bg-background/40 flex flex-col">
      <div className="flex flex-row items-center gap-x-2 p-4">
        <img src="/logo.png" className="w-10 h-10"/>
        <span className="font-semibold">spark by vthanhduong</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Hội thoại</h2>
          <p className="text-xs text-muted-foreground">Danh sách hội thoại của bạn!</p>
        </div>
        <Button size="sm" onClick={() => selectConversation(null)}>
          Mới
        </Button>
      </div>
      <ScrollArea
        className="flex-1"
        viewportRef={viewportRef}
        onViewportScroll={handleScroll}
      >
        <div className="space-y-2 px-2 py-3">
          {
            isAuthenticated ? (
              <>
                {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    'group relative flex w-full flex-col gap-1 rounded-xl border px-3 py-3 text-left transition',
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-transparent bg-muted/60 text-muted-foreground hover:border-border/70 hover:bg-muted/80',
                  )}
                >
                  <div className="flex items-start justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="line-clamp-1 group-hover:text-foreground">{conversation.title}</span>
                    {authMode === 'authenticated' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(conversation);
                            }}
                          >
                            Xoá hội thoại
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {conversation.last_message_preview || 'Chưa có tin nhắn nào.'}
                  </p>
                </button>
              );
            })}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </div>
            )}
            {!isLoading && conversations.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Chưa có hội thoại nào. Hãy bắt đầu một cuộc trò chuyện mới!
              </div>
            )}
            </>
          ) : (
            <div>
              Để có thể lưu được lịch sử trò chuyện và tinh chỉnh nâng cao, hãy đăng nhập hoặc đăng ký ngay!
            </div>
          )
          }
        </div>
      </ScrollArea>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá hội thoại</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? (
                    <span>
                      Bạn có chắc chắn muốn xoá hội thoại <span className="font-semibold text-foreground">{deleteTarget.title}</span>? Tất cả tin nhắn liên quan cũng sẽ bị xoá.
                    </span>
                  )
                : 'Bạn có chắc chắn muốn xoá hội thoại này?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
