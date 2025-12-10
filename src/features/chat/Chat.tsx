import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { MessagePanel } from "./components/MessagePanel";
import { useChatStore } from "./stores/chat.store";
import { useSessionStore } from "../auth/stores/session.store";

export const Chat = () => {
    const { conversationId } = useParams<{ conversationId?: string }>();
    const navigate = useNavigate();
    const selectConversation = useChatStore((state) => state.selectConversation);
    const selectedConversationId = useChatStore((state) => state.selectedConversationId);
    const authMode = useChatStore((state) => state.authMode);
    const isAuthenticated = useSessionStore((state) => state.status) === "authenticated";

    // Handle URL param changes
    useEffect(() => {
        if (!isAuthenticated || authMode !== 'authenticated') {
            // If not authenticated and trying to access a conversation, redirect to home
            if (conversationId) {
                navigate('/', { replace: true });
            }
            return;
        }

        // If URL has conversationId but it's different from selected, select it
        if (conversationId && conversationId !== selectedConversationId) {
            selectConversation(conversationId).catch((error) => {
                console.error('Failed to load conversation', error);
                // If conversation not found or error, redirect to home
                navigate('/', { replace: true });
            });
        }

        // Don't auto-redirect to conversation when user explicitly navigated to root
        // Only sync URL if we have a selectedConversation AND we're not at root
        // This allows "New conversation" to work properly

        // If URL is root and no conversation selected, that's fine (new chat)
    }, [conversationId, selectedConversationId, isAuthenticated, authMode, selectConversation, navigate]);

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