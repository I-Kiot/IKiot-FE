"use client"

import { useState } from "react"
import { Sparkles, ShieldAlert, X, ChevronLeft, ChevronRight } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuthStore } from "@/store/auth-store"
import { canUseAIChat } from "@/components/sidebar/constants/role-permissions"
import { ChatSidebar } from "./chat-sidebar"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { useAIChat } from "../hooks/use-ai-chat"
import { cn } from "@/lib/utils"

export function Chat() {
  const { user } = useAuthStore()
  const {
    conversations,
    activeConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    sendMessage,
    startNewSession,
    deleteSession,
    renameSession,
    setActiveConversationId,
  } = useAIChat()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // 1. Role verification check
  const isTenantOwner = canUseAIChat(user?.role)

  if (!isTenantOwner) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center my-12">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive border border-destructive/20 shadow-inner mb-6 select-none animate-bounce">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Quyền truy cập bị từ chối
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Tính năng Trợ lý AI (AI Chat Assistant) yêu cầu quyền truy cập của **Chủ cửa hàng (Role: TENANT_OWNER)** để có thể đọc các báo cáo doanh thu và thông tin kinh doanh nhạy cảm. Tài khoản của bạn hiện tại không có quyền này.
        </p>
      </div>
    )
  }

  const handleSelectSuggestion = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full flex rounded-none border-y-0 border-x-0 overflow-hidden bg-background shadow-none relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Conversations Sidebar - Responsive & Animatable width */}
        <div className={cn(
          "bg-background flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative h-full",
          isSidebarCollapsed ? "w-0 border-r-0" : "w-[270px] border-r",
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          "lg:relative fixed inset-y-0 left-0 z-50"
        )}>
          {/* Mobile close button */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-muted text-muted-foreground lg:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id)
              setIsSidebarOpen(false)
            }}
            onStartNewConversation={startNewSession}
            onDeleteConversation={deleteSession}
            onRenameConversation={renameSession}
            isSending={isSending}
          />
        </div>

        {/* Chat Panel - Flexible Width */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-md relative h-full">
          
          {/* Sidebar Toggle Button for Desktop - Placed next to sidebar header in chat area */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex absolute left-4 top-4 z-30 h-9 w-9 rounded-xl border bg-background hover:bg-muted shadow-sm items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
            title={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4.5 w-4.5 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4.5 w-4.5 text-muted-foreground" />
            )}
          </button>

          {/* Chat Header */}
          <ChatHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

          {/* Messages Container with strict height/scroll locks */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/5">
            {isLoadingMessages ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="relative flex h-10 w-10 select-none items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="h-5 w-5 animate-spin" />
                </div>
                <div className="text-xs text-muted-foreground animate-pulse">
                  Đang tải lịch sử trò chuyện...
                </div>
              </div>
            ) : (
              <>
                <MessageList
                  messages={messages}
                  isSending={isSending}
                  onSelectSuggestion={handleSelectSuggestion}
                  onSendMessage={sendMessage}
                />

                {/* Message Input */}
                <MessageInput
                  onSendMessage={sendMessage}
                  disabled={isSending || isLoadingMessages}
                  placeholder={
                    activeConversationId 
                      ? "Nhập tin nhắn để tiếp tục cuộc trò chuyện..." 
                      : "Hỏi trợ lý AI về sản phẩm, doanh thu, hoặc xu hướng thị trường..."
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
