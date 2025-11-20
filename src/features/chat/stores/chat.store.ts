import { create } from 'zustand';

import { apiFetch, apiJson } from '../../../lib/api';
import { DEFAULT_PERSONALITY_SLUG, PERSONALITY_OPTIONS, type PersonalityOption } from '../constants/personalities';
import { SSEService } from '../services/sse.service';
import type { GuestMessageHistoryEntry, SSEEndEvent, SSEStartEvent } from '../services/sse.service';

export type AuthMode = 'guest' | 'authenticated';

export interface ConversationSummary {
    id: string;
    title: string;
    personality_slug: string;
    personality_name: string;
    last_message_preview: string | null;
    message_count: number;
    updated_at: string;
    created_at: string;
}

export interface ConversationDetail {
    id: string;
    title: string;
    personality_slug: string;
    personality_name: string;
    last_message_preview: string | null;
    prompt: string;
    greeting: string;
    context_override: string | null;
    effective_prompt: string;
    message_count: number;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai' | 'system';
    content: string;
    createdAt: string;
}

interface MessageListResponse {
    messages: Array<{
        id: string;
        sender: 'user' | 'ai' | 'system';
        content: string;
        created_at: string;
    }>;
    has_more: boolean;
    next_cursor: string | null;
}

interface ConversationListResponse {
    items: ConversationSummary[];
    has_more: boolean;
    next_skip: number;
}

interface ChatStoreState {
    authMode: AuthMode;
    personalities: PersonalityOption[];
    selectedPersonalitySlug: string;
    conversations: ConversationSummary[];
    hasMoreConversations: boolean;
    conversationSkip: number;
    isLoadingConversations: boolean;
    selectedConversationId: string | null;
    conversationDetail: ConversationDetail | null;
    contextEditorValue: string;
    messages: ChatMessage[];
    hasMoreMessages: boolean;
    nextMessageCursor: string | null;
    isLoadingMessages: boolean;
    isLoadingOlderMessages: boolean;
    isStreaming: boolean;
    streamingMessage: string;
    sseService: SSEService | null;
    pendingUserMessageTempId: string | null;
    initialize: () => Promise<void>;
    setAuthMode: (mode: AuthMode) => void;
    setSelectedPersonalitySlug: (personalitySlug: string) => void;
    fetchConversations: (reset?: boolean) => Promise<void>;
    selectConversation: (conversationId: string | null) => Promise<void>;
    loadOlderMessages: () => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
    clearMessages: () => void;
    deleteMessagesFromIndex: (index: number) => Promise<void>;
    updateContextEditorValue: (value: string) => void;
    updateContextOverride: () => Promise<void>;
    updateConversationPersonality: (personalityId: string) => Promise<void>;
    refreshConversationMetadata: (conversationId: string) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
    resetAfterLogout: () => void;
}

function mapApiMessage(message: MessageListResponse['messages'][number]): ChatMessage {
    return {
        id: message.id,
        sender: message.sender,
        content: message.content,
        createdAt: message.created_at,
    };
}

function detailToSummary(detail: ConversationDetail): ConversationSummary {
    return {
        id: detail.id,
        title: detail.title,
        personality_slug: detail.personality_slug,
        personality_name: detail.personality_name,
        last_message_preview: detail.last_message_preview,
        message_count: detail.message_count,
        updated_at: detail.updated_at,
        created_at: detail.created_at,
    };
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
    authMode: 'guest',
    personalities: PERSONALITY_OPTIONS,
    selectedPersonalitySlug: DEFAULT_PERSONALITY_SLUG,
    conversations: [],
    hasMoreConversations: false,
    conversationSkip: 0,
    isLoadingConversations: false,
    selectedConversationId: null,
    conversationDetail: null,
    contextEditorValue: '',
    messages: [],
    hasMoreMessages: false,
    nextMessageCursor: null,
    isLoadingMessages: false,
    isLoadingOlderMessages: false,
    isStreaming: false,
    streamingMessage: '',
    sseService: null,
    pendingUserMessageTempId: null,

    initialize: async () => {
        // Personalities are static constants; no remote initialization required.
        return;
    },

    setAuthMode: (mode) => {
        const currentMode = get().authMode;
        if (currentMode === mode) {
            return;
        }

        if (mode === 'guest') {
            get().sseService?.cancelStream();
            set({
                authMode: 'guest',
                conversations: [],
                hasMoreConversations: false,
                conversationSkip: 0,
                selectedConversationId: null,
                conversationDetail: null,
                messages: [],
                hasMoreMessages: false,
                nextMessageCursor: null,
                isStreaming: false,
                streamingMessage: '',
                selectedPersonalitySlug: DEFAULT_PERSONALITY_SLUG,
            });
        } else {
            set({
                authMode: 'authenticated',
            });
        }
    },

    setSelectedPersonalitySlug: (personalitySlug) => {
        set({ selectedPersonalitySlug: personalitySlug });
    },

    fetchConversations: async (reset = false) => {
        if (get().authMode !== 'authenticated') return;
        if (get().isLoadingConversations) return;

        const skip = reset ? 0 : get().conversationSkip;
        set({ isLoadingConversations: true });
        try {
            const response = await apiJson<ConversationListResponse>(
                `/api/conversations/?skip=${skip}&limit=20`
            );
            set((state) => ({
                conversations: reset ? response.items : [...state.conversations, ...response.items],
                hasMoreConversations: response.has_more,
                conversationSkip: response.next_skip,
                isLoadingConversations: false,
            }));
        } catch (error) {
            console.error('Không thể tải danh sách hội thoại', error);
            set({ isLoadingConversations: false });
        }
    },

    selectConversation: async (conversationId) => {
        if (conversationId === null) {
            get().sseService?.cancelStream();
            set({
                selectedConversationId: null,
                conversationDetail: null,
                contextEditorValue: '',
                messages: [],
                hasMoreMessages: false,
                nextMessageCursor: null,
                streamingMessage: '',
                isStreaming: false,
                selectedPersonalitySlug: DEFAULT_PERSONALITY_SLUG,
            });
            return;
        }

        set({
            selectedConversationId: conversationId,
            isLoadingMessages: true,
            streamingMessage: '',
            isStreaming: false,
        });

        try {
            const [detail, messagesResponse] = await Promise.all([
                apiJson<ConversationDetail>(`/api/conversations/${conversationId}`),
                apiJson<MessageListResponse>(`/api/conversations/${conversationId}/messages?limit=8`),
            ]);

            const mappedMessages = messagesResponse.messages.map(mapApiMessage);

            set({
                conversationDetail: detail,
                contextEditorValue: detail.context_override ?? '',
                messages: mappedMessages,
                hasMoreMessages: messagesResponse.has_more,
                nextMessageCursor: messagesResponse.next_cursor,
                isLoadingMessages: false,
                selectedPersonalitySlug: detail.personality_slug || DEFAULT_PERSONALITY_SLUG,
            });
        } catch (error) {
            console.error('Không thể tải hội thoại', error);
            set({ isLoadingMessages: false });
            throw error;
        }
    },

    loadOlderMessages: async () => {
        const {
            authMode,
            selectedConversationId,
            hasMoreMessages,
            nextMessageCursor,
            isLoadingOlderMessages,
        } = get();

        if (authMode !== 'authenticated') return;
        if (!selectedConversationId || !hasMoreMessages || isLoadingOlderMessages) return;
        if (!nextMessageCursor) return;

        set({ isLoadingOlderMessages: true });
        try {
            const response = await apiJson<MessageListResponse>(
                `/api/conversations/${selectedConversationId}/messages?limit=8&cursor=${nextMessageCursor}`
            );
            const mapped = response.messages.map(mapApiMessage);
            set((state) => ({
                messages: [...mapped, ...state.messages],
                hasMoreMessages: response.has_more,
                nextMessageCursor: response.next_cursor,
                isLoadingOlderMessages: false,
            }));
        } catch (error) {
            console.error('Không thể tải thêm tin nhắn', error);
            set({ isLoadingOlderMessages: false });
        }
    },

    sendMessage: async (message: string) => {
        const trimmed = message.trim();
        if (!trimmed) return;
        const state = get();
        if (state.isStreaming) return;

        const personalitySlug = state.selectedPersonalitySlug || DEFAULT_PERSONALITY_SLUG;

        const guestHistory: GuestMessageHistoryEntry[] | undefined =
            state.authMode === 'guest'
                ? state.messages
                      .filter((msg): msg is ChatMessage & { sender: 'user' | 'ai' } => msg.sender !== 'system')
                      .slice(-40)
                      .map((msg) => ({
                          sender: msg.sender,
                          content: msg.content,
                      }))
                : undefined;

        if (state.authMode === 'guest' && !personalitySlug) {
            throw new Error('Vui lòng chọn nhân cách cho cuộc trò chuyện.');
        }

        const tempId = `temp-${Date.now()}`;
        const now = new Date().toISOString();

        const service = state.sseService ?? new SSEService();
        if (!state.sseService) {
            set({ sseService: service });
        }

        set((current) => ({
            messages: [
                ...current.messages,
                {
                    id: tempId,
                    sender: 'user',
                    content: trimmed,
                    createdAt: now,
                },
            ],
            isStreaming: true,
            streamingMessage: '',
            pendingUserMessageTempId: tempId,
        }));

        let createdConversationId: string | null = null;
        let activeConversationId = state.selectedConversationId ?? null;

        service.onStreamStart = (event: SSEStartEvent) => {
            if (event.user_message_id) {
                set((current) => ({
                    messages: current.messages.map((msg) =>
                        msg.id === tempId ? { ...msg, id: event.user_message_id! } : msg
                    ),
                    pendingUserMessageTempId: null,
                }));
            }

            if (event.conversation_id) {
                activeConversationId = event.conversation_id;
                if (!state.selectedConversationId && state.authMode === 'authenticated') {
                    createdConversationId = event.conversation_id;
                    set({ selectedConversationId: event.conversation_id });
                }
            }
        };

        service.onStreamChunk = (event) => {
            set((current) => ({
                streamingMessage: `${current.streamingMessage}${event.content}`,
            }));
        };

        service.onStreamEnd = (event: SSEEndEvent) => {
            const aiMessageId = event.ai_message_id || `ai-${Date.now()}`;
            const content = event.content.trim();
            const timestamp = new Date().toISOString();
            set((current) => ({
                messages: [
                    ...current.messages,
                    {
                        id: aiMessageId,
                        sender: 'ai',
                        content,
                        createdAt: timestamp,
                    },
                ],
                isStreaming: false,
                streamingMessage: '',
            }));
            if (event.conversation_id) {
                activeConversationId = event.conversation_id;
            }
        };

        service.onStreamError = (errorMessage: string) => {
            set((current) => ({
                isStreaming: false,
                streamingMessage: '',
                messages: [
                    ...current.messages,
                    {
                        id: `error-${Date.now()}`,
                        sender: 'system',
                        content: `Lỗi: ${errorMessage}`,
                        createdAt: new Date().toISOString(),
                    },
                ],
            }));
        };

        await service.streamMessage({
            message: trimmed,
            personalitySlug,
            conversationId: state.selectedConversationId || undefined,
            messageHistory: guestHistory,
        });

        if (state.authMode === 'authenticated' && activeConversationId) {
            await get().refreshConversationMetadata(activeConversationId);
            if (createdConversationId) {
                await get().selectConversation(createdConversationId);
            }
        }
    },

    clearMessages: () => {
        set({ messages: [], streamingMessage: '', nextMessageCursor: null, hasMoreMessages: false });
    },

    deleteMessagesFromIndex: async (index: number) => {
        const state = get();
        if (index < 0 || index >= state.messages.length) return;

        if (state.authMode === 'guest') {
            set({ messages: state.messages.slice(0, index) });
            return;
        }

        const conversationId = state.selectedConversationId;
        if (!conversationId) return;

        const messagesToDelete = state.messages.slice(index);
        for (const message of messagesToDelete) {
            if (message.sender === 'system') continue;
            try {
                await apiFetch(`/api/conversations/${conversationId}/messages/${message.id}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Không thể xoá tin nhắn', error);
                break;
            }
        }

        set({ messages: state.messages.slice(0, index) });
        await get().refreshConversationMetadata(conversationId);
    },

    updateContextEditorValue: (value: string) => {
        set({ contextEditorValue: value });
    },

    updateContextOverride: async () => {
        const state = get();
        if (state.authMode !== 'authenticated') return;
        if (!state.conversationDetail || !state.selectedConversationId) return;

        try {
            const detail = await apiJson<ConversationDetail>(
                `/api/conversations/${state.selectedConversationId}/context`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ context: state.contextEditorValue }),
                }
            );
            set({
                conversationDetail: detail,
                contextEditorValue: detail.context_override ?? '',
                selectedPersonalitySlug: detail.personality_slug || DEFAULT_PERSONALITY_SLUG,
            });
            await get().refreshConversationMetadata(detail.id);
        } catch (error) {
            console.error('Không thể cập nhật context', error);
            throw error;
        }
    },

    updateConversationPersonality: async (personalitySlug: string) => {
        const state = get();
        if (state.authMode !== 'authenticated') {
            set({ selectedPersonalitySlug: personalitySlug });
            return;
        }

        if (!state.selectedConversationId) {
            set({ selectedPersonalitySlug: personalitySlug });
            return;
        }

        try {
            const detail = await apiJson<ConversationDetail>(
                `/api/conversations/${state.selectedConversationId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ personality_slug: personalitySlug }),
                }
            );
            set({
                conversationDetail: detail,
                contextEditorValue: detail.context_override ?? '',
                selectedPersonalitySlug: detail.personality_slug,
            });
            await get().refreshConversationMetadata(detail.id);
        } catch (error) {
            console.error('Không thể cập nhật personality', error);
            throw error;
        }
    },

    deleteConversation: async (conversationId: string) => {
        const state = get();
        if (state.authMode !== 'authenticated') return;
        try {
            await apiFetch(`/api/conversations/${conversationId}`, {
                method: 'DELETE',
            });
            const wasSelected = get().selectedConversationId === conversationId;
            set((current) => ({
                conversations: current.conversations.filter((item) => item.id !== conversationId),
                conversationDetail:
                    current.conversationDetail && current.conversationDetail.id === conversationId
                        ? null
                        : current.conversationDetail,
                conversationSkip: Math.max(0, current.conversationSkip - 1),
            }));
            if (wasSelected) {
                await get().selectConversation(null);
            }
        } catch (error) {
            console.error('Không thể xoá hội thoại', error);
            throw error;
        }
    },

    refreshConversationMetadata: async (conversationId: string) => {
        if (get().authMode !== 'authenticated') return;
        try {
            const detail = await apiJson<ConversationDetail>(`/api/conversations/${conversationId}`);
            set((state) => {
                const isActive = state.selectedConversationId === conversationId;
                return {
                    conversationDetail: isActive ? detail : state.conversationDetail,
                    selectedPersonalitySlug: isActive
                        ? detail.personality_slug || DEFAULT_PERSONALITY_SLUG
                        : state.selectedPersonalitySlug,
                    conversations: state.conversations
                        .filter((item) => item.id !== conversationId)
                        .concat(detailToSummary(detail))
                        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)),
                };
            });
        } catch (error) {
            console.error('Không thể đồng bộ hội thoại', error);
        }
    },

    resetAfterLogout: () => {
        get().sseService?.cancelStream();
        set({
            authMode: 'guest',
            conversations: [],
            hasMoreConversations: false,
            conversationSkip: 0,
            selectedConversationId: null,
            conversationDetail: null,
            contextEditorValue: '',
            messages: [],
            hasMoreMessages: false,
            nextMessageCursor: null,
            isStreaming: false,
            streamingMessage: '',
            selectedPersonalitySlug: DEFAULT_PERSONALITY_SLUG,
        });
    },
}));
