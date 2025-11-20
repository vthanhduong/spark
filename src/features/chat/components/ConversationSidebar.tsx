import { useEffect } from 'react';

import { useChatStore } from '../stores/chat.store';

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Vừa xong';
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  return date.toLocaleString();
}

export const ConversationSidebar = () => {
  const conversations = useChatStore((state) => state.conversations);
  const hasMore = useChatStore((state) => state.hasMoreConversations);
  const isLoading = useChatStore((state) => state.isLoadingConversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const authMode = useChatStore((state) => state.authMode);

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

  return (
    <aside className="hidden w-80 shrink-0 border-r border-neutral-700 bg-neutral-900/40 md:flex md:flex-col">
      <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
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
            <button
              key={conversation.id}
              type="button"
              onClick={() => selectConversation(conversation.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition cursor-pointer ${
                isSelected
                  ? 'border-green-400 bg-green-400/10 text-white'
                  : 'border-transparent bg-neutral-800/60 text-neutral-200 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{conversation.title}</span>
                <span className="text-xs text-neutral-400">{formatUpdatedAt(conversation.updated_at)}</span>
              </div>
            </button>
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
    </aside>
  );
};
