import { SidebarTrigger } from '@/components/ui/sidebar';
import type { PersonalityOption } from '../../constants/personalities';
import { Button } from '@/components/ui/button';

interface MessagePanelHeaderProps {
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  sessionUserEmail?: string | null;
  personalities: PersonalityOption[];
  activePersonalitySlug?: string | null;
  onPersonalityChange: (slug: string) => void;
  canEditContext: boolean;
  isContextEditorOpen: boolean;
  onToggleContextEditor: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const MessagePanelHeader = ({
  isAuthenticated,
  sessionUserEmail,
  // personalities,
  // activePersonalitySlug,
  // onPersonalityChange,
  canEditContext,
  isContextEditorOpen,
  onToggleContextEditor,
  onOpenSettings,
  onOpenLogin,
  onLogout,
}: MessagePanelHeaderProps) => {
  return (
  <header className="border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 hidd">
          <SidebarTrigger />
          {/* <div className="hidden">
            <label className="items-center gap-2 text-sm text-muted-foreground lg:flex">
              <span>Nhân cách</span>
              <select
                value={activePersonalitySlug ?? ''}
                onChange={(event) => onPersonalityChange(event.target.value)}
                className="h-9 min-w-[180px] rounded-full border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Chọn nhân cách
                </option>
                {personalities.map((personality) => (
                  <option key={personality.slug} value={personality.slug}>
                    {personality.name}
                  </option>
                ))}
              </select>
            </label>
          </div> */}
          {canEditContext && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleContextEditor}
            >
              {isContextEditorOpen ? 'Ẩn context' : 'Chỉnh sửa context'}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs text-muted-foreground/80">
            {isAuthenticated
              ? `Đã đăng nhập${sessionUserEmail ? `: ${sessionUserEmail}` : ''}`
              : 'Chế độ khách'}
          </span>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onOpenSettings}>
                Tùy chỉnh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-500/90"
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={onOpenLogin}
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
