import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SettingsDialogProps {
  open: boolean;
  username: string;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onUsernameChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export const SettingsDialog = ({
  open,
  username,
  error,
  onOpenChange,
  onUsernameChange,
  onSubmit,
}: SettingsDialogProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(username);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tùy chỉnh tài khoản</DialogTitle>
          <DialogDescription>Cập nhật tên hiển thị khi trò chuyện.</DialogDescription>
        </DialogHeader>
        <form className="mt-2 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="settings-username" className="text-sm text-muted-foreground">
              Tên hiển thị
            </label>
            <Input
              id="settings-username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="Nhập tên mới của bạn"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
