import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageComposerProps {
  onSend: (message: string) => Promise<void> | void;
  isStreaming: boolean;
}

export const MessageComposer = ({
  onSend,
  isStreaming,
}: MessageComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState('');

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const minHeight = 38;
    const maxHeight = 240;
    textarea.style.height = 'auto';
    const measured = textarea.scrollHeight || minHeight;
    const next = Math.min(Math.max(measured, minHeight), maxHeight);
    textarea.style.height = `${next}px`;
    textarea.style.overflowY = measured > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isStreaming) return;
    const trimmed = value.trim();
    if (!trimmed) return;

    const previousValue = value;
    setValue('');

    try {
      await onSend(trimmed);
    } catch {
      setValue(previousValue);
      requestAnimationFrame(() => {
        adjustTextareaHeight();
        textareaRef.current?.focus();
      });
    }
  }, [adjustTextareaHeight, isStreaming, onSend, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isDisabled = isStreaming || !value.trim();

  return (
    <footer className="border-t border-border/80 bg-background/80 px-4 py-4">
      <div className="flex items-end gap-3">
        <Textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Vui lòng chờ khi phản hồi hoàn thành!' : 'Nhập tin nhắn...'}
          disabled={isStreaming}
          className="field-sizing-content max-h-30 min-h-0 resize-none py-1.75"
        />
        <Button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isDisabled}
          className="h-12 w-12 shrink-0 rounded-full"
        >
          ➤
        </Button>
      </div>
    </footer>
  );
};
