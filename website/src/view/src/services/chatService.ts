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
  question: string
): Promise<{ answer: string; sources: Source[] }> {
  const response = await api.post("/retrieval/answer", { query: question });
  const data = response.data.data;

  return {
    answer: data.answer,
    sources: data.sources?.map((s: any) => ({
      title: s.source_document || "Document",
      section: `Page ${s.page_number || "N/A"}`,
    })) || []
  };
}

export async function getChatHistory(): Promise<ChatHistoryItem[]> {
  // Chat history is not yet implemented on the backend.
  return [];
}

export async function deleteChatHistory(id: string): Promise<void> {
  // Not yet implemented on backend
}
