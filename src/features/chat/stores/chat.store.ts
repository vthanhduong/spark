import { create } from 'zustand';
import type { IMessage } from '../types/message.type';
import { WebSocketService } from '../services/websocket.service';

const SECRET_MESSAGES_KEY = 'secret_chat_messages';
const SECRET_USERNAME_KEY = 'secret_chat_username';
const SECRET_CONTEXT_KEY = 'secret_chat_context';

// Helper functions for localStorage
const saveMessagesToLocalStorage = (messages: IMessage[]) => {
    try {
        localStorage.setItem(SECRET_MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('Failed to save messages to localStorage:', error);
    }
};

const loadMessagesFromLocalStorage = (): IMessage[] => {
    try {
        const saved = localStorage.getItem(SECRET_MESSAGES_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Failed to load messages from localStorage:', error);
    }
    return [];
};

const clearMessagesFromLocalStorage = () => {
    try {
        localStorage.removeItem(SECRET_MESSAGES_KEY);
    } catch (error) {
        console.error('Failed to clear messages from localStorage:', error);
    }
};

const saveUsernameToLocalStorage = (username: string) => {
    try {
        localStorage.setItem(SECRET_USERNAME_KEY, username);
    } catch (error) {
        console.error('Failed to save username to localStorage:', error);
    }
};

const loadUsernameFromLocalStorage = (): string | null => {
    try {
        return localStorage.getItem(SECRET_USERNAME_KEY);
    } catch (error) {
        console.error('Failed to load username from localStorage:', error);
        return null;
    }
};

const saveContextToLocalStorage = (context: string) => {
    try {
        localStorage.setItem(SECRET_CONTEXT_KEY, context);
    } catch (error) {
        console.error('Failed to save context to localStorage:', error);
    }
};

const loadContextFromLocalStorage = (): string | null => {
    try {
        return localStorage.getItem(SECRET_CONTEXT_KEY);
    } catch (error) {
        console.error('Failed to load context from localStorage:', error);
        return null;
    }
};

const clearAllSecretDataFromLocalStorage = () => {
    try {
        localStorage.removeItem(SECRET_MESSAGES_KEY);
        localStorage.removeItem(SECRET_USERNAME_KEY);
        localStorage.removeItem(SECRET_CONTEXT_KEY);
    } catch (error) {
        console.error('Failed to clear secret data from localStorage:', error);
    }
};

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
    loadMessagesFromStorage: () => void;
    clearAllSecretData: () => void;
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
    setSecret: (secret: boolean) => {
        set({ secret });
        // If entering secret mode, load saved data
        if (secret) {
            const savedMessages = loadMessagesFromLocalStorage();
            const savedUsername = loadUsernameFromLocalStorage();
            const savedContext = loadContextFromLocalStorage();
            
            const updates: Partial<ChatStore> = {};
            
            if (savedMessages.length > 0) {
                updates.messages = savedMessages;
            }
            
            if (savedUsername) {
                updates.username = savedUsername;
            }
            
            if (savedContext) {
                updates.context = savedContext;
            }
            
            if (Object.keys(updates).length > 0) {
                set(updates);
            }
        }
    },
    setUsername: (username: string) => set((state) => {
        // Save to localStorage only in secret mode
        if (state.secret) {
            saveUsernameToLocalStorage(username);
        }
        return { username };
    }),
    addMessage: (message: IMessage) => set((state) => {
        const newMessages = [...state.messages, message];
        // Save to localStorage only in secret mode
        if (state.secret) {
            saveMessagesToLocalStorage(newMessages);
        }
        return { messages: newMessages };
    }),
    setContext: (context) => {
        set({ context });
        // Save to localStorage after setting, check current secret state
        const currentState = get();
        if (currentState.secret) {
            saveContextToLocalStorage(context);
        }
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
            // Save to localStorage only in secret mode
            if (state.secret) {
                saveMessagesToLocalStorage(newMessages);
            }
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
        // Update localStorage only in secret mode
        if (state.secret) {
            saveMessagesToLocalStorage(newMessages);
        }
        return { messages: newMessages };
    }),
    removeMessagesFromIndex: (index) => set((state) => {
        const newMessages = state.messages.slice(0, index);
        // Update localStorage only in secret mode
        if (state.secret) {
            saveMessagesToLocalStorage(newMessages);
        }
        return { messages: newMessages };
    }),
    clearMessages: () => set((state) => {
        // Clear from localStorage only in secret mode
        if (state.secret) {
            clearMessagesFromLocalStorage();
        }
        return { messages: [] };
    }),
    setStatus: (status) => set({ status }),
    setInput: (input) => set({ input }),
    setIsConnected: (connected) => set({ isConnected: connected }),
    setIsStreaming: (streaming) => set({ isStreaming: streaming }),
    
    loadMessagesFromStorage: () => {
        const state = get();
        if (state.secret) {
            const savedMessages = loadMessagesFromLocalStorage();
            const savedUsername = loadUsernameFromLocalStorage();
            const savedContext = loadContextFromLocalStorage();
            
            const updates: Partial<ChatStore> = { messages: savedMessages };
            
            if (savedUsername) {
                updates.username = savedUsername;
            }
            
            if (savedContext) {
                updates.context = savedContext;
            }
            
            set(updates);
        }
    },
    
    connectWebSocket: async () => {
        const state = get();
        // Prevent multiple connections
        if (state.webSocketService || state.isConnected) {
            return;
        }
        const wsService = new WebSocketService();
            
            // Set up event handlers
            wsService.onMessageReceived = (message) => {
                console.log(message);
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
                console.error(error);
            };
            
            try {
                await wsService.connect();
                set({ webSocketService: wsService, isConnected: true, status: 'connected' });
            } catch (error) {
                set({ status: 'error' });
                console.error(error);
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
    setCollapsed: () => set({ collapsed: !get().collapsed }),
    
    clearAllSecretData: () => {
        const state = get();
        if (state.secret) {
            clearAllSecretDataFromLocalStorage();
        }
    }
}));