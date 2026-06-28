import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";
import { verifyRegisterOtp, resendRegisterOtp } from "../../../services/authService";
import { useAuth } from "../../../store/authStore";
import { createStudentProfile, StudentProfile } from "../../lib/studentProfile";

export function StudentRegisterOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email || "your email";
  const user = location.state?.user;
  const token = location.state?.token;
  const profileData = location.state?.profileData as StudentProfile | undefined;
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setCanResend(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setError("");
    setIsLoading(true);
    try {
      const response = await verifyRegisterOtp(email, otp, "student");

      // Force localStorage update synchronously so api interceptor picks it up immediately
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Update React state
      login(response.user, response.token);

      if (profileData) {
        await createStudentProfile(profileData);
      }

      navigate("/student/chat");
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Invalid or expired code, or profile creation failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    try {
      await resendRegisterOtp(email, "student");
    } catch {
      // ignore — cooldown still resets below so the user can retry
    }
    setTimeout(() => setCanResend(true), 30000);
  };

  return (
    <AuthLayout
      variant="student"
      title="Verify Your Identity"
      subtitle="We've sent a 6-digit verification code to your email. Enter it below to finish creating your account."
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <button
          onClick={() => navigate("/student/register")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
          <p className="text-gray-600">
            We sent a code to <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              6-Digit Code
            </label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {canResend ? "Resend Code" : "Resend in 30s"}
            </button>
          </div>

          <button
            type="submit"
            disabled={otp.length !== 6 || isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
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
