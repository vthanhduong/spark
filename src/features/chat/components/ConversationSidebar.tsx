import { useEffect, useState } from 'react';

import { useChatStore, type ConversationSummary } from '../stores/chat.store';

export const ConversationSidebar = () => {
  const conversations = useChatStore((state) => state.conversations);
  const hasMore = useChatStore((state) => state.hasMoreConversations);
  const isLoading = useChatStore((state) => state.isLoadingConversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const authMode = useChatStore((state) => state.authMode);
  const deleteConversation = useChatStore((state) => state.deleteConversation);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmConversation, setConfirmConversation] = useState<ConversationSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (authMode !== 'authenticated') return;
    fetchConversations(true);
  }, [authMode, fetchConversations]);

  useEffect(() => {
    if (!menuOpenId) return;
    const handleClose = () => setMenuOpenId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [menuOpenId]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      if (hasMore && !isLoading) {
        fetchConversations(false);
      }
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, conversationId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpenId((prev) => (prev === conversationId ? null : conversationId));
  };

  const handleRequestDelete = (
    event: React.MouseEvent<HTMLButtonElement>,
    conversation: ConversationSummary,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpenId(null);
    setDeleteError(null);
    setConfirmConversation(conversation);
  };

  const handleCloseConfirm = () => {
    if (isDeleting) return;
    setConfirmConversation(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmConversation) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteConversation(confirmConversation.id);
      setConfirmConversation(null);
    } catch (error) {
      console.error('Không thể xoá hội thoại', error);
      setDeleteError('Không thể xoá hội thoại. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <aside className="hidden w-80 shrink-0 border-r border-neutral-700 bg-neutral-900/40 md:flex md:flex-col">
      <div className="flex items-center justify-between border-neutral-700 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Hội thoại</h2>
          <p className="text-xs text-neutral-400">Danh sách hội thoại của bạn!</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-green-500 px-3 py-1 text-sm font-semibold text-black transition hover:bg-green-400"
          onClick={() => selectConversation(null)}
        >
          Mới
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto px-2 py-3 space-y-2"
        onScroll={handleScroll}
      >
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;
          return (
            <div
              key={conversation.id}
              className={`relative w-full rounded-xl border px-3 py-3 transition cursor-pointer ${
                isSelected
                  ? 'border-green-400 bg-green-400/10 text-white'
                  : 'border-transparent bg-neutral-800/60 text-neutral-200 hover:border-neutral-600'
              }`}
            >
              <button
                type="button"
                onClick={() => selectConversation(conversation.id)}
                className="flex w-full flex-col text-left"
              >
                <div className="flex items-start justify-between gap-3 text-sm font-semibold">
                  <span className="line-clamp-1">{conversation.title}</span>
                </div>
              </button>
              {authMode === 'authenticated' && (
                <>
                  <button
                    type="button"
                    onClick={(event) => handleOpenMenu(event, conversation.id)}
                    className="absolute right-3 top-1 rounded-full border border-transparent px-2 py-1 text-lg text-neutral-400 transition hover:text-white"
                  >
                    ⋯
                  </button>
                  {menuOpenId === conversation.id && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="absolute right-3 top-10 z-10 w-40 rounded-lg border border-neutral-700 bg-neutral-900 p-1 text-sm text-neutral-200 shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={(event) => handleRequestDelete(event, conversation)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-300 transition hover:bg-red-500/10"
                      >
                        Xoá hội thoại
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="py-4 text-center text-sm text-neutral-400">Đang tải...</div>
        )}
        {!isLoading && conversations.length === 0 && (
          <div className="py-6 text-center text-sm text-neutral-500">
            Chưa có hội thoại nào. Hãy bắt đầu một cuộc trò chuyện mới!
          </div>
        )}
      </div>
      {confirmConversation && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4"
          onClick={handleCloseConfirm}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 text-slate-100 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleCloseConfirm}
              className="absolute right-4 top-4 text-lg text-neutral-400 transition hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold text-white">Xoá hội thoại</h2>
            <p className="mt-2 text-sm text-neutral-300">
              Bạn có chắc chắn muốn xoá hội thoại <span className="font-semibold text-white">{confirmConversation.title}</span>?
              Tất cả tin nhắn liên quan cũng sẽ bị xoá.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-red-400">{deleteError}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                disabled={isDeleting}
                className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
