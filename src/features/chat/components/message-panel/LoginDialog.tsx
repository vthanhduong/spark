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

interface LoginDialogProps {
  open: boolean;
  email: string;
  password: string;
  isLoading: boolean;
  hasAttempt: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (email: string, password: string) => void;
}

export const LoginDialog = ({
  open,
  email,
  password,
  isLoading,
  hasAttempt,
  error,
  onOpenChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginDialogProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(email, password);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng nhập vào Spark</DialogTitle>
          <DialogDescription>
            Hãy đăng nhập để lưu trữ hội thoại và đồng bộ giữa các thiết bị.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-2 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm text-muted-foreground">
              Mật khẩu
            </label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
            />
          </div>
          {hasAttempt && error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
