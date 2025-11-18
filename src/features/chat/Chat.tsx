import { MessagePanel } from "./components/MessagePanel";
export const Chat = () => {
    return (
        <div className="flex flex-col h-full w-full relative">
            <MessagePanel />
        </div>
    )
}