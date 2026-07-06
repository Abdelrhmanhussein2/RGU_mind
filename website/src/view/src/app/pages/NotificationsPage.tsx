import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { ArrowLeft, Bell, BellOff, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import {
  NotificationItem,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notifications";

type Filter = "all" | "unread" | "read";

function NotificationRow({
  notification,
  onClick,
}: {
  notification: NotificationItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
        notification.read ? "bg-white" : "bg-indigo-50/60"
      }`}
    >
      {!notification.read && (
        <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
      )}
      <div className={notification.read ? "ml-5" : ""}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          {!notification.read && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
              New
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
      </div>
    </button>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  const handleClick = (id: string) => setNotifications(markNotificationRead(id));
  const handleMarkAllRead = () => setNotifications(markAllNotificationsRead());

  const emptyMessage =
    filter === "unread"
      ? "No unread notifications"
      : filter === "read"
        ? "No read notifications"
        : "No notifications yet";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/student/chat")} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Bell className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
              <Check className="w-4 h-4" /> Mark all as read
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BellOff className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              {emptyMessage}
            </div>
          ) : (
            filtered.map((n) => (
              <NotificationRow key={n.id} notification={n} onClick={() => handleClick(n.id)} />
            ))
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
