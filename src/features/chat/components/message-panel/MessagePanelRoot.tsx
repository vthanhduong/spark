import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ApiError } from '@/lib/api';
import { useChatStore } from '../../stores/chat.store';
import { useSessionStore } from '../../../auth/stores/session.store';
import { ContextEditorPanel } from './ContextEditorPanel';
import { LoginDialog } from './LoginDialog';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';
import { MessagePanelHeader } from './MessagePanelHeader';
import { SettingsDialog } from './SettingsDialog';

const SCROLL_BOTTOM_THRESHOLD = 150;

export const MessagePanel = () => {
  const authMode = useChatStore((state) => state.authMode);
  const personalities = useChatStore((state) => state.personalities);
  const selectedPersonalitySlug = useChatStore((state) => state.selectedPersonalitySlug);
  const setSelectedPersonalitySlug = useChatStore((state) => state.setSelectedPersonalitySlug);
  const conversationDetail = useChatStore((state) => state.conversationDetail);
  const messages = useChatStore((state) => state.messages);
  const streamingMessage = useChatStore((state) => state.streamingMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const deleteMessagesFromIndex = useChatStore((state) => state.deleteMessagesFromIndex);
  const loadOlderMessages = useChatStore((state) => state.loadOlderMessages);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const isLoadingOlderMessages = useChatStore((state) => state.isLoadingOlderMessages);
  const contextEditorValue = useChatStore((state) => state.contextEditorValue);
  const updateContextEditorValue = useChatStore((state) => state.updateContextEditorValue);
  const updateContextOverride = useChatStore((state) => state.updateContextOverride);
  const updateConversationPersonality = useChatStore((state) => state.updateConversationPersonality);
  const setAuthMode = useChatStore((state) => state.setAuthMode);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const sessionUser = useSessionStore((state) => state.user);
  const sessionStatus = useSessionStore((state) => state.status);
  const sessionError = useSessionStore((state) => state.error);
  const login = useSessionStore((state) => state.login);
  const logout = useSessionStore((state) => state.logout);
  const fetchSession = useSessionStore((state) => state.fetchSession);

  const userRole = sessionUser?.role;

  const [inputValue, setInputValue] = useState('');
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [hasLoginAttempt, setHasLoginAttempt] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isAuthenticated = sessionStatus === 'authenticated';
  const isSessionLoading = sessionStatus === 'loading';
  const loginErrorMessage = sessionError;

  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    if (sessionStatus === 'idle') {
      fetchSession().catch(() => undefined);
    }
  }, [sessionStatus, fetchSession]);

  useEffect(() => {
    if (isAuthenticated && sessionUser) {
      if (authMode !== 'authenticated') {
        setAuthMode('authenticated');
        clearMessages();
        void selectConversation(null);
      }
    } else if (sessionStatus === 'unauthenticated' && authMode !== 'guest') {
      setAuthMode('guest');
      clearMessages();
      void selectConversation(null);
    }
  }, [authMode, isAuthenticated, sessionStatus, sessionUser, setAuthMode, clearMessages, selectConversation]);

  useEffect(() => {
    if (sessionUser?.email) {
      setLoginEmail(sessionUser.email);
    }
  }, [sessionUser?.email]);

  useEffect(() => {
    if (isSettingsDialogOpen) {
      setSettingsUsername(sessionUser?.display_name ?? '');
      setSettingsError(null);
    }
  }, [isSettingsDialogOpen, sessionUser?.display_name]);

  const activePersonalitySlug = useMemo(() => {
    if (conversationDetail) {
      return conversationDetail.personality_slug;
    }
    return selectedPersonalitySlug;
  }, [conversationDetail, selectedPersonalitySlug]);

  const adjustTextareaHeight = (element?: HTMLTextAreaElement | null) => {
    const textarea = element ?? textareaRef.current;
    if (!textarea) return;
    const minHeight = 38;
    const maxHeight = 240;
    textarea.style.height = 'auto';
    const measured = textarea.scrollHeight || minHeight;
    const next = Math.min(Math.max(measured, minHeight), maxHeight);
    textarea.style.height = `${next}px`;
    textarea.style.overflowY = measured > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    if (shouldStickToBottomRef.current) {
      container.scrollTo({ top: container.scrollHeight });
    }
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    } else {
      shouldStickToBottomRef.current = true;
    }
  }, [isStreaming]);

  const handleSend = async () => {
    if (isStreaming) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setInputValue('');
    adjustTextareaHeight(textareaRef.current);

    try {
      await sendMessage(trimmed);
    } catch (error) {
      console.error('Không thể gửi tin nhắn', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setInputValue(trimmed);
      adjustTextareaHeight(textareaRef.current);
    }
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isStreaming) {
        void handleSend();
      }
    }
  };

  const handleScroll = async (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_BOTTOM_THRESHOLD;
    shouldStickToBottomRef.current = nearBottom;

    if (target.scrollTop <= 0 && hasMoreMessages && !isLoadingOlderMessages) {
      const previousHeight = target.scrollHeight;
      await loadOlderMessages();
      requestAnimationFrame(() => {
        const container = messageContainerRef.current;
        if (!container) return;
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - previousHeight;
      });
    }
  };

  const handlePersonalityChange = (value: string) => {
    if (conversationDetail && authMode === 'authenticated') {
      if (value !== conversationDetail.personality_slug) {
        updateConversationPersonality(value).catch((error) => {
          console.error('Không thể thay đổi personality', error);
          toast.error('Không thể thay đổi nhân cách.');
        });
      }
    } else {
      setSelectedPersonalitySlug(value);
    }
  };

  const handleOpenLogin = () => {
    setLoginEmail((prev) => prev || sessionUser?.email || '');
    setLoginPassword('');
    setHasLoginAttempt(false);
    setIsLoginDialogOpen(true);
  };

  const handleLoginSubmit = async (email: string, password: string) => {
    if (!email.trim() || !password) {
      return;
    }
    try {
      setHasLoginAttempt(true);
      await login(email.trim(), password);
      setIsLoginDialogOpen(false);
      setLoginPassword('');
      setHasLoginAttempt(false);
    } catch (error) {
      console.error('Không thể đăng nhập', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Không thể đăng xuất', error);
      toast.error('Không thể đăng xuất.');
    }
  };

  const updateDisplayName = useSessionStore((state) => state.updateDisplayName);

  const handleSaveSettings = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSettingsError('Tên hiển thị không được để trống.');
      return;
    }
    try {
      await updateDisplayName(trimmed);
      setIsSettingsDialogOpen(false);
      setSettingsError(null);
      toast.success('Đã cập nhật tên hiển thị.');
    } catch (error) {
      console.error('Không thể cập nhật tên hiển thị', error);
      if (error instanceof ApiError) {
        setSettingsError(
          typeof error.data === 'string' ? error.data : 'Không thể cập nhật tên hiển thị.'
        );
      } else {
        setSettingsError('Không thể cập nhật tên hiển thị.');
      }
    }
  };

  const handleSaveContext = async () => {
    if (isSavingContext) return;
    setIsSavingContext(true);
    try {
      await updateContextOverride();
      toast.success('Đã lưu context thành công.');
    } catch (error) {
      console.error('Không thể lưu context', error);
      toast.error('Không thể lưu context.');
    } finally {
      setIsSavingContext(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background/60 text-foreground">
      <MessagePanelHeader
        isAuthenticated={isAuthenticated}
        isSessionLoading={isSessionLoading}
        sessionUserEmail={sessionUser?.email}
        personalities={personalities}
        activePersonalitySlug={activePersonalitySlug}
        onPersonalityChange={handlePersonalityChange}
        canEditContext={Boolean(conversationDetail && userRole === 'quest_expert')}
        isContextEditorOpen={showContextEditor}
        onToggleContextEditor={() => setShowContextEditor((prev) => !prev)}
        onOpenSettings={() => setIsSettingsDialogOpen(true)}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      {showContextEditor && conversationDetail && userRole === 'quest_expert' && (
        <div className="px-4">
          <ContextEditorPanel
            value={contextEditorValue}
            isSaving={isSavingContext}
            onChange={updateContextEditorValue}
            onSave={handleSaveContext}
          />
        </div>
      )}

      <MessageList
        messages={messages}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
        containerRef={messageContainerRef}
        onScroll={handleScroll}
        onDeleteFromIndex={deleteMessagesFromIndex}
        isLoadingOlderMessages={isLoadingOlderMessages}
      />

      <MessageComposer
        value={inputValue}
        onChange={(value) => {
          setInputValue(value);
          adjustTextareaHeight(textareaRef.current);
        }}
        onSend={handleSend}
        isStreaming={isStreaming}
        textareaRef={textareaRef}
        onKeyDown={handleTextareaKeyDown}
      />

      <SettingsDialog
        open={isSettingsDialogOpen}
        username={settingsUsername}
        error={settingsError}
        onOpenChange={setIsSettingsDialogOpen}
        onUsernameChange={(value) => {
          setSettingsUsername(value);
          if (settingsError) {
            setSettingsError(null);
          }
        }}
        onSubmit={handleSaveSettings}
      />

      <LoginDialog
        open={isLoginDialogOpen}
        email={loginEmail}
        password={loginPassword}
        isLoading={isSessionLoading}
        hasAttempt={hasLoginAttempt}
        error={loginErrorMessage}
        onOpenChange={(open) => {
          setIsLoginDialogOpen(open);
          if (!open) {
            setLoginPassword('');
            setHasLoginAttempt(false);
          }
        }}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLoginSubmit}
      />
    </div>
  );
};
