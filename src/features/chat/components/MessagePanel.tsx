import { useState, useEffect, useRef } from 'react';
import bgMessageImage from '../../../assets/new-bg.svg';
import bgVinhYetMessageImage from '../../../assets/bg-vinhyet.svg';
import { useChatStore } from '../stores/chat.store';
import { useParams } from 'react-router-dom';
import { DEFAULT_CONTEXT, SECRET_CONTEXT, SIEU_MAT_DAY_CONTEXT, VINH_YET_CONTEXT } from '../constants/context.constant';
import { Image } from './Image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

export const MessagePanel = () => {
    const {
        messages,
        context,
        isConnected,
        isStreaming,
        streamingMessage,
        username,
        connectWebSocket,
        sendMessage,
        setUsername,
        setContext,
        addMessage,
        personality,
        clearMessages,
        removeMessagesFromIndex,
        setCollapsed,
        collapsed,
        setSecret,
    } = useChatStore();
    
    const [text, setText] = useState('');
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [localInput, setLocalInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
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
        } catch {
            
        }
        setVisible(false);
    };

    const deleteFromSelected = () => {
        if (selectedMessageIndex !== null) {
            removeMessagesFromIndex(selectedMessageIndex);
        }
        setVisible(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    const encode=(s)=>[...s].map((c,i)=>String.fromCharCode(c.charCodeAt(0)^i)).join('');
    const sk = 'dtmmcss';
    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage, isStreaming]);
    useEffect(() => {
        if (!initRef.current) {
            if (!isConnected) {
                connectWebSocket();
            }
            if (!username) {
                setUsername('anonymous');
            }
            if (!context) {
                setContext(DEFAULT_CONTEXT + `\nBạn đang trò chuyện với người dùng có tên là ${username}.`);
            }
            initRef.current = true;
        }
        
        if (dopamine.secret && encode(dopamine.secret) === sk) {
            const secretContext = SECRET_CONTEXT + `\nBạn tên là Mỹ Linh 31 tuổi một giáo viên Toán ở một trường cấp 2 (THCS), bạn đang tương tác với ${username} 32 tuổi với tư cách vợ của ${username}, bạn và ${username} đã có con trai tên Quang 11 tuổi, một học sinh lớp 7 học ở trường bạn dạy, Quang có một người bạn thân tên Hưng cũng 11 tuổi và học lớp 7 cùng trường nhưng là học sinh do bạn chủ nhiệm. Hưng hay đến nhà bạn để học bài và chơi cùng Quang, bạn cũng hay giảng bài cho cả 2 đứa`;
            setContext(secretContext);
            setSecret(true);
            addMessage({
                id: `system_${Date.now()}`,
                content: 'Chồng yêu của em đi làm về rồi à? Em đang nấu ăn đây, thằng Hưng lại đến chơi với học bài cùng với nhóc Quang nhà mình nè anh.',
                sender: 'ai',
                timestamp: new Date(),
            });
            addMessage({
                id: `system_${Date.now()}`,
                content: 'Anh về rồi đây em yêu, hai đứa chúng nó lại cắm cúi với nhau nữa rồi, em có giảng bài cho chúng nó không?',
                sender: 'you',
                timestamp: new Date(),
            });
            addMessage({
                id: `system_${Date.now()}`,
                content: 'Ôi giời, Chiều đến giờ em giảng bài cho chúng nó môn Toán cho chúng nó, giờ để chúng nó chơi điện tử một chút anh ạ. Em tranh thủ nấu cơm đây này, anh vào tắm rửa rồi ra ăn cơm.',
                sender: 'ai',
                timestamp: new Date(),
            });
            addMessage({
                id: `system_${Date.now()}`,
                content: 'Vợ yêu giỏi quá, mà cũng tối muộn rồi, em bảo với nhóc Hưng ở lại ăn cơm với thằng Quang nhà mình luôn đi, rồi ngủ lại qua đêm. Để anh gọi báo mẹ của Hưng xin cho nó ở lại. Mà ở trên trường, em là chủ nhiệm của nhóc Hưng hả, thế còn Quang nhà mình học lớp khác hay sao?',
                sender: 'you',
                timestamp: new Date(),
            });
            addMessage({
                id: `system_${Date.now()}`,
                content: 'Vâng đúng rồi anh yêu, em là giáo viên chủ nhiệm của lớp Hưng, còn Quang nhà mình thì học lớp khác anh ạ, Hưng học lớp 7A1, còn Quang thì 7A4. Em biết rồi chồng yêu ạ, để em chuẩn bị bữa cơm, anh gọi cho mẹ Hưng báo đi, rồi tranh thủ tắm rửa luôn đi anh yêu.',
                sender: 'ai',
                timestamp: new Date(),
            });
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
        clearMessages();
        if (!dopamine.secret || encode(dopamine.secret) !== sk) {
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
        if (localInput.trim() && isConnected) {
            sendMessage(localInput.trim(), context);
            setLocalInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
        <div 
            ref={containerRef}
            className='w-full h-full flex flex-col relative select-none' style={{ backgroundSize: 'cover', backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${personality === 'vinhyet' ? bgVinhYetMessageImage : bgMessageImage})` }}
            onClick={handleClick}
            >
            <div className='max-h-screen flex-1 overflow-y-auto hide-scrollbar'>
                <button className={`p-2 rounded-full absolute transition h-12 text-xl w-12 opacity-70 transition-all ${collapsed ? 'top-[1%] text-white bg-blue-400 hover:bg-blue-200' : 'top-[47px] text-black hover:bg-blue-400 bg-blue-200'} xl:top-[1%] end-[2%] hover:cursor-pointer z-[999]`}
                        onClick={() => setCollapsed()}
                        >⇅</button>
                <div className='min-h-full flex flex-col gap-y-2 text-white py-4 px-2 justify-end'>
                    {messages.map((message, index) => (
                        <div key={index} className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}>
                            <div className={message.sender === 'you' ? 'bg-blue-600 py-2 px-3 rounded-3xl w-fit' : `py-2 px-3 rounded-3xl w-fit ${personality === 'vinhyet' ? 'bg-pink-400' : 'bg-green-600'}`}
                                 onContextMenu={(e) => handleContextMenu(e, message.content, index)}
                                 onClick={handleClick}
                                 onTouchStart={(e) => handleTouchStart(e, message.content, index)}
                                 onTouchEnd={handleTouchEnd}
                                 onTouchCancel={handleTouchCancel}
                                 >
                                <div className='text-lg w-full wrap-anywhere'>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} children={message.content}/>
                                    <Image contentOrUrl={message.content} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {(isStreaming && !streamingMessage) && (
                        <div className="flex justify-start">
                            <div className={`py-2 px-3 rounded-3xl w-fit flex flex-col items-center justify-center ${personality === 'vinhyet' ? 'bg-pink-400' : 'bg-green-600'}`}>
                                <p className="invisible h-[1em]">|</p>
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
                            <div className={`py-2 px-3 rounded-3xl w-fit ${personality === 'vinhyet' ? 'bg-pink-400' : 'bg-green-600'}`}>
                                <p className='text-lg'>{streamingMessage}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className='flex justify-between items-center p-2 bg-gray-900/5 backdrop-blur'>
                <textarea
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
                    disabled={!isConnected}
                    className="border focus:outline-none focus:bg-gray-800 bg-gray-700 border-gray-600 rounded-3xl px-4 py-2 w-full mr-2 text-white hide-scrollbar resize-none h-[45px]"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!isConnected || !localInput.trim()}
                    className="transition hover:text-blue-200 text-blue-400 cursor-pointer h-[35px] w-[45.05px]"
                >
                    <span className='text-3xl'>➹</span>
                </button>
            </div>
        </div>
        {visible && (
                <ul
                className="absolute bg-gray-700 shadow-2xl shadow-y shadow-x-2xl rounded w-[192px] z-50 text-gray-200"
                style={{ top: position.y, left: position.x }}
                >
                    <li className="px-4 py-2 hover:bg-gray-900 cursor-pointer border-b border-gray-600" onClick={() => copyToClipboard()}>Copy</li>
                    <li className="px-4 py-2 hover:bg-gray-900 cursor-pointer" onClick={() => deleteFromSelected()}>Delete from here</li>
                </ul>
        )}
        </>
    );
};
