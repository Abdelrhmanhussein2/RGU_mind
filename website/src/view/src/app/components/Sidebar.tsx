import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Brain,
  Plus,
  MessageSquare,
  Home,
  GraduationCap,
  Bell,
  CalendarClock,
  LogOut,
} from "lucide-react";
import { getChatHistory, deleteChatHistory } from "../../services/chatService";
import { logout } from "../../services/authService";
import { useAuth } from "../../store/authStore";

interface Chat {
  id: string;
  title: string;
  timestamp: string;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: authLogout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    getChatHistory().then((data) => {
      if (data) setChats(data);
    });
  }, [location.search]);

  const handleLogout = () => {
    logout();
    authLogout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div 
          onClick={() => navigate("/student/chat")}
          className="flex items-center gap-2 mb-4 cursor-pointer"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">ReguMind</span>
        </div>

        <button 
          onClick={() => navigate("/student/chat")}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md active:scale-[0.98]"
        >
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
            <div key={chat.id} className="relative group flex items-center">
              <button
                onClick={() => navigate(`/student/chat?id=${chat.id}`)}
                className={`flex-1 flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  location.search === `?id=${chat.id}` ? "bg-indigo-50" : "hover:bg-gray-100"
                }`}
              >
                <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  location.search === `?id=${chat.id}` ? "text-indigo-600" : "text-gray-400"
                }`} />
                <div className="flex-1 min-w-0 pr-6">
                  <p className={`text-sm truncate font-medium ${
                    location.search === `?id=${chat.id}` ? "text-indigo-900" : "text-gray-900"
                  }`}>{chat.title}</p>
                  <p className="text-xs text-gray-500 truncate">{chat.timestamp}</p>
                </div>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatToDelete(chat.id);
                }}
                className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 rounded-md"
                title="Delete Chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chat</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setChatToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (chatToDelete) {
                    try {
                      await deleteChatHistory(chatToDelete);
                      setChats((prev) => prev.filter((c) => c.id !== chatToDelete));
                      if (location.search === `?id=${chatToDelete}`) {
                        navigate("/student/chat");
                      }
                    } catch (error) {
                      console.error("Failed to delete chat", error);
                    } finally {
                      setChatToDelete(null);
                    }
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Options Section */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <button
          onClick={() => navigate("/")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
            isActive("/") 
              ? "bg-indigo-50 text-indigo-600" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => navigate("/student/academic-profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
            isActive("/student/academic-profile") 
              ? "bg-indigo-50 text-indigo-600" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          <span>Academic Profile</span>
        </button>

        <button
          onClick={() => navigate("/student/notifications")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
            isActive("/student/notifications") 
              ? "bg-indigo-50 text-indigo-600" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => navigate("/student/study-planner")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
            isActive("/student/study-planner") 
              ? "bg-indigo-50 text-indigo-600" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <CalendarClock className="w-5 h-5" />
          <span>Study Planner</span>
        </button>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
