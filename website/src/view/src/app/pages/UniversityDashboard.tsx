import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, FileText, Settings, CheckCircle, Clock, Brain, LogOut, Home } from "lucide-react";
import { getDocuments, uploadDocuments, resetRegulation } from "../../services/documentService";
import { logout, updateUniversityProfile } from "../../services/authService";
import { useAuth } from "../../store/authStore";
import { AcademicPlansManager } from "../../components/admin/AcademicPlansManager";

interface Document {
  id: string;
  name: string;
  status: "processing" | "completed";
  uploadedAt: string;
}

export function UniversityDashboard() {
  const navigate = useNavigate();
  const { state, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState<"upload" | "documents" | "academic_plans" | "settings">("upload");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [facultyName, setFacultyName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  
  // Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFacultyName, setResetFacultyName] = useState("");
  const [resetDepartmentName, setResetDepartmentName] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // Toast state
  const [successToastMessage, setSuccessToastMessage] = useState("");

  // Profile Update state
  const [profileName, setProfileName] = useState(state.user?.name || "");
  const [profileEmail, setProfileEmail] = useState(state.user?.email || "");
  const [isProfilePasswordModalOpen, setIsProfilePasswordModalOpen] = useState(false);
  const [profilePassword, setProfilePassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll for status updates if any document is processing
  useEffect(() => {
    const isProcessing = documents.some((doc) => doc.status === "processing");
    if (!isProcessing) return;

    const intervalId = setInterval(() => {
      fetchDocuments();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [documents]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    setPendingFiles(Array.from(files));
    setIsModalOpen(true);
  };

  const handleConfirmUpload = async () => {
    if (!facultyName || !departmentName) return;
    setIsModalOpen(false);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress bar while upload runs in background
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const newDocs = await uploadDocuments(pendingFiles, facultyName, departmentName);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setFacultyName("");
        setDepartmentName("");
        setPendingFiles([]);
        fetchDocuments(); // Refresh list to get real IDs from backend
      }, 400);
    } catch (e) {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPendingFiles([]);
  };

  const handleResetRegulation = async () => {
    if (!resetFacultyName || !resetDepartmentName) return;
    setIsResetting(true);
    try {
      await resetRegulation(resetFacultyName, resetDepartmentName);
      setSuccessToastMessage(`Successfully reset regulations for ${resetFacultyName} - ${resetDepartmentName}`);
      setTimeout(() => setSuccessToastMessage(""), 5000);
      setIsResetModalOpen(false);
      setResetFacultyName("");
      setResetDepartmentName("");
      fetchDocuments();
    } catch (e: any) {
      alert("Failed to reset regulations: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    logout();
    authLogout();
    navigate("/");
  };

  const handleUpdateProfile = async () => {
    if (!profilePassword) return;
    setIsUpdatingProfile(true);
    try {
      await updateUniversityProfile(profileName, profileEmail, profilePassword);
      setSuccessToastMessage("Successfully updated profile");
      setTimeout(() => setSuccessToastMessage(""), 5000);
      setIsProfilePasswordModalOpen(false);
      setProfilePassword("");
    } catch (e: any) {
      alert("Failed to update profile: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">ReguMind</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "upload"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Regulations</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "documents"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Documents</span>
          </button>

          <button
            onClick={() => setActiveTab("academic_plans")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "academic_plans"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Academic Plans</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            {activeTab === "upload" && "Upload Regulations"}
            {activeTab === "documents" && "Documents"}
            {activeTab === "academic_plans" && "Academic Plans"}
            {activeTab === "settings" && "Settings"}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeTab === "upload" && "Upload your academic regulations for AI processing"}
            {activeTab === "documents" && "Manage your uploaded documents"}
            {activeTab === "academic_plans" && "Manage academic plans for your faculties and departments"}
            {activeTab === "settings" && "Configure your university settings"}
          </p>
        </header>

        <div className="p-8">
          {activeTab === "upload" && (
            <div className="max-w-4xl">
              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 bg-white hover:border-indigo-400"
                }`}
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your files here
                </h3>
                <p className="text-gray-600 mb-6">
                  or click to browse from your computer
                </p>

                <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Select Files</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx"
                    multiple
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </label>

                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: PDF, DOCX (Max 50MB per file)
                </p>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Uploading...</span>
                    <span className="text-sm text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Helper Text */}
              <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h4 className="font-semibold text-indigo-900 mb-2">How it works</h4>
                <ul className="space-y-2 text-sm text-indigo-800">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>Upload your academic regulation documents (PDF or DOCX format)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>Our AI will process and analyze the documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>Students can then ask questions and get accurate answers based on your regulations</span>
                  </li>
                </ul>
              </div>

              {/* Upload Modal */}
              {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Regulation Details</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Please specify the faculty and department for the {pendingFiles.length} selected file(s).
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Engineering"
                          value={facultyName}
                          onChange={(e) => setFacultyName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Computer Science"
                          value={departmentName}
                          onChange={(e) => setDepartmentName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmUpload}
                        disabled={!facultyName || !departmentName}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="max-w-4xl">
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-600" />
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-600">Uploaded {doc.uploadedAt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status === "completed" ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Processing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-4xl">
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-6">University Information</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      University Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter university name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="admin@university.edu"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button 
                    onClick={() => setIsProfilePasswordModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    Save Changes
                  </button>

                  <hr className="my-6 border-gray-200" />
                  
                  <div>
                    <h4 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h4>
                    <p className="text-sm text-gray-600 mb-4">Reset regulations and documents for a specific faculty and department.</p>
                    <button 
                      onClick={() => setIsResetModalOpen(true)}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                      Reset Regulations
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "academic_plans" && (
            <AcademicPlansManager />
          )}
        </div>
      </main>

      {/* Password Modal */}
      {isProfilePasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Changes</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please enter your password to confirm and save these changes.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsProfilePasswordModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={!profilePassword || isUpdatingProfile}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isUpdatingProfile ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">Reset Regulations</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please specify the faculty and department to reset. This action cannot be undone.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  placeholder="e.g., Engineering"
                  value={resetFacultyName}
                  onChange={(e) => setResetFacultyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Science"
                  value={resetDepartmentName}
                  onChange={(e) => setResetDepartmentName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleResetRegulation}
                disabled={!resetFacultyName || !resetDepartmentName || isResetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-gray-900 font-medium">{successToastMessage}</p>
            <button 
              onClick={() => setSuccessToastMessage("")}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
