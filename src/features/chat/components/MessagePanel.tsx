import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { ApiError } from '../../../lib/api';
import { useChatStore } from '../stores/chat.store';
import { useSessionStore } from '../../auth/stores/session.store';
import { LLMMessageRenderer } from './LLMMessageRenderer';

const CONTEXT_MENU_WIDTH = 200;

interface ContextMenuState {
	visible: boolean;
	x: number;
	y: number;
	messageIndex: number | null;
	content: string;
}

export const MessagePanel = () => {
	const authMode = useChatStore((state) => state.authMode);
	const username = useChatStore((state) => state.username);
	const setUsername = useChatStore((state) => state.setUsername);
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
	const updateDisplayName = useSessionStore((state) => state.updateDisplayName);

	const userRole = sessionUser?.role;
	const sessionIdentity = sessionUser?.display_name || sessionUser?.email || '';

	const [inputValue, setInputValue] = useState('');
	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		visible: false,
		x: 0,
		y: 0,
		messageIndex: null,
		content: '',
	});
	const [showContextEditor, setShowContextEditor] = useState(false);
	const [isSavingContext, setIsSavingContext] = useState(false);
	const [contextSaveMessage, setContextSaveMessage] = useState<string | null>(null);
	const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
	const [loginEmail, setLoginEmail] = useState('');
	const [loginPassword, setLoginPassword] = useState('');
	const [hasLoginAttempt, setHasLoginAttempt] = useState(false);
	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
	const [settingsUsername, setSettingsUsername] = useState('');
	const [settingsError, setSettingsError] = useState<string | null>(null);
	const [isSavingSettings, setIsSavingSettings] = useState(false);

	const isAuthenticated = sessionStatus === 'authenticated';
	const isSessionLoading = sessionStatus === 'loading';
	const loginErrorMessage = sessionError;

	useEffect(() => {
		if (sessionStatus === 'idle') {
			fetchSession().catch(() => undefined);
		}
	}, [sessionStatus, fetchSession]);

	useEffect(() => {
		if (isAuthenticated && sessionUser) {
			if (authMode !== 'authenticated') {
				setAuthMode('authenticated', sessionUser.display_name || sessionUser.email);
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
			setSettingsUsername(username);
			setSettingsError(null);
		}
	}, [isSettingsDialogOpen, username]);

	const handleOpenLogin = () => {
		setLoginEmail((prev) => prev || sessionUser?.email || '');
		setLoginPassword('');
		setHasLoginAttempt(false);
		setIsLoginDialogOpen(true);
	};

	const handleCloseLogin = () => {
		setIsLoginDialogOpen(false);
		setLoginPassword('');
		setHasLoginAttempt(false);
	};

	const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!loginEmail.trim() || !loginPassword) {
			return;
		}
		try {
			setHasLoginAttempt(true);
			await login(loginEmail.trim(), loginPassword);
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
		}
	};

	const handleOpenSettings = () => {
		setSettingsUsername(username);
		setSettingsError(null);
		setIsSettingsDialogOpen(true);
	};

	const handleCloseSettings = () => {
		setIsSettingsDialogOpen(false);
		setSettingsError(null);
	};

	const handleSaveSettings = async () => {
		const trimmed = settingsUsername.trim();
		if (!trimmed) {
			setSettingsError('Tên hiển thị không được để trống.');
			return;
		}

		setIsSavingSettings(true);
		setSettingsError(null);
		try {
			const updatedUser = await updateDisplayName(trimmed);
			setUsername(updatedUser.display_name ?? trimmed);
			setIsSettingsDialogOpen(false);
		} catch (error) {
			if (error instanceof ApiError) {
				if (typeof error.data === 'string' && error.data.trim().length > 0) {
					setSettingsError(error.data);
				} else if (error.status === 422) {
					setSettingsError('Tên hiển thị không được để trống.');
				} else {
					setSettingsError('Không thể lưu tên hiển thị. Vui lòng thử lại.');
				}
			} else {
				setSettingsError('Không thể lưu tên hiển thị. Vui lòng thử lại.');
			}
			console.error('Không thể cập nhật tên hiển thị', error);
		} finally {
			setIsSavingSettings(false);
		}
	};

	const messageContainerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const shouldStickToBottomRef = useRef(true);
	const wasStreamingRef = useRef(isStreaming);

	const activePersonalitySlug = useMemo(() => {
		if (conversationDetail) {
			return conversationDetail.personality_slug;
		}
		return selectedPersonalitySlug;
	}, [conversationDetail, selectedPersonalitySlug]);

	const handleSend = async () => {
		const currentValue = inputValue;
		const trimmed = currentValue.trim();
		if (!trimmed) return;
		setInputValue('');
		adjustTextareaHeight(textareaRef.current);
		try {
			await sendMessage(trimmed);
		} catch (error) {
			console.error('Không thể gửi tin nhắn', error);
			setInputValue(currentValue);
			adjustTextareaHeight(textareaRef.current);
		}
	};

	const adjustTextareaHeight = (element?: HTMLTextAreaElement | null) => {
		const textarea = element ?? textareaRef.current;
		if (!textarea) return;
		const minHeight = 48;
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
		if (wasStreamingRef.current && !isStreaming) {
			textareaRef.current?.focus();
		}
		wasStreamingRef.current = isStreaming;
	}, [isStreaming]);

	useEffect(() => {
		const container = messageContainerRef.current;
		if (!container) return;
		if (shouldStickToBottomRef.current) {
			container.scrollTo({ top: container.scrollHeight });
		}
	}, [messages, streamingMessage]);

	useEffect(() => {
		if (isStreaming) {
			shouldStickToBottomRef.current = true;
		}
	}, [isStreaming]);

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
		const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;
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

	const handlePersonalityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		if (conversationDetail && authMode === 'authenticated') {
			if (value !== conversationDetail.personality_slug) {
				updateConversationPersonality(value).catch((error) => {
					console.error('Không thể thay đổi personality', error);
				});
			}
		} else {
			setSelectedPersonalitySlug(value);
		}
	};

	const handleContextMenu = (
		event: React.MouseEvent<HTMLDivElement>,
		index: number,
		content: string,
	) => {
		event.preventDefault();
		const container = messageContainerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		let x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		if (x + CONTEXT_MENU_WIDTH > rect.width) {
			x = Math.max(0, rect.width - CONTEXT_MENU_WIDTH);
		}
		setContextMenu({
			visible: true,
			x,
			y,
			messageIndex: index,
			content,
		});
	};

	const hideContextMenu = () => {
		setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(contextMenu.content);
		} catch (error) {
			console.error('Không thể sao chép tin nhắn', error);
		}
		hideContextMenu();
	};

	const handleDeleteFromHere = async () => {
		if (contextMenu.messageIndex === null) return;
		try {
			await deleteMessagesFromIndex(contextMenu.messageIndex);
		} catch (error) {
			console.error('Không thể xoá tin nhắn', error);
		} finally {
			hideContextMenu();
		}
	};

	const handleSaveContext = async () => {
		setIsSavingContext(true);
		setContextSaveMessage(null);
		try {
			await updateContextOverride();
			setContextSaveMessage('Đã lưu context thành công.');
		} catch (error) {
			console.error('Không thể lưu context', error);
			setContextSaveMessage('Không thể lưu context.');
		} finally {
			setIsSavingContext(false);
			setTimeout(() => setContextSaveMessage(null), 4000);
		}
	};

	return (
		<div className="flex h-full flex-col bg-neutral-900/40 text-slate-100 w-full">
			<header className="border-b border-neutral-700 bg-neutral-900/70 px-4 py-3 backdrop-blur">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap items-center gap-3">
						<label className="items-center gap-2 text-sm text-neutral-300 hidden">
							<span>Nhân cách</span>
							<select
								value={activePersonalitySlug ?? ''}
								onChange={handlePersonalityChange}
								className="h-9 rounded-full border border-neutral-600 bg-neutral-800 px-3 text-sm text-white focus:border-green-400 focus:outline-none"
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
						{conversationDetail && userRole === 'quest_expert' && (
					<div>
						<button
							type="button"
							onClick={() => setShowContextEditor((prev) => !prev)}
							className="rounded-full border border-green-400 px-4 py-1 text-sm font-semibold text-green-400 transition hover:bg-green-400/10"
						>
							{showContextEditor ? 'Ẩn context' : 'Chỉnh sửa context'}
						</button>
					</div>
				)}
					</div>
					<div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
						<span className="text-xs text-neutral-400">
							{isAuthenticated
								? `Đã đăng nhập${sessionIdentity ? `: ${sessionIdentity}` : ''}`
								: 'Chế độ khách'}
						</span>
						{isAuthenticated ? (
							<>
								<button
									type="button"
									onClick={handleOpenSettings}
									className="rounded-full border border-neutral-500 px-4 py-1 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-700/60"
								>
									Tùy chỉnh
								</button>
								<button
									type="button"
									onClick={handleLogout}
									className="rounded-full border border-red-400 px-4 py-1 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
								>
									Đăng xuất
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={handleOpenLogin}
								disabled={isSessionLoading}
								className="rounded-full border border-green-400 px-4 py-1 text-sm font-semibold text-green-400 transition hover:bg-green-400/10 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSessionLoading ? 'Đang kiểm tra...' : 'Đăng nhập'}
							</button>
						)}
					</div>
				</div>
				
				{showContextEditor && conversationDetail && userRole === 'quest_expert' && (
					<div className="mt-3 space-y-3 rounded-2xl border border-neutral-700 bg-neutral-900/80 p-4">
						<textarea
							value={contextEditorValue}
							onChange={(event) => updateContextEditorValue(event.target.value)}
							className="h-40 w-full resize-none rounded-xl border border-neutral-700 bg-neutral-800 p-3 text-sm text-white focus:border-green-400 focus:outline-none"
							placeholder="Nhập context mới cho hội thoại"
						/>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={handleSaveContext}
								disabled={isSavingContext}
								className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSavingContext ? 'Đang lưu...' : 'Lưu context'}
							</button>
							{contextSaveMessage && (
								<span className="text-xs text-neutral-300">{contextSaveMessage}</span>
							)}
						</div>
					</div>
				)}
			</header>

			<div
				className="relative flex-1 overflow-hidden"
				onClick={hideContextMenu}
			>
				<div
					ref={messageContainerRef}
					onScroll={handleScroll}
					className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-6"
				>
					{
						messages.length == 0 && (
							<div className="w-full h-full flex items-center justify-center">
								<div>
									<p className="text-4xl">Chào bạn, Hãy cùng trò chuyện ngay!</p>
								</div>
							</div>
						)
					}
					{isLoadingOlderMessages && (
						<div className="text-center text-xs text-neutral-400">Đang tải thêm tin nhắn...</div>
					)}
					{messages.map((message, index) => {
						const isUser = message.sender === 'user';
						return (
							<div key={message.id} className={clsx('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
								<div
									onContextMenu={(event) => handleContextMenu(event, index, message.content)}
									className={clsx(
										'max-w-full rounded-3xl px-5 py-1 text-sm shadow-sm',
										isUser
											? 'bg-green-400/90 text-black'
											: 'bg-neutral-800/80 text-neutral-100',
									)}
								>
									<LLMMessageRenderer content={message.content} isStreaming={false} />
								</div>
							</div>
						);
					})}
					{isStreaming && streamingMessage && (
						<div className="flex justify-start">
							<div className="max-w-full rounded-3xl bg-neutral-800/80 px-5 py-3 text-sm text-neutral-100 sm:max-w-3xl">
								<LLMMessageRenderer content={streamingMessage} isStreaming />
							</div>
						</div>
					)}
					{isStreaming && !streamingMessage && (
						<div className="flex justify-start text-sm text-neutral-400">Đang trả lời...</div>
					)}
				</div>

				{contextMenu.visible && (
					<ul
						className="absolute z-50 w-48 rounded-xl border border-neutral-700 bg-neutral-900/95 text-sm text-white shadow-2xl"
						style={{ top: contextMenu.y, left: contextMenu.x }}
					>
						<li
							className="cursor-pointer px-4 py-2 transition hover:bg-neutral-800"
							onClick={handleCopy}
						>
							Sao chép
						</li>
						<li
							className="cursor-pointer px-4 py-2 transition hover:bg-neutral-800"
							onClick={handleDeleteFromHere}
						>
							Xoá từ đây
						</li>
					</ul>
				)}
			</div>

			<footer className="border-t border-neutral-700 bg-neutral-900/70 px-4 py-4">
				<div className="flex items-end gap-3">
								<textarea
						ref={textareaRef}
						rows={1}
						value={inputValue}
						onChange={(event) => {
							setInputValue(event.target.value);
							adjustTextareaHeight(event.currentTarget);
						}}
						onKeyDown={handleTextareaKeyDown}
						placeholder={isStreaming ? 'Vui lòng chờ khi phản hồi hoàn thành!' : 'Nhập tin nhắn...'}
						disabled={isStreaming}
									className="min-h-12 flex-1 resize-none rounded-3xl border border-neutral-700 bg-neutral-900/80 px-5 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!inputValue.trim() || isStreaming}
									className="h-12 w-12 shrink-0 rounded-full bg-green-500 text-xl text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
					>
						➤
					</button>
				</div>
			</footer>

			{isSettingsDialogOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
					onClick={handleCloseSettings}
				>
					<div
						onClick={(event) => event.stopPropagation()}
						className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 shadow-2xl"
					>
						<button
							type="button"
							onClick={handleCloseSettings}
							className="absolute right-4 top-4 text-lg text-neutral-400 transition hover:text-white"
						>
							✕
						</button>
						<h2 className="text-lg font-semibold text-white">Tùy chỉnh tài khoản</h2>
						<p className="mt-1 text-sm text-neutral-400">Cập nhật tên hiển thị khi trò chuyện.</p>
						<form
							className="mt-5 space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								void handleSaveSettings();
							}}
						>
							<div className="space-y-2">
								<label htmlFor="settings-username" className="text-sm text-neutral-300">
									Tên hiển thị
								</label>
								<input
									type="text"
									id="settings-username"
									value={settingsUsername}
									onChange={(event) => {
										setSettingsUsername(event.target.value);
										if (settingsError) {
											setSettingsError(null);
										}
									}}
									disabled={isSavingSettings}
									className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white focus:border-green-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
									placeholder="Nhập tên mới của bạn"
								/>
								{settingsError && <p className="text-xs text-red-400">{settingsError}</p>}
							</div>
							<div className="flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={handleCloseSettings}
									className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800/70"
								>
									Hủy
								</button>
								<button
									type="submit"
									disabled={isSavingSettings}
									className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isSavingSettings ? 'Đang lưu...' : 'Lưu'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{isLoginDialogOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
					onClick={handleCloseLogin}
				>
					<div
						onClick={(event) => event.stopPropagation()}
						className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 shadow-2xl"
					>
						<button
							type="button"
							onClick={handleCloseLogin}
							className="absolute right-4 top-4 text-lg text-neutral-400 transition hover:text-white"
						>
							✕
						</button>
						<h2 className="text-lg font-semibold text-white">Đăng nhập</h2>
						<p className="mt-1 text-sm text-neutral-400">
							Hãy đăng nhập để lưu trữ hội thoại và đồng bộ giữa các thiết bị.
						</p>
						<form className="mt-5 space-y-4" onSubmit={handleLoginSubmit}>
							<div className="space-y-2">
								<label htmlFor="login-email" className="text-sm text-neutral-300">
									Email
								</label>
								<input
									type="email"
									id="login-email"
									value={loginEmail}
									onChange={(event) => setLoginEmail(event.target.value)}
									required
									className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white focus:border-green-400 focus:outline-none"
								/>
							</div>
							<div className="space-y-2">
								<label htmlFor="login-password" className="text-sm text-neutral-300">
									Mật khẩu
								</label>
								<input
									type="password"
									id="login-password"
									value={loginPassword}
									onChange={(event) => setLoginPassword(event.target.value)}
									required
									className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white focus:border-green-400 focus:outline-none"
								/>
							</div>
							<button
								type="submit"
								disabled={isSessionLoading}
								className="w-full rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSessionLoading ? 'Đang xử lý...' : 'Đăng nhập'}
							</button>
						</form>
						{hasLoginAttempt && loginErrorMessage && (
							<p className="mt-3 text-sm text-red-400">{loginErrorMessage}</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
