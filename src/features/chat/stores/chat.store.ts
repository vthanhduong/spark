import { create } from 'zustand';
import type { IMessage } from '../types/message.type';
import { WebSocketService } from '../services/websocket.service';

interface ChatStore {
    username: string;
    messages: IMessage[];
    context: string;
    personality: string;
    status: string;
    input: string;
    isConnected: boolean;
    isStreaming: boolean;
    streamingMessage: string;
    webSocketService: WebSocketService | null;
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
    setIsConnected: (connected: boolean) => void;
    setIsStreaming: (streaming: boolean) => void;
    connectWebSocket: () => Promise<void>;
    disconnectWebSocket: () => void;
    sendMessage: (message: string, context: string) => void;
    setCollapsed: () => void;
}
export const useChatStore = create<ChatStore>((set, get) => ({
    username: '',
    messages: [],
    context: '',
    personality: 'markiai', // Default personality
    status: 'offline',
    input: '',
    isConnected: false,
    isStreaming: false,
    streamingMessage: '',
    webSocketService: null,
    collapsed: true,
    secret: false,
    setSecret: (secret: boolean) => set({ secret }),
    setUsername: (username: string) => set({ username }),
    addMessage: (message: IMessage) => set((state) => ({ messages: [...state.messages, message] })),
    setContext: (context) => set({ context }),
    setPersonality: (personality) => set({ personality }),
    updateStreamingMessage: (content: string) => set({ streamingMessage: content }),
    finishStreaming: (finalContent: string) => {
        const newMessage: IMessage = {
            id: `ai_${Date.now()}`,
            content: finalContent,
            sender: 'ai',
            timestamp: new Date()
        };
        set((state) => ({ 
            messages: [...state.messages, newMessage],
            isStreaming: false,
            streamingMessage: ''
        }));
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
    setIsConnected: (connected) => set({ isConnected: connected }),
    setIsStreaming: (streaming) => set({ isStreaming: streaming }),
    
    connectWebSocket: async () => {
        const state = get();
        // Prevent multiple connections
        if (state.webSocketService || state.isConnected) {
            return;
        }
        const wsService = new WebSocketService();
            
            // Set up event handlers
            wsService.onMessageReceived = (message) => {
            };
            
            wsService.onAIResponseStart = () => {
                set({ isStreaming: true, streamingMessage: '' });
            };
            
            wsService.onAIResponseChunk = (_, fullMessage) => {
                set({ streamingMessage: fullMessage });
            };
            
            wsService.onAIResponseEnd = (fullResponse) => {
                const finishStreaming = get().finishStreaming;
                finishStreaming(fullResponse);
            };
            
            wsService.onError = (error) => {
                set({ status: 'error' });
            };
            
            try {
                await wsService.connect();
                set({ webSocketService: wsService, isConnected: true, status: 'connected' });
            } catch (error) {
                set({ status: 'error' });
            }
    },
    
    disconnectWebSocket: () => {
        const state = get();
        if (state.webSocketService) {
            state.webSocketService.disconnect();
            set({ webSocketService: null, isConnected: false, status: 'offline' });
        }
    },
    
    sendMessage: (message: string, context?: string) => {
        const state = get();
        if (state.webSocketService && state.isConnected && state.username) {
            // Add user message immediately
            const userMessage: IMessage = {
                id: `user_${Date.now()}`,
                content: message,
                sender: 'you',
                timestamp: new Date()
            };
            
            const addMessage = get().addMessage;
            addMessage(userMessage);
            
            // Send to WebSocket with context
            state.webSocketService.sendMessage(state.username, message, state.messages, context || state.context);
            
            // Clear input
            set({ input: '' });
        }
    },
    setCollapsed: () => set({ collapsed: !get().collapsed })
}));