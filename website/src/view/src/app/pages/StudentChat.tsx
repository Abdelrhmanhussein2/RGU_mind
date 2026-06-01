import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Brain,
  Send,
  Plus,
  MessageSquare,
  User,
  LogOut,
  Copy,
  BookOpen,
  ChevronDown,
  Home,
  Sparkles,
} from "lucide-react";
import { sendMessage, getChatHistory } from "../../services/chatService";
import { logout } from "../../services/authService";
import { useAuth } from "../../store/authStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; section: string }[];
}

interface Chat {
  id: string;
  title: string;
  timestamp: string;
}

export function StudentChat() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<string | null>(null);

  const exampleQuestions = [
    "What happens if I fail a course?",
    "What is the maximum credit load per semester?",
    "How is my GPA calculated?",
    "What are the attendance requirements?",
  ];

  useEffect(() => {
    // 🔌 BACKEND: replace mock with real getChatHistory call
    getChatHistory().then(setChats);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 🔌 BACKEND: replace mock with real sendMessage call
      const { answer, sources } = await sendMessage(userMessage.content);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
        sources,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleLogout = () => {
    logout();
    authLogout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">ReguMind</span>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-auto p-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
            Recent Chats
          </div>
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-left transition-colors group"
              >
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate font-medium">{chat.title}</p>
                  <p className="text-xs text-gray-500">{chat.timestamp}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-3 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-auto">
          {messages.length === 0 ? (
            // Empty State
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-2xl text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-indigo-600" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Ask any question about your academic regulations
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Get instant, accurate answers based on official university policies
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question)}
                      className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 group-hover:text-indigo-700">
                          {question}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`flex-1 max-w-2xl ${message.role === "user" ? "flex justify-end" : ""}`}>
                    <div
                      className={`rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className={`leading-relaxed whitespace-pre-line ${
                        message.role === "user" ? "text-white" : "text-gray-900"
                      }`}>
                        {message.content}
                      </p>

                      {message.role === "assistant" && (
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </button>

                          {message.sources && message.sources.length > 0 && (
                            <button
                              onClick={() =>
                                setShowSources(
                                  showSources === message.id ? null : message.id
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Sources ({message.sources.length})</span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  showSources === message.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      )}

                      {message.role === "assistant" &&
                        showSources === message.id &&
                        message.sources && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                            {message.sources.map((source, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                              >
                                <p className="text-sm font-medium text-indigo-900">
                                  {source.title}
                                </p>
                                <p className="text-xs text-indigo-700 mt-1">
                                  {source.section}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about your academic regulations..."
                rows={1}
                className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                style={{ minHeight: "52px", maxHeight: "200px" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-2">
              ReguMind provides answers based on official university regulations. Always verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
