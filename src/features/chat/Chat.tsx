import { ConversationSidebar } from "./components/ConversationSidebar";
import { MessagePanel } from "./components/MessagePanel";
export const Chat = () => {
    return (
        <div className="flex h-full w-full flex-col md:flex-row md:items-stretch relative">
            <ConversationSidebar/>
            <MessagePanel />
        </div>
    )
}