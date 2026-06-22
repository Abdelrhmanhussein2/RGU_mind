import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Settings as SettingsIcon,
  LogOut,
  Home,
  FileText,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useAuth } from "../../store/authStore";
import {
  RegulationSubmission,
  getRegulations,
  approveRegulation,
  rejectRegulation,
} from "../lib/adminRegulations";

type Tab = "pending" | "approved" | "rejected" | "settings";

function RegulationCard({
  regulation,
  children,
}: {
  regulation: RegulationSubmission;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{regulation.documentName}</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Building2 className="w-3.5 h-3.5" />
              {regulation.universityName}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Uploaded {new Date(regulation.uploadDate).toLocaleDateString()} ·{" "}
              {regulation.fileType.toUpperCase()}
            </p>
            {regulation.status === "rejected" && regulation.rejectionReason && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                Reason: {regulation.rejectionReason}
              </p>
            )}
            {regulation.reviewedDate && (
              <p className="text-xs text-gray-400 mt-1">
                Reviewed {new Date(regulation.reviewedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [regulations, setRegulations] = useState<RegulationSubmission[]>(() => getRegulations());
  const [rejectTarget, setRejectTarget] = useState<RegulationSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [profile, setProfile] = useState({
    name: state.user?.name || "Platform Admin",
    email: state.user?.email || "",
  });

  const pending = regulations.filter((r) => r.status === "pending");
  const approved = regulations.filter((r) => r.status === "approved");
  const rejected = regulations.filter((r) => r.status === "rejected");

  const handleApprove = (id: string) => setRegulations(approveRegulation(id));

  const handleConfirmReject = () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setRegulations(rejectRegulation(rejectTarget.id, rejectionReason.trim()));
    setRejectTarget(null);
    setRejectionReason("");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems: { id: Tab; label: string; icon: typeof Clock; count?: number }[] = [
    { id: "pending", label: "Pending Review", icon: Clock, count: pending.length },
    { id: "approved", label: "Approved", icon: CheckCircle2, count: approved.length },
    { id: "rejected", label: "Rejected", icon: XCircle, count: rejected.length },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="text-xs font-semibold bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Home</span>
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

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {activeTab === "pending" && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Review</h2>
            {pending.length === 0 ? (
              <p className="text-gray-500">No regulations awaiting review.</p>
            ) : (
              pending.map((r) => (
                <RegulationCard key={r.id} regulation={r}>
                  <Button size="sm" onClick={() => handleApprove(r.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectTarget(r)}>
                    Reject
                  </Button>
                </RegulationCard>
              ))
            )}
          </div>
        )}

        {activeTab === "approved" && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Approved</h2>
            {approved.length === 0 ? (
              <p className="text-gray-500">No approved regulations yet.</p>
            ) : (
              approved.map((r) => <RegulationCard key={r.id} regulation={r} />)
            )}
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejected</h2>
            {rejected.length === 0 ? (
              <p className="text-gray-500">No rejected regulations.</p>
            ) : (
              rejected.map((r) => <RegulationCard key={r.id} regulation={r} />)
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Profile</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {/* 🔌 BACKEND: PUT /admin/profile */}
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Regulation</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Explain why this document is being rejected..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!rejectionReason.trim()} onClick={handleConfirmReject}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
