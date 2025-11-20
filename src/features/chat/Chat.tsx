import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { MessagePanel } from "./components/MessagePanel";
export const Chat = () => {
    return (
        <div className="flex h-full w-full flex-col md:flex-row md:items-stretch relative">
            <SidebarProvider>
                <Sidebar variant="inset" collapsible="offcanvas">
                    <ConversationSidebar/>
                </Sidebar>
                <SidebarInset>
                    <MessagePanel />
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}