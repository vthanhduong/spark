import { env } from '../../../configs/environment';
import type { IMessage } from '../types/message.type';

export interface WebSocketMessage {
    type: 'message_received' | 'ai_response_start' | 'ai_response_chunk' | 'ai_response_end' | 'error';
    username?: string;
    message?: string;
    chunk?: string;
    full_response?: string;
    timestamp?: string;
    is_final?: boolean;
}

export class WebSocketService {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private messageQueue: string[] = [];
    private currentStreamingMessage: string = '';

    constructor(url?: string) {
        // Use provided URL, environment variable, or fallback to production URL
        // this.url = url || import.meta.env.VITE_WS_URL || 'wss://api.marki.nytx.io.vn/ws/chat';
        this.url = env.SOCKET_URL || url || '';
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.url);

                this.socket.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.processMessageQueue();
                    resolve();
                };

                this.socket.onclose = () => {
                    this.handleReconnect();
                };

                this.socket.onerror = (error) => {
                    reject(error);
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private handleMessage(data: string) {
        try {
            const message: WebSocketMessage = JSON.parse(data);
            
            switch (message.type) {
                case 'message_received':
                    this.onMessageReceived?.(message);
                    break;
                case 'ai_response_start':
                    this.currentStreamingMessage = '';
                    this.onAIResponseStart?.(message);
                    break;
                case 'ai_response_chunk':
                    this.currentStreamingMessage += message.chunk || '';
                    this.onAIResponseChunk?.(message.chunk || '', this.currentStreamingMessage);
                    break;
                case 'ai_response_end':
                    this.onAIResponseEnd?.(message.full_response || this.currentStreamingMessage);
                    this.currentStreamingMessage = '';
                    break;
                case 'error':
                    this.onError?.(message.message || 'Unknown error');
                    break;
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    sendMessage(username: string, message: string, messageHistory: IMessage[], context: string) {
        const payload = {
            username,
            message,
            context,
            message_history: messageHistory
        };

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(payload));
        } else {
            this.messageQueue.push(JSON.stringify(payload));
            if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                this.connect().catch(console.error);
            }
        }
    }

    private processMessageQueue() {
        while (this.messageQueue.length > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = this.messageQueue.shift();
            if (message) {
                this.socket.send(message);
            }
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    // Event handlers - set these from outside
    onMessageReceived?: (message: WebSocketMessage) => void;
    onAIResponseStart?: (message: WebSocketMessage) => void;
    onAIResponseChunk?: (chunk: string, fullMessage: string) => void;
    onAIResponseEnd?: (fullResponse: string) => void;
    onError?: (error: string) => void;
}
