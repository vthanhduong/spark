import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ContextEditorPanelProps {
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

export const ContextEditorPanel = ({ value, isSaving, onChange, onSave }: ContextEditorPanelProps) => {
  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-border bg-background/80 p-4">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-40 w-full resize-none text-sm"
        placeholder="Nhập context mới cho hội thoại"
      />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Lưu context'}
        </Button>
      </div>
    </div>
  );
};
