import client from "./client";

export interface ChatMessage {
  id?: string;
  role: "user" | "model";
  parts: Array<{ text: string }>;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface SendChatResponse {
  success: boolean;
  data: {
    reply: string;
    conversationId: string;
    title: string;
  };
}

export interface GetConversationsResponse {
  success: boolean;
  data: ChatSession[];
}

export interface GetConversationDetailResponse {
  success: boolean;
  data: ChatSession;
}

export const aiApi = {
  sendChatMessage: async (message: string, conversationId?: string): Promise<SendChatResponse> => {
    const response = await client.post<SendChatResponse>("/ai/chat", { message, conversationId });
    return response.data;
  },

  listConversations: async (): Promise<GetConversationsResponse> => {
    const response = await client.get<GetConversationsResponse>("/ai/conversations");
    return response.data;
  },

  getConversationDetail: async (id: string): Promise<GetConversationDetailResponse> => {
    const response = await client.get<GetConversationDetailResponse>(`/ai/conversations/${id}`);
    return response.data;
  },

  deleteConversation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await client.delete<{ success: boolean; message: string }>(`/ai/conversations/${id}`);
    return response.data;
  },

  renameConversation: async (id: string, title: string): Promise<{ success: boolean; data: ChatSession }> => {
    const response = await client.put<{ success: boolean; data: ChatSession }>(`/ai/conversations/${id}`, { title });
    return response.data;
  },
};
