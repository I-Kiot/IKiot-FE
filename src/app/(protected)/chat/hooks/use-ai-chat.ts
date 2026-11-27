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

  // 1. Lấy toàn bộ danh sách hội thoại
  const fetchConversations = useCallback(async (selectId?: string) => {
    setIsLoadingConversations(true);
    try {
      const response = await aiApi.listConversations();
      if (response.success) {
        setConversations(response.data);
        // Tự chọn hội thoại đầu tiên nếu chưa có hội thoại đang chọn
        if (response.data.length > 0 && !activeConversationId && !selectId) {
          // Mặc định chọn hội thoại mới nhất
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

  // Tải hội thoại khi mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. Lấy tin nhắn của hội thoại đang chọn
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

  // Tải lại tin nhắn mỗi khi hội thoại đang chọn đổi
  useEffect(() => {
    fetchActiveMessages();
  }, [activeConversationId, fetchActiveMessages]);

  // 3. Gửi tin nhắn
  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    const userMsg: ChatMessage = {
      role: "user",
      parts: [{ text: content }],
      createdAt: new Date().toISOString(),
    };

    // Thêm tin nhắn người dùng vào danh sách trước (optimistic)
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      // Nếu activeConversationId là null thì tạo phiên mới
      const response = await aiApi.sendChatMessage(content, activeConversationId || undefined);
      if (response.success) {
        const modelMsg: ChatMessage = {
          role: "model",
          parts: [{ text: response.data.reply }],
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, modelMsg]);

        // Làm mới danh sách và chọn phiên vừa tạo
        if (!activeConversationId) {
          await fetchConversations(response.data.conversationId);
        } else {
          // Chỉ làm mới danh sách để cập nhật thứ tự/tiêu đề
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
      
      // Giữ tin nhắn người dùng và thêm tin nhắn mặc định của model khi lỗi
      setMessages((prev) => [...prev, modelMsg]);
      
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi gửi tin nhắn.");
    } finally {
      setIsSending(false);
    }
  };

  // 4. Tạo phiên mới trống
  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  // 5. Xoá phiên
  const deleteSession = async (id: string) => {
    try {
      const response = await aiApi.deleteConversation(id);
      if (response.success) {
        toast.success("Đã xóa cuộc hội thoại.");
        
        // Nếu xoá hội thoại đang chọn thì chọn hội thoại khác hoặc tạo mới
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

  // 6. Đổi tên phiên
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
