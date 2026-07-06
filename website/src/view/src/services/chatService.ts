import api from "./api";

export interface Source {
  title: string;
  section: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

export async function sendMessage(
  question: string,
  sessionId?: string
): Promise<{ answer: string; sources: Source[]; sessionId?: string }> {
  const payload: any = { query: question };
  if (sessionId) {
    payload.session_id = sessionId;
  }
  
  const response = await api.post("/retrieval/answer", payload);
  const data = response.data.data;

  return {
    answer: data.answer,
    sessionId: data.session_id,
    sources: data.sources?.map((s: any) => ({
      title: s.source_document || "Document",
      section: `Page ${s.page_number || "N/A"}`,
    })) || []
  };
}

export async function getChatHistory(): Promise<ChatHistoryItem[]> {
  try {
    const response = await api.get("/student/chat/sessions");
    return response.data.data.map((s: any) => ({
      id: s.id,
      title: s.title,
      timestamp: new Date(s.updated_at).toLocaleString(),
    }));
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return [];
  }
}

export async function getChatMessages(sessionId: string): Promise<Message[]> {
  try {
    const response = await api.get(`/student/chat/sessions/${sessionId}/messages`);
    return response.data.data.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources,
    }));
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return [];
  }
}

export async function deleteChatHistory(id: string): Promise<void> {
  try {
    await api.delete(`/student/chat/sessions/${id}`);
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    throw error;
  }
}
