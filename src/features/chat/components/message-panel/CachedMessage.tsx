import { memo, useMemo } from 'react';
import { LLMMessageRenderer } from './LLMMessageRenderer';

interface CachedMessageProps {
  messageId: string;
  content: string;
  isStreaming: boolean;
}

/**
 * CachedMessage component that memoizes the rendered output
 * to prevent re-parsing and re-rendering when parent re-renders
 */
const CachedMessageComponent = ({ content, isStreaming }: CachedMessageProps) => {
  // Memoize the rendered message based on content and streaming state
  const renderedContent = useMemo(() => {
    return <LLMMessageRenderer content={content} isStreaming={isStreaming} />;
  }, [content, isStreaming]);

  return renderedContent;
};

// Memo the entire component to prevent re-renders when props don't change
export const CachedMessage = memo(
  CachedMessageComponent,
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.messageId === nextProps.messageId &&
      prevProps.content === nextProps.content &&
      prevProps.isStreaming === nextProps.isStreaming
    );
  }
);

CachedMessage.displayName = 'CachedMessage';
