import { useChatStore } from '../stores/chat.store';

/**
 * Optional component to toggle between SSE and WebSocket
 * Add this to Chat.tsx or MessagePanel.tsx if you want to give users the option
 */
export const ConnectionToggle = () => {
    const { useSSE, setUseSSE, status } = useChatStore();

    return (
        <div className="flex items-center gap-2 p-2">
            <span className="text-sm text-gray-300">Connection Mode:</span>
            <button
                onClick={() => setUseSSE(!useSSE)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    useSSE 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'bg-gray-600 text-gray-200 hover:bg-gray-700'
                }`}
                title="Switch between SSE and WebSocket"
            >
                {useSSE ? '🌊 SSE' : '🔌 WebSocket'}
            </button>
            <span className={`text-xs ${
                status === 'connected' ? 'text-green-400' : 'text-red-400'
            }`}>
                {status}
            </span>
        </div>
    );
};

/**
 * Usage in Chat.tsx or MessagePanel.tsx:
 * 
 * import { ConnectionToggle } from './components/ConnectionToggle';
 * 
 * // Add to your JSX:
 * <ConnectionToggle />
 */
