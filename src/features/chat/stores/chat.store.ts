import { create } from 'zustand';
import type { IMessage } from '../types/message.type';
import { SSEService } from '../services/sse.service';

interface ChatStore {
    username: string;
    messages: IMessage[];
    context: string;
    personality: string;
    status: string;
    input: string;
    isStreaming: boolean;
    streamingMessage: string;
    sseService: SSEService | null;
    collapsed: boolean;
    secret: boolean;
    setSecret: (secret: boolean) => void;
    setUsername: (username: string) => void;
    addMessage: (message: IMessage) => void;
    setContext: (context: string) => void;
    setPersonality: (personality: string) => void;
    updateStreamingMessage: (content: string) => void;
    finishStreaming: (finalContent: string) => void;
    deleteMessage: (index: number) => void;
    removeMessagesFromIndex: (index: number) => void;
    clearMessages: () => void;
    setStatus: (status: string) => void;
    setInput: (input: string) => void;
    setIsStreaming: (streaming: boolean) => void;
    sendMessageSSE: (message: string, context?: string) => Promise<void>;
    setCollapsed: () => void;
    loadMessagesFromStorage: () => void;
    clearAllSecretData: () => void;
}
export const useChatStore = create<ChatStore>((set, get) => ({
    username: '',
    messages: [],
    context: '',
    personality: 'markiai', // Default personality
    status: 'connected',
    input: '',
    isStreaming: false,
    streamingMessage: '',
    sseService: null,
    collapsed: true,
    secret: false,
    setSecret: (secret: boolean) => {
        set({ secret });
        // No localStorage operations - just set the flag
    },
    setUsername: (username: string) => set({ username }),
    addMessage: (message: IMessage) => set((state) => {
        const newMessages = [...state.messages, message];
        return { messages: newMessages };
    }),
    setContext: (context) => {
        set({ context });
    },
    setPersonality: (personality) => set({ personality }),
    updateStreamingMessage: (content: string) => set({ streamingMessage: content }),
    finishStreaming: (finalContent: string) => {
        const newMessage: IMessage = {
            id: `ai_${Date.now()}`,
            content: finalContent,
            sender: 'ai',
            timestamp: new Date()
        };
        set((state) => {
            const newMessages = [...state.messages, newMessage];
            return { 
                messages: newMessages,
                isStreaming: false,
                streamingMessage: ''
            };
        });
    },
    deleteMessage: (index) => set((state) => {
        const newMessages = [...state.messages];
        newMessages.splice(index, 1);
        return { messages: newMessages };
    }),
    removeMessagesFromIndex: (index) => set((state) => {
        const newMessages = state.messages.slice(0, index);
        return { messages: newMessages };
    }),
    clearMessages: () => set({ messages: [] }),
    setStatus: (status) => set({ status }),
    setInput: (input) => set({ input }),
    setIsStreaming: (streaming) => set({ isStreaming: streaming }),
    
    loadMessagesFromStorage: () => {
        // No localStorage operations - do nothing
    },
    
    setCollapsed: () => set({ collapsed: !get().collapsed }),
    
    clearAllSecretData: () => {
        // No localStorage operations - do nothing
    },
    
    sendMessageSSE: async (message: string, contextOverride?: string) => {
        const state = get();
        
        if (!state.username) {
            console.error('Username is required');
            return;
        }
        
        // Add user message immediately
        const userMessage: IMessage = {
            id: `user_${Date.now()}`,
            content: message,
            sender: 'you',
            timestamp: new Date()
        };
        
        const addMessage = get().addMessage;
        addMessage(userMessage);
        
        // Initialize SSE service if not exists
        let sseService = state.sseService;
        if (!sseService) {
            sseService = new SSEService();
            set({ sseService });
        }
        
        // Set up event handlers - direct updates without throttling
        let fullResponse = '';
        
        sseService.onStreamStart = () => {
            set({ isStreaming: true, streamingMessage: '' });
            fullResponse = '';
        };
        
        sseService.onStreamChunk = (chunk: string) => {
            fullResponse += chunk;
            set({ streamingMessage: fullResponse });
        };
        
        sseService.onStreamEnd = (finalContent: string) => {
            // Final update with complete content
            const finishStreaming = get().finishStreaming;
            finishStreaming(finalContent || fullResponse);
            fullResponse = '';
        };
        
        sseService.onStreamError = (error: string) => {
            console.error('SSE error:', error);
            
            set({ isStreaming: false, streamingMessage: '' });
            
            // Add error message
            const errorMessage: IMessage = {
                id: `error_${Date.now()}`,
                content: `Error: ${error}`,
                sender: 'ai',
                timestamp: new Date()
            };
            addMessage(errorMessage);
        };
        
        // Send message via SSE
        const contextToUse = contextOverride || state.context;
        await sseService.streamMessage(message, contextToUse, state.username, state.messages);
        
        // Clear input
        set({ input: '' });
    }
}));