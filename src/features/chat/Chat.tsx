import { MessagePanel } from "./components/MessagePanel";
import { useChatStore } from "./stores/chat.store";
import { useState, useEffect } from "react";
export const Chat = () => {
    const [tempContext, setTempContext] = useState("");
    const {
        username,
        setUsername,
        status,
        personality,
        setPersonality,
        collapsed,
        secret,
        context,
        setContext,
    } = useChatStore();
    useEffect(() => {
        setTempContext(context);
    }, [context]);
    return (
        <div className="flex flex-col h-full w-full relative">
            <div className={`grid grid-cols-1 xl:grid-cols-3 backdrop-blur bg-gray-900/5 text-white transition-all duration-500 absolute z-50 w-full top-0 ${collapsed ? 'max-h-[0px] opacity-0 pointer-events-none' : 'p-2 opacity-100'}`}>
                    <div className="my-1 flex flex-row items-center">
                        <span style={{ fontFamily: 'Consolas, monospace' }} className="whitespace-pre xl:whitespace-normal">Username    : </span>
                        <input 
                            type="text"
                            placeholder="Enter your username"
                            className="border focus:outline-none focus:bg-gray-800 border-gray-600 bg-gray-700 rounded-3xl px-2 me-4 h-10 w-64"
                            value={username} 
                            onChange={(e) => {setUsername(e.target.value)}}
                        ></input>
                    </div>
                    <div className="my-1 flex flex-row items-center">
                        {!secret ? (
                            <>
                                <span className="whitespace-pre xl:whitespace-normal" style={{ fontFamily: 'Consolas, monospace' }}>Personality : </span>
                                <select className="border focus:outline-none focus:bg-gray-800 border-gray-600 bg-gray-700 rounded-3xl me-4 h-10 w-64" value={personality} onChange={(e) => setPersonality(e.target.value)}>
                                    <option value="markiai">Marki AI</option>
                                    <option value="vinhyet">Vinh yet</option>
                                    <option value="sieumatday">Siêu mất dạy</option>
                                </select>
                            </>
                        ) : (
                            <span style={{ fontFamily: 'Consolas, monospace' }} className="text-red-800 font-bold">Secret Mode</span>
                        )}
                    </div>
                    <div className="my-1 flex flex-row items-center">
                        <p><span className="whitespace-pre xl:whitespace-normal" style={{ fontFamily: 'Consolas, monospace' }}>Status      : </span><span style={{ fontFamily: 'Consolas, monospace' }} className={(status === 'offline' || status === 'disconnected') ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{status}</span></p>
                    </div>
                    {
                        secret && (
                            <div className="col-span-full">
                                <span className="whitespace-pre xl:whitespace-normal" style={{ fontFamily: 'Consolas, monospace' }}>Context     :</span>
                                <textarea
                                    className="mt-2 rounded-3xl bg-gray-700 border border-gray-600 w-full h-[45px] focus:h-72 transition-all p-2 focus:outline-none focus:bg-gray-800 hide-scrollbar"
                                    value={tempContext}
                                    onChange={(e) => setTempContext(e.target.value)}
                                >
                                </textarea>
                                <button
                                    type="button"
                                    className="rounded-3xl bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 mt-2 w-full transition-colors duration-300"
                                    onClick={() => {
                                        setContext(tempContext);
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        )
                    }
            </div>
            <MessagePanel />
        </div>
    )
}