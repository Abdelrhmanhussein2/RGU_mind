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

// 🔌 BACKEND: POST /chat  { question }  → { answer, sources }
export async function sendMessage(
  question: string
): Promise<{ answer: string; sources: Source[] }> {
  void api; // will be: return (await api.post("/chat", { question })).data
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          answer: `Based on the university's academic regulations, here is the answer to your question about "${question}".\n\nPlease consult official documentation for the most up-to-date information.`,
          sources: [
            {
              title: "Academic Regulations 2024",
              section: "Section 1.1: General Provisions",
            },
          ],
        }),
      1500
    )
  );
}

// 🔌 BACKEND: GET /chat/history  → ChatHistoryItem[]
export async function getChatHistory(): Promise<ChatHistoryItem[]> {
  void api; // will be: return (await api.get("/chat/history")).data
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          { id: "1", title: "Course retake policy", timestamp: "2 hours ago" },
          { id: "2", title: "Maximum credit hours", timestamp: "Yesterday" },
          { id: "3", title: "Grading system questions", timestamp: "3 days ago" },
        ]),
      300
    )
  );
}

// 🔌 BACKEND: DELETE /chat/history/:id
export async function deleteChatHistory(id: string): Promise<void> {
  void api; // will be: await api.delete(`/chat/history/${id}`)
  return new Promise((resolve) => setTimeout(resolve, 300));
}
