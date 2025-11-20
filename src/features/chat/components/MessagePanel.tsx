import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';

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
	const {
		authMode,
		username,
		setUsername,
		personalities,
		selectedPersonalityId,
		setSelectedPersonalityId,
		conversationDetail,
		messages,
		streamingMessage,
		isStreaming,
		sendMessage,
		deleteMessagesFromIndex,
		loadOlderMessages,
		hasMoreMessages,
		isLoadingOlderMessages,
		contextEditorValue,
		updateContextEditorValue,
		updateContextOverride,
		updateConversationPersonality,
	} = useChatStore((state) => ({
		authMode: state.authMode,
		username: state.username,
		setUsername: state.setUsername,
		personalities: state.personalities,
		selectedPersonalityId: state.selectedPersonalityId,
		setSelectedPersonalityId: state.setSelectedPersonalityId,
		conversationDetail: state.conversationDetail,
		messages: state.messages,
		streamingMessage: state.streamingMessage,
		isStreaming: state.isStreaming,
		sendMessage: state.sendMessage,
		deleteMessagesFromIndex: state.deleteMessagesFromIndex,
		loadOlderMessages: state.loadOlderMessages,
		hasMoreMessages: state.hasMoreMessages,
		isLoadingOlderMessages: state.isLoadingOlderMessages,
		contextEditorValue: state.contextEditorValue,
		updateContextEditorValue: state.updateContextEditorValue,
		updateContextOverride: state.updateContextOverride,
		updateConversationPersonality: state.updateConversationPersonality,
	}));

	const userRole = useSessionStore((state) => state.user?.role);

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

	const messageContainerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const shouldStickToBottomRef = useRef(true);

	const activePersonalityId = useMemo(() => {
		if (conversationDetail) {
			return conversationDetail.personality_id;
		}
		return selectedPersonalityId;
	}, [conversationDetail, selectedPersonalityId]);

	const handleSend = async () => {
		if (!inputValue.trim()) return;
		try {
			await sendMessage(inputValue);
			setInputValue('');
			adjustTextareaHeight();
		} catch (error) {
			console.error('Không thể gửi tin nhắn', error);
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
				handleSend();
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
			if (value !== conversationDetail.personality_id) {
				updateConversationPersonality(value).catch((error) => {
					console.error('Không thể thay đổi personality', error);
				});
			}
		} else {
			setSelectedPersonalityId(value);
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
		<div className="flex h-full flex-col bg-neutral-900/40 text-slate-100">
			<header className="border-b border-neutral-700 bg-neutral-900/70 px-4 py-3 backdrop-blur">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap items-center gap-3">
						<label className="flex items-center gap-2 text-sm text-neutral-300">
							<span>Tên hiển thị</span>
							<input
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								className="h-9 rounded-full border border-neutral-600 bg-neutral-800 px-4 text-sm text-white focus:border-green-400 focus:outline-none"
								placeholder="Nhập tên của bạn"
							/>
						</label>
						<label className="flex items-center gap-2 text-sm text-neutral-300">
							<span>Nhân cách</span>
							<select
								value={activePersonalityId ?? ''}
								onChange={handlePersonalityChange}
								className="h-9 rounded-full border border-neutral-600 bg-neutral-800 px-3 text-sm text-white focus:border-green-400 focus:outline-none"
							>
								<option value="" disabled>
									Chọn nhân cách
								</option>
								{personalities.map((personality) => (
									<option key={personality.id} value={personality.id}>
										{personality.name}
									</option>
								))}
							</select>
						</label>
					</div>
					{conversationDetail && (
						<div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
							<span>Mã hội thoại: {conversationDetail.id}</span>
							<span>{conversationDetail.message_count} tin nhắn</span>
							<span>Cập nhật: {new Date(conversationDetail.updated_at).toLocaleString()}</span>
						</div>
					)}
				</div>
				{conversationDetail && userRole === 'quest_expert' && (
					<div className="mt-3">
						<button
							type="button"
							onClick={() => setShowContextEditor((prev) => !prev)}
							className="rounded-full border border-green-400 px-4 py-1 text-sm font-semibold text-green-400 transition hover:bg-green-400/10"
						>
							{showContextEditor ? 'Ẩn context' : 'Chỉnh sửa context'}
						</button>
					</div>
				)}
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
										'max-w-full rounded-3xl px-5 py-3 text-sm shadow-sm sm:max-w-3xl',
										isUser
											? 'bg-green-500/90 text-black'
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
						<div className="flex justify-start text-sm text-neutral-400">AI đang trả lời...</div>
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
						placeholder={isStreaming ? 'Đang trả lời...' : 'Nhập tin nhắn...'}
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
		</div>
	);
};
