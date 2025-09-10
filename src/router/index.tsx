import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { Chat } from "../features/chat/Chat";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "",
                element: <Chat />
            },
            {
                path: "secret/:secret",
                element: <Chat />,
            }
        ]
    }
]);