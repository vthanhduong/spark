import { env } from '../../../configs/environment';

export interface GuestMessageHistoryEntry {
    sender: 'user' | 'ai';
    content: string;
}

export interface StreamOptions {
    message: string;
    personalitySlug?: string;
    conversationId?: string;
    messageHistory?: GuestMessageHistoryEntry[];
}

export interface SSEStartEvent {
    type: 'start';
    conversation_id?: string;
    user_message_id?: string;
}

export interface SSEChunkEvent {
    type: 'chunk';
    conversation_id?: string;
    content: string;
}

export interface SSEEndEvent {
    type: 'end';
    conversation_id?: string;
    content: string;
    ai_message_id?: string;
}

export interface SSEErrorEvent {
    type: 'error';
    message: string;
}

type SSEPayload = SSEStartEvent | SSEChunkEvent | SSEEndEvent | SSEErrorEvent;

export class SSEService {
    private abortController: AbortController | null = null;
    private apiUrl: string;

    constructor() {
        this.apiUrl = env.API_URL || 'http://localhost:8000';
    }

    async streamMessage(options: StreamOptions): Promise<void> {
        const { message, personalitySlug, conversationId, messageHistory } = options;

        this.cancelStream();
        this.abortController = new AbortController();

        const payload: Record<string, unknown> = { message };
        if (personalitySlug) payload.personality_slug = personalitySlug;
        if (conversationId) payload.conversation_id = conversationId;

        try {
            const response = await fetch(`${this.apiUrl}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...payload,
                    ...(messageHistory && messageHistory.length > 0
                        ? { message_history: messageHistory }
                        : {}),
                }),
                signal: this.abortController.signal,
                credentials: 'include',
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
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const rawEvent of events) {
                    const eventMatch = rawEvent.match(/event: (\w+)\n(?:data: (.+))/s);
                    if (!eventMatch) continue;

                    const [, eventType, data] = eventMatch;
                    try {
                        const parsed: SSEPayload = JSON.parse(data);
                        switch (eventType) {
                            case 'start':
                                this.onStreamStart?.(parsed as SSEStartEvent);
                                break;
                            case 'chunk':
                                this.onStreamChunk?.(parsed as SSEChunkEvent);
                                break;
                            case 'end':
                                this.onStreamEnd?.(parsed as SSEEndEvent);
                                break;
                            case 'error':
                                this.onStreamError?.((parsed as SSEErrorEvent).message);
                                break;
                            default:
                                break;
                        }
                    } catch (error) {
                        console.error('Failed to parse SSE payload', error);
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

    cancelStream() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    isStreaming(): boolean {
        return this.abortController !== null;
    }

    onStreamStart?: (event: SSEStartEvent) => void;
    onStreamChunk?: (event: SSEChunkEvent) => void;
    onStreamEnd?: (event: SSEEndEvent) => void;
    onStreamError?: (message: string) => void;
}
