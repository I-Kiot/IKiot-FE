import { useState, useEffect, useCallback } from "react";
import { aiApi, type ChatMessage, type ChatSession } from "@/lib/api/ai";
import { toast } from "sonner";

export function useAIChat() {
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 1. Fetch all conversations list
  const fetchConversations = useCallback(async (selectId?: string) => {
    setIsLoadingConversations(true);
    try {
      const response = await aiApi.listConversations();
      if (response.success) {
        setConversations(response.data);
        // Automatically select the first conversation if we don't have an active one
        if (response.data.length > 0 && !activeConversationId && !selectId) {
          // By default select the most recent one
          setActiveConversationId(response.data[0].id);
        } else if (selectId) {
          setActiveConversationId(selectId);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch conversations list:", error);
      toast.error("Không thể tải danh sách cuộc trò chuyện.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [activeConversationId]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. Fetch messages for active conversation
  const fetchActiveMessages = useCallback(async () => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    try {
      const response = await aiApi.getConversationDetail(activeConversationId);
      if (response.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch conversation detail:", error);
      toast.error("Không thể tải chi tiết cuộc trò chuyện.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeConversationId]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    fetchActiveMessages();
  }, [activeConversationId, fetchActiveMessages]);

  // 3. Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    const userMsg: ChatMessage = {
      role: "user",
      parts: [{ text: content }],
      createdAt: new Date().toISOString(),
    };

    // Optimistically add user message to list
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      // If activeConversationId is null, we create a new session
      const response = await aiApi.sendChatMessage(content, activeConversationId || undefined);
      if (response.success) {
        const modelMsg: ChatMessage = {
          role: "model",
          parts: [{ text: response.data.reply }],
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, modelMsg]);

        // Refresh list and make sure we select the newly created session
        if (!activeConversationId) {
          await fetchConversations(response.data.conversationId);
        } else {
          // Just refresh list to keep order/titles updated
          await fetchConversations(activeConversationId);
        }
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      
      const defaultErrorReply = "Xin lỗi, tôi đang có chút xíu việc bận ngay lúc này. Hãy nhờ tôi vào một lúc sau nha.";
      const modelMsg: ChatMessage = {
        role: "model",
        parts: [{ text: defaultErrorReply }],
        createdAt: new Date().toISOString(),
      };
      
      // Keep user message and append the default model message on error
      setMessages((prev) => [...prev, modelMsg]);
      
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi gửi tin nhắn.");
    } finally {
      setIsSending(false);
    }
  };

  // 4. Create new clean session
  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  // 5. Delete session
  const deleteSession = async (id: string) => {
    try {
      const response = await aiApi.deleteConversation(id);
      if (response.success) {
        toast.success("Đã xóa cuộc hội thoại.");
        
        // If we deleted the active conversation, select another or start new
        if (activeConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
            setConversations(remaining);
          } else {
            startNewSession();
            setConversations([]);
          }
        } else {
          setConversations((prev) => prev.filter((c) => c.id !== id));
        }
      }
    } catch (error: any) {
      console.error("Failed to delete conversation:", error);
      toast.error("Không thể xóa cuộc trò chuyện.");
    }
  };

  // 6. Rename session
  const renameSession = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const response = await aiApi.renameConversation(id, newTitle);
      if (response.success) {
        toast.success("Đã đổi tên cuộc hội thoại.");
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
      }
    } catch (error: any) {
      console.error("Failed to rename conversation:", error);
      toast.error("Không thể đổi tên cuộc trò chuyện.");
    }
  };

  return {
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
  };
}
