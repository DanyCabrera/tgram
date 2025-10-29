import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { MessageProvider } from "../contexts/MessageContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ToastProvider } from "../contexts/ToastContext";

export const metadata: Metadata = {
  title: "Red Social",
  description: "Una red social moderna con chat en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <MessageProvider>
                <ChatProvider>
                  {children}
                </ChatProvider>
              </MessageProvider>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
