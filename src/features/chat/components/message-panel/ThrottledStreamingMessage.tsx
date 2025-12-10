import { memo, useMemo } from 'react';
import { LLMMessageRenderer } from './LLMMessageRenderer';
import { useThrottle } from '@/hooks/use-throttle';

interface ThrottledStreamingMessageProps {
  content: string;
  isStreaming: boolean;
}

/**
 * ThrottledStreamingMessage component that throttles updates
 * to reduce re-render frequency during AI streaming
 */
const ThrottledStreamingMessageComponent = ({ 
  content, 
  isStreaming 
}: ThrottledStreamingMessageProps) => {
  // Throttle content updates during streaming (100ms)
  // When not streaming, show immediately
  const throttledContent = useThrottle(content, isStreaming ? 100 : 0);
  
  // Use the latest content if not streaming, otherwise use throttled
  const displayContent = useMemo(() => {
    return isStreaming ? throttledContent : content;
  }, [content, isStreaming, throttledContent]);

  return <LLMMessageRenderer content={displayContent} isStreaming={isStreaming} />;
};

export const ThrottledStreamingMessage = memo(ThrottledStreamingMessageComponent);

ThrottledStreamingMessage.displayName = 'ThrottledStreamingMessage';
