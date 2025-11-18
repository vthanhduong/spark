import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chat.store';
import { useParams } from 'react-router-dom';
import { DEFAULT_CONTEXT, SECRET_CONTEXT, SIEU_MAT_DAY_CONTEXT, VINH_YET_CONTEXT } from '../constants/context.constant';
import { LLMMessageRenderer } from './LLMMessageRenderer';

export const MessagePanel = () => {
    const {
        messages,
        context,
        isStreaming,
        streamingMessage,
        username,
        sendMessageSSE,
        setUsername,
        setContext,
        addMessage,
        personality,
        clearMessages,
        removeMessagesFromIndex,
        setSecret,
        secret,
        setPersonality,
    } = useChatStore();
    const [tempContext, setTempContext] = useState("");
    useEffect(() => {
        setTempContext(context);
    }, [context]);
    const [text, setText] = useState('');
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [localInput, setLocalInput] = useState('');
    const [expand, setExpand] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesWrapperRef = useRef<HTMLDivElement>(null);
    const hasOverflowedRef = useRef(false);
    const forceScrollRef = useRef(false);
    const prevStreamingRef = useRef(isStreaming);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const initRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const CONTEXT_MENU_WIDTH = 192; // Width of the context menu
    const pressTimer = useRef<number | null>(null);
    const LONG_PRESS_DELAY = 700;

    const handleContextMenu = (e: React.MouseEvent, str: string, messageIndex: number) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x + CONTEXT_MENU_WIDTH > rect.width) {
            x = rect.width - CONTEXT_MENU_WIDTH;
            if (x < 0) x = 0;
        }
        setPosition({
            x,
            y
        });
        setText(str);
        setSelectedMessageIndex(messageIndex);
        setVisible(true);
    };

    const handleClick = () => {
        setVisible(false);
    };

    const copyToClipboard = () => {
        try {
            navigator.clipboard.writeText(text)
                .then(() => {
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        } catch (err) {
            console.error(err);
        }
        setVisible(false);
    };

    const deleteFromSelected = () => {
        if (selectedMessageIndex !== null) {
            removeMessagesFromIndex(selectedMessageIndex);
        }
        setVisible(false);
    };

    const retryLastAIResponse = () => {
        if (selectedMessageIndex === null) {
            setVisible(false);
            return;
        }

        // Chỉ cho phép retry response cuối cùng của AI
        const lastAIMessageIndex = messages.length - 1;
        if (selectedMessageIndex !== lastAIMessageIndex) {
            setVisible(false);
            return;
        }

        // Tìm tin nhắn user gần nhất (tin nhắn trước tin nhắn AI này)
        const previousUserMessage = messages[selectedMessageIndex - 1];
        if (!previousUserMessage || previousUserMessage.sender !== 'you') {
            console.error('Cannot find previous user message');
            setVisible(false);
            return;
        }

        // Lưu nội dung user message
        const userMessageContent = previousUserMessage.content;

        // Xóa cả user message và AI message (xóa từ vị trí user message)
        removeMessagesFromIndex(selectedMessageIndex - 1);

        // Gửi lại tin nhắn user để gen response mới
        setTimeout(() => {
            sendMessageSSE(userMessageContent, context);
        }, 100);

        setVisible(false);
    };

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        const wrapper = messagesWrapperRef.current;
        if (wrapper) {
            requestAnimationFrame(() => {
                wrapper.scrollTo({
                    top: wrapper.scrollHeight,
                    behavior,
                });
            });
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }
    };

    const handleTouchStart = (e: React.TouchEvent, str: string, messageIndex: number) => {
        pressTimer.current = setTimeout(() => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            let x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            if (x + CONTEXT_MENU_WIDTH > rect.width) {
                x = rect.width - CONTEXT_MENU_WIDTH;
                if (x < 0) x = 0;
            }
            setPosition({
                x,
                y
            });
            setText(str);
            setSelectedMessageIndex(messageIndex);
            setVisible(true);
            navigator.vibrate(100);
        }, LONG_PRESS_DELAY);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
    };

    const handleTouchCancel = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
        setVisible(false);
    };
    const dopamine = useParams<{ secret: string }>();
    const encode=(s: string)=>[...s].map((c,i)=>String.fromCharCode(c.charCodeAt(0)^i)).join('');
    const sk = 'dtmmcss';
    
    useEffect(() => {
        const wrapper = messagesWrapperRef.current;
        if (!wrapper) return;

        const overflowDelta = wrapper.scrollHeight - wrapper.clientHeight;
        const isOverflowing = overflowDelta > 8;
        const distanceFromBottom = wrapper.scrollHeight - wrapper.scrollTop - wrapper.clientHeight;
        const isNearBottom = distanceFromBottom < 150;
        const hadOverflow = hasOverflowedRef.current;
        const shouldForceScroll = forceScrollRef.current;

        // Always scroll when streaming or when forced
        if (shouldForceScroll || isStreaming) {
            scrollToBottom('smooth');
            forceScrollRef.current = false;
        } else if (isOverflowing && (!hadOverflow || isNearBottom)) {
            scrollToBottom('smooth');
        }

        hasOverflowedRef.current = isOverflowing;
    }, [messages, streamingMessage, isStreaming]);

    useEffect(() => {
        // When streaming starts
        if (isStreaming && !prevStreamingRef.current) {
            forceScrollRef.current = true;
        }
        // When streaming ends, force scroll to bottom and focus textarea
        if (!isStreaming && prevStreamingRef.current) {
            setTimeout(() => {
                scrollToBottom('smooth');
                textareaRef.current?.focus();
            }, 100);
        }
        prevStreamingRef.current = isStreaming;
    }, [isStreaming]);

    const adjustTextareaHeight = (element?: HTMLTextAreaElement | null) => {
        const textarea = element ?? textareaRef.current;
        if (!textarea) return;
        const minHeight = 48;
        const maxHeight = 240;
        textarea.style.height = 'auto';
        const measuredHeight = textarea.scrollHeight || minHeight;
        const nextHeight = Math.min(Math.max(measuredHeight, minHeight), maxHeight);
        textarea.style.height = `${nextHeight}px`;
        textarea.style.overflowY = measuredHeight > maxHeight ? 'auto' : 'hidden';
    };
    useEffect(() => {
        if (!initRef.current) {
            if (!username) {
                setUsername('anonymous');
            }
            if (!context) {
                setContext(DEFAULT_CONTEXT + `\nBạn đang trò chuyện với người dùng có tên là ${username}.`);
            }
            initRef.current = true;
        }
        
        if (dopamine.secret && encode(dopamine.secret) === sk) {
            // Set secret mode first, then set context
            setSecret(true);
            
            // Set default context for secret mode
            if (!context) {
                const secretContext = SECRET_CONTEXT + `\nBạn tên là {name} bạn đang tương tác với ${username} với tư cách vợ của anh ấy!`;
                setContext(secretContext);
            }
        } else {
            setSecret(false);
            if (personality === 'sieumatday') {
                setContext(SIEU_MAT_DAY_CONTEXT + `\nBạn đang trò chuyện với người dùng có tên là ${username}.`);
            } else if (personality === 'vinhyet') {
                setContext(VINH_YET_CONTEXT + `\nBạn đang trò chuyện với người dùng có tên là ${username}.`);
            } else {
                setContext(DEFAULT_CONTEXT + `\nBạn đang trò chuyện với người dùng có tên là ${username}.`);
            }
        } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, personality]);
    useEffect(() => {
        // Only clear messages and add default message if NOT in secret mode
        if (!dopamine.secret || encode(dopamine.secret) !== sk) {
            clearMessages();
            if (personality === 'sieumatday') {
                addMessage({
                    id: `system_${Date.now()}`,
                    content: 'Ơ vãi cả lồn sao bố mày lại ở đây vậy?',
                    sender: 'ai',
                    timestamp: new Date(),
                });
            } else if (personality === 'vinhyet') {
                addMessage({
                    id: `system_${Date.now()}`,
                    content: 'Chào mày đến với thế giới của Vinh yet, mày thích nói gì về tao à?',
                    sender: 'ai',
                    timestamp: new Date(),
                });
            } else {
                addMessage({
                    id: `system_${Date.now()}`,
                    content: 'Hello, chào bạn nha! Rất vui được trò chuyện với bạn! Đố bạn biết mình tên gì đó?',
                    sender: 'ai',
                    timestamp: new Date(),
                });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personality]);

    

    const handleSendMessage = () => {
        if (localInput.trim()) {
            sendMessageSSE(localInput.trim(), context);
            setLocalInput('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalInput(e.target.value);
        adjustTextareaHeight(e.currentTarget);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isStreaming) {
                handleSendMessage();
            }
        }
    };

    return (
        <div className='w-full h-screen flex flex-col text-slate-100'>
            {/* Header Section */}
            <div className='grid grid-cols-1 sm:grid-cols-2 backdrop-blur bg-neutral-800 border-b border-neutral-700 text-white w-full p-2'>
                <div className="my-1 flex flex-row items-center">
                    <span style={{ fontFamily: 'Consolas, monospace' }} className="whitespace-pre xl:whitespace-normal">Username&nbsp;</span>
                    <input 
                        type="text"
                        placeholder="Enter your username"
                        className="border focus:outline-none focus:bg-neutral-800 border-neutral-700 bg-neutral-700 rounded-3xl px-2 me-4 h-10 w-64"
                        value={username} 
                        onChange={(e) => {setUsername(e.target.value)}}
                    />
                </div>
                <div className="my-1 flex flex-row items-center">
                    {!secret ? (
                        <>
                            <span className="whitespace-pre xl:whitespace-normal" style={{ fontFamily: 'Consolas, monospace' }}>Personality&nbsp;</span>
                            <select className="border focus:outline-none focus:bg-neutral-800 border-neutral-700 bg-neutral-700 rounded-3xl me-4 h-10 w-64" value={personality} onChange={(e) => setPersonality(e.target.value)}>
                                <option value="markiai">Marki AI</option>
                                <option value="vinhyet">Vinh yet</option>
                                <option value="sieumatday">Siêu mất dạy</option>
                            </select>
                        </>
                    ) : (
                        <>
                        <div className="flex flex-row justify-end w-full">
                            <button 
                                onClick={() => setExpand(!expand)}
                                className="select-none overflow-hidden shrink-0 text-center transition text-black bg-green-500 disabled:bg-white hover:opacity-70 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer h-[45px] w-[45px] rounded-full"
                            >
                                ⇲
                            </button>
                        </div>
                        </>

                    )}
                </div>
                <div className="col-span-full">
                    <p className="text-sm font-light tracking-wide text-neutral-500">msg from vthanhduong: temporary testing environment — features are incomplete and may break spectacularly.</p>
                </div>
                {(secret && expand) && (
                    <div className="col-span-full">
                        <span className="whitespace-pre xl:whitespace-normal" style={{ fontFamily: 'Consolas, monospace' }}>Context&nbsp;</span>
                        <div className="">
                            <textarea
                                className="mt-2 rounded-3xl bg-gray-700 border border-gray-600 w-full h-[45px] focus:h-72 transition-all p-2 focus:outline-none focus:bg-gray-800 hide-scrollbar"
                                value={tempContext}
                                onChange={(e) => setTempContext(e.target.value)}
                            />
                            <button
                                type="button"
                                className="rounded-3xl bg-green-600 hover:bg-green-700 cursor-pointer text-white py-2 px-4 mt-2 w-full transition-colors duration-300"
                                onClick={() => setContext(tempContext)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Section */}
            <div 
                ref={containerRef}
                className='flex-1 flex flex-col relative overflow-hidden'
                onClick={handleClick}
            >
                <div ref={messagesWrapperRef} className='flex-1 overflow-y-auto hide-scrollbar'>
                    <div className='flex flex-col gap-y-6 text-slate-100 py-6 px-4 pb-6'>
                    {messages.map((message, index) => {
                        const isUser = message.sender === 'you';
                        return (
                            <div key={message.id ?? index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full items-end`}>
                                <div
                                    className={`${isUser ? ' bg-neutral-600 text-white shadow-[0_0_20px_rgba(15,23,42,0.55)] w-fit max-w-full sm:max-w-3xl ml-auto' : 'text-slate-200 w-full'} py-1 px-5 rounded-3xl`}
                                    onContextMenu={(e) => handleContextMenu(e, message.content, index)}
                                    onClick={handleClick}
                                    onTouchStart={(e) => handleTouchStart(e, message.content, index)}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchCancel}
                                >
                                    <div className='text-base wrap-anywhere leading-relaxed tracking-wide'>
                                        <LLMMessageRenderer content={message.content} isStreaming={false} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {(isStreaming && !streamingMessage) && (
                        <div className="flex justify-start">
                            <div className='py-2 px-3 flex flex-row items-center gap-x-2 text-slate-400'>
                                <div className="dot-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Streaming message */}
                    {isStreaming && streamingMessage && (
                        <div className="flex justify-start">
                            <div className='text-slate-200 w-full py-1 px-5 rounded-3xl'>
                                <div className='text-base leading-relaxed tracking-wide'>
                                    <LLMMessageRenderer content={streamingMessage} isStreaming={true} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            {/* Context Menu */}
            {visible && (
                <ul
                    className="absolute bg-neutral-900/95 border border-neutral-700 rounded-xl w-48 z-50 text-slate-100 shadow-2xl"
                    style={{ top: position.y, left: position.x }}
                >
                    <li className="px-4 py-2 hover:bg-neutral-800 cursor-pointer border-b border-neutral-800/80 transition" onClick={() => copyToClipboard()}>Copy</li>
                    {/* Show Retry only for last AI message */}
                    {selectedMessageIndex !== null && 
                     selectedMessageIndex === messages.length - 1 && 
                     messages[selectedMessageIndex]?.sender === 'ai' && 
                     !isStreaming && (
                        <li className="px-4 py-2 hover:bg-neutral-800 cursor-pointer border-b border-neutral-800/80 transition text-yellow-400" onClick={() => retryLastAIResponse()}>Retry</li>
                    )}
                    <li className="px-4 py-2 hover:bg-neutral-800 cursor-pointer transition" onClick={() => deleteFromSelected()}>Delete from here</li>
                </ul>
            )}
        </div>

        {/* Input Section */}
        <div className='flex items-end gap-3 p-4 backdrop-blur-sm w-full border-t border-neutral-700'>
            <textarea
                ref={textareaRef}
                rows={1}
                value={localInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isStreaming ? "Please wait until the response is finished..." : "Type your message..."}
                disabled={isStreaming}
                className="border border-slate-800/80 focus:outline-none bg-neutral-900/70 rounded-3xl px-5 py-3 w-full text-slate-100 placeholder-slate-500 resize-none min-h-12 hide-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
                onClick={handleSendMessage}
                disabled={!localInput.trim() || isStreaming}
                className="select-none overflow-hidden shrink-0 text-center transition text-black bg-green-500 disabled:bg-white hover:opacity-70 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer h-[45px] w-[45px] rounded-full"
            >
                🠉
            </button>
        </div>
    </div>
    );
};
