import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVertical, Loader2, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

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
  const {
    conversations,
    hasMore,
    isLoading,
    selectedConversationId,
    authMode,
  } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
      hasMore: state.hasMoreConversations,
      isLoading: state.isLoadingConversations,
      selectedConversationId: state.selectedConversationId,
      authMode: state.authMode,
    }))
  );

  const {
    fetchConversations,
    selectConversation,
    deleteConversation,
  } = useChatStore(
    useShallow((state) => ({
      fetchConversations: state.fetchConversations,
      selectConversation: state.selectConversation,
      deleteConversation: state.deleteConversation,
    }))
  );

  const isAuthenticated = useSessionStore((state) => state.status) === "authenticated";
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authMode !== 'authenticated') return;
    fetchConversations(true);
  }, [authMode, fetchConversations]);

  const handleConversationClick = (convId: string) => {
    navigate(`/conversation/${convId}`);
  };

  const handleNewConversation = () => {
    selectConversation(null);
    navigate('/');
  };

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
    <aside className="shrink-0 border-r border-border bg-background/40 flex flex-col h-full">
      {/* Header with logo */}
      <div className="flex flex-row items-center gap-x-2 p-4 border-b border-border/50">
        <img src="/logo.png" className="w-10 h-10" alt="Logo"/>
        <span className="font-semibold text-foreground">spark by vthanhduong</span>
      </div>

      {/* Section header with new conversation button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Hội thoại</h2>
          <p className="text-xs text-muted-foreground">Danh sách hội thoại của bạn!</p>
        </div>
        <Button
          size="sm"
          onClick={handleNewConversation}
          className="gap-2"
          variant="default"
        >
          <MessageSquarePlus className="size-4" />
          Mới
        </Button>
      </div>

      {/* Scrollable conversation list */}
      <ScrollArea
        className="flex-1 min-h-0"
        viewportRef={viewportRef}
        onViewportScroll={handleScroll}
      >
        <div className="space-y-1.5 px-3 py-2">
          {
            isAuthenticated ? (
              <>
                {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleConversationClick(conversation.id)}
                  className={cn(
                    'group relative flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-200',
                    isSelected
                      ? 'border-primary/50 bg-primary/10 shadow-sm'
                      : 'border-transparent bg-muted/40 hover:border-border/70 hover:bg-muted/70 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(
                      "line-clamp-1 text-sm font-medium transition-colors",
                      isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                    )}>
                      {conversation.title}
                    </span>
                    {authMode === 'authenticated' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <EllipsisVertical className="size-3.5" />
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
                  <p className={cn(
                    "line-clamp-2 text-xs transition-colors",
                    isSelected ? "text-muted-foreground" : "text-muted-foreground/80"
                  )}>
                    {conversation.last_message_preview || 'Chưa có tin nhắn nào.'}
                  </p>
                </button>
              );
            })}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Đang tải...</span>
              </div>
            )}
            {!isLoading && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <MessageSquarePlus className="size-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">Chưa có hội thoại nào</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hãy bắt đầu một cuộc trò chuyện mới!
                </p>
              </div>
            )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                Để có thể lưu được lịch sử trò chuyện và tinh chỉnh nâng cao, hãy đăng nhập hoặc đăng ký ngay!
              </div>
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
