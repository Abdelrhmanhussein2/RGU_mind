import { useState, useEffect } from "react";
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
import {
  UniversitySubmission,
  getUniversitySubmissions,
  approveUniversity,
  rejectUniversity,
} from "../lib/adminUniversities";
import api from "../../services/api";

import { AcademicPlansManager } from "../../components/admin/AcademicPlansManager";

type Tab = "pending" | "approved" | "rejected" | "universities" | "academic_plans" | "settings";

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
        <div className="flex items-center gap-2 flex-shrink-0">
          {regulation.fileUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
                const fileUrl = regulation.fileUrl!.replace(/\\/g, '/');
                window.open(`${baseUrl}/${fileUrl}`, '_blank');
              }}
            >
              View Document
            </Button>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { state, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [regulations, setRegulations] = useState<RegulationSubmission[]>([]);
  const [universities, setUniversities] = useState<UniversitySubmission[]>([]);
  const [rejectTarget, setRejectTarget] = useState<RegulationSubmission | null>(null);
  const [viewUniversity, setViewUniversity] = useState<UniversitySubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [profile, setProfile] = useState({
    name: state.user?.name || "Platform Admin",
    email: state.user?.email || "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const loadRegulations = async () => {
    const data = await getRegulations();
    setRegulations(data);
  };

  const loadUniversities = async () => {
    const data = await getUniversitySubmissions();
    setUniversities(data);
  };

  useEffect(() => {
    loadRegulations();
    loadUniversities();
  }, []);

  const pending = regulations.filter((r) => r.status === "pending");
  const approved = regulations.filter((r) => r.status === "approved");
  const rejected = regulations.filter((r) => r.status === "rejected");
  const pendingUniversities = universities.filter((u) => u.status === "pending");
  const approvedUniversities = universities.filter((u) => u.status === "approved");
  const rejectedUniversities = universities.filter((u) => u.status === "rejected");

  const renderUniversityCard = (u: UniversitySubmission, showActions = false) => (
    <Card key={u.id}>
      <CardContent className="pt-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{u.name}</p>
            <p className="text-sm text-gray-500 mt-1">{u.contactEmail} · {u.country}</p>
            <p className="text-xs text-gray-400 mt-1">
              Submitted {new Date(u.submittedDate).toLocaleDateString()}
              {u.verificationFileUrl && <> · {u.verificationFileUrl}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={() => setViewUniversity(u)}>
            View
          </Button>
          {showActions && (
            <>
              <Button size="sm" onClick={() => handleApproveUniversity(u.id)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRejectUniversity(u.id)}>
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const handleApprove = async (id: string) => {
    try {
      await approveRegulation(id);
      await loadRegulations();
    } catch (err) {
      console.error("Failed to approve regulation:", err);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    try {
      await rejectRegulation(rejectTarget.id, rejectionReason.trim());
      setRejectTarget(null);
      setRejectionReason("");
      await loadRegulations();
    } catch (err) {
      console.error("Failed to reject regulation:", err);
    }
  };

  const handleApproveUniversity = async (id: string) => {
    try {
      await approveUniversity(id);
      await loadUniversities();
    } catch (err) {
      console.error("Failed to approve university:", err);
    }
  };

  const handleRejectUniversity = async (id: string) => {
    try {
      await rejectUniversity(id);
      await loadUniversities();
    } catch (err) {
      console.error("Failed to reject university:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    setSaveStatus("saving");
    try {
      const response = await api.put("/admin/profile", {
        name: profile.name,
        email: profile.email,
      });
      if (state.token) {
        login(
          {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            role: "admin",
          },
          state.token
        );
      }
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="text-xl font-bold">Admin Console</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "pending", label: "Pending Review", icon: Clock, count: pending.length },
            { id: "approved", label: "Approved", icon: CheckCircle2, count: approved.length + approvedUniversities.length },
            { id: "rejected", label: "Rejected", icon: XCircle, count: rejected.length + rejectedUniversities.length },
            { id: "universities", label: "Pending Universities", icon: Building2, count: pendingUniversities.length },
            { id: "academic_plans", label: "Academic Plans", icon: FileText as any, count: 0 },
            { id: "settings", label: "Settings", icon: SettingsIcon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-purple-600" : "text-gray-400"}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 space-y-1">
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
          <div className="space-y-8 max-w-3xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Approved Regulations</h2>
              <div className="space-y-4">
                {approved.length === 0 ? (
                  <p className="text-gray-500">No approved regulations yet.</p>
                ) : (
                  approved.map((r) => <RegulationCard key={r.id} regulation={r} />)
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Approved Universities</h2>
              <div className="space-y-4">
                {approvedUniversities.length === 0 ? (
                  <p className="text-gray-500">No approved universities yet.</p>
                ) : (
                  approvedUniversities.map((u) => renderUniversityCard(u, false))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="space-y-8 max-w-3xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Rejected Regulations</h2>
              <div className="space-y-4">
                {rejected.length === 0 ? (
                  <p className="text-gray-500">No rejected regulations.</p>
                ) : (
                  rejected.map((r) => <RegulationCard key={r.id} regulation={r} />)
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Rejected Universities</h2>
              <div className="space-y-4">
                {rejectedUniversities.length === 0 ? (
                  <p className="text-gray-500">No rejected universities.</p>
                ) : (
                  rejectedUniversities.map((u) => renderUniversityCard(u, false))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "universities" && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Universities</h2>
            {pendingUniversities.length === 0 ? (
              <p className="text-gray-500">No universities awaiting approval.</p>
            ) : (
              pendingUniversities.map((u) => (
                <Card key={u.id}>
                  <CardContent className="pt-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{u.contactEmail} · {u.country}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted {new Date(u.submittedDate).toLocaleDateString()}
                          {u.verificationFileUrl && <> · {u.verificationFileUrl}</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setViewUniversity(u)}>
                        View
                      </Button>
                      <Button size="sm" onClick={() => handleApproveUniversity(u.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectUniversity(u.id)}>
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
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
                <div className="flex items-center gap-4">
                  <Button onClick={handleSaveProfile} disabled={saveStatus === "saving"}>
                    {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                  </Button>
                  {saveStatus === "success" && (
                    <span className="text-sm font-medium text-emerald-600">
                      Changes saved successfully!
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-sm font-medium text-rose-600">
                      Failed to save changes.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "academic_plans" && (
          <AcademicPlansManager />
        )}
      </main>

      <Dialog open={!!viewUniversity} onOpenChange={(v) => !v && setViewUniversity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>University Details</DialogTitle>
          </DialogHeader>
          {viewUniversity && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base text-gray-900">{viewUniversity.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900">{viewUniversity.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Country</p>
                <p className="text-base text-gray-900">{viewUniversity.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted Date</p>
                <p className="text-base text-gray-900">
                  {new Date(viewUniversity.submittedDate).toLocaleDateString()}
                </p>
              </div>
              {viewUniversity.verificationFileUrl && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">Verification File</p>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
                      const fileUrl = viewUniversity.verificationFileUrl.replace(/\\/g, '/');
                      window.open(`${baseUrl}/${fileUrl}`, '_blank');
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Uploaded File
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUniversity(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
