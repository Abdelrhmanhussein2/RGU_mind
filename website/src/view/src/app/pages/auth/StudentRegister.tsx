import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, User, Building2, Eye, EyeOff, ChevronDown, IdCard, BookOpen, Layers, FileText } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { PasswordStrengthIndicator } from "../../components/auth/PasswordStrengthIndicator";
import { registerStudent } from "../../../services/authService";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../../components/ui/collapsible";

export function StudentRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAcademicPlan, setShowAcademicPlan] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    university: "",
    email: "",
    password: "",
    confirmPassword: "",
    faculty: "",
    department: "",
    studentId: "",
    enrollmentYear: new Date().getFullYear(),
    expectedGraduationYear: new Date().getFullYear() + 4,
  });
  const [academicPlan, setAcademicPlan] = useState({
    totalRequiredCreditHours: 0,
    mandatoryCreditHours: 0,
    electiveCreditHours: 0,
    majorCreditHours: 0,
  });
  const [curriculumPdf, setCurriculumPdf] = useState<{ name: string; base64: string } | undefined>(undefined);

  const handleCurriculumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCurriculumPdf({ name: file.name, base64: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      // 🔌 BACKEND: replace mock with real registerStudent call
      const { user, token } = await registerStudent(
        formData.fullName,
        formData.university,
        formData.email,
        formData.password
      );

      // Registration requires OTP verification before the account is fully active —
      // user/token from this response are carried forward and only applied via login()
      // once verify-register-otp succeeds (see StudentRegisterOtp.tsx).
      navigate("/student/verify-register-otp", {
        state: {
          email: formData.email,
          user,
          token,
          profileData: {
            fullName: formData.fullName,
            studentId: formData.studentId,
            university: formData.university,
            faculty: formData.faculty,
            department: formData.department,
            enrollmentYear: formData.enrollmentYear,
            expectedGraduationYear: formData.expectedGraduationYear,
            totalRequiredCreditHours: academicPlan.totalRequiredCreditHours,
            mandatoryCreditHours: academicPlan.mandatoryCreditHours,
            electiveCreditHours: academicPlan.electiveCreditHours,
            majorCreditHours: academicPlan.majorCreditHours,
            curriculumPdfName: curriculumPdf?.name,
            curriculumPdfBase64: curriculumPdf?.base64,
          },
        },
      });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="student"
      title="Join ReguMind Today"
      subtitle="Create your account and get instant access to AI-powered academic regulation assistance."
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Sign up to start asking questions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="Your University"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="Computer Science"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Software Engineering"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="20210001"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Year</label>
              <input
                type="number"
                value={formData.enrollmentYear}
                onChange={(e) =>
                  setFormData({ ...formData, enrollmentYear: Number(e.target.value) || 0 })
                }
                placeholder="2021"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Graduation Year
              </label>
              <input
                type="number"
                value={formData.expectedGraduationYear}
                onChange={(e) =>
                  setFormData({ ...formData, expectedGraduationYear: Number(e.target.value) || 0 })
                }
                placeholder="2025"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <Collapsible open={showAcademicPlan} onOpenChange={setShowAcademicPlan}>
            <CollapsibleTrigger
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>Academic Plan Details (Optional)</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAcademicPlan ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Required Credit Hours
                  </label>
                  <input
                    type="number"
                    value={academicPlan.totalRequiredCreditHours}
                    onChange={(e) =>
                      setAcademicPlan({
                        ...academicPlan,
                        totalRequiredCreditHours: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mandatory Credit Hours
                  </label>
                  <input
                    type="number"
                    value={academicPlan.mandatoryCreditHours}
                    onChange={(e) =>
                      setAcademicPlan({
                        ...academicPlan,
                        mandatoryCreditHours: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elective Credit Hours
                  </label>
                  <input
                    type="number"
                    value={academicPlan.electiveCreditHours}
                    onChange={(e) =>
                      setAcademicPlan({
                        ...academicPlan,
                        electiveCreditHours: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major Credit Hours
                  </label>
                  <input
                    type="number"
                    value={academicPlan.majorCreditHours}
                    onChange={(e) =>
                      setAcademicPlan({
                        ...academicPlan,
                        majorCreditHours: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload your faculty curriculum (optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCurriculumChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {curriculumPdf && (
                  <p className="text-xs text-indigo-600 mt-1.5">Selected: {curriculumPdf.name}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@university.edu"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/student/signin")}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-6 text-center w-full text-gray-600 hover:text-gray-900"
      >
        ← Back to home
      </button>
    </AuthLayout>
  );
}
