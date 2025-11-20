import { useCallback, type KeyboardEvent, type RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const MessageComposer = ({
  value,
  onChange,
  onSend,
  isStreaming,
  textareaRef,
  onKeyDown,
}: MessageComposerProps) => {
  const handleSubmit = useCallback(() => {
    if (isStreaming) return;
    onSend();
  }, [isStreaming, onSend]);

  const isDisabled = isStreaming || !value.trim();

  return (
    <footer className="border-t border-border/80 bg-background/80 px-4 py-4">
      <div className="flex items-end gap-3">
        <Textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isStreaming ? 'Vui lòng chờ khi phản hồi hoàn thành!' : 'Nhập tin nhắn...'}
          disabled={isStreaming}
          className="min-h-12 flex-1 resize-none rounded-full break-all"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled}
          className="h-12 w-12 shrink-0 rounded-full"
        >
          ➤
        </Button>
      </div>
    </footer>
  );
};
