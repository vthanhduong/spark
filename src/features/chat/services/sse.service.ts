import { env } from '../../../configs/environment';
import type { IMessage } from '../types/message.type';

export interface SSEEvent {
    type: 'start' | 'chunk' | 'end' | 'error';
    content?: string;
    username?: string;
    message?: string;
    is_final?: boolean;
}

export class SSEService {
    private abortController: AbortController | null = null;
    private apiUrl: string;

    constructor() {
        this.apiUrl = env.API_URL || 'http://localhost:8000';
    }

    /**
     * Send a message and stream the response using SSE
     */
    async streamMessage(
        message: string,
        context: string,
        username: string,
        messageHistory: IMessage[]
    ): Promise<void> {
        // Cancel any existing stream
        this.cancelStream();

        // Create new AbortController for this request
        this.abortController = new AbortController();

        try {
            const response = await fetch(`${this.apiUrl}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    context,
                    username,
                    message_history: messageHistory
                }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No reader available');
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                
                // Keep the last incomplete line in buffer
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        const eventMatch = line.match(/event: (\w+)\ndata: (.+)/s);
                        if (eventMatch) {
                            const [, eventType, data] = eventMatch;
                            const parsedData: SSEEvent = JSON.parse(data);
                            
                            switch (eventType) {
                                case 'start':
                                    this.onStreamStart?.(parsedData);
                                    break;
                                case 'chunk':
                                    this.onStreamChunk?.(parsedData.content || '');
                                    break;
                                case 'end':
                                    this.onStreamEnd?.(parsedData.content || '');
                                    break;
                                case 'error':
                                    this.onStreamError?.(parsedData.message || 'Unknown error');
                                    break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    console.log('Stream cancelled');
                } else {
                    console.error('Stream error:', error);
                    this.onStreamError?.(error.message);
                }
            }
        }
    }

    /**
     * Cancel the current stream
     */
    cancelStream() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Check if currently streaming
     */
    isStreaming(): boolean {
        return this.abortController !== null;
    }

    // Event handlers - set these from outside
    onStreamStart?: (event: SSEEvent) => void;
    onStreamChunk?: (chunk: string) => void;
    onStreamEnd?: (fullResponse: string) => void;
    onStreamError?: (error: string) => void;
}
