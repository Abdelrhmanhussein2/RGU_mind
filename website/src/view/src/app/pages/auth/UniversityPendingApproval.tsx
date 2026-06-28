import { useNavigate } from "react-router";
import { CheckCircle2, Clock } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";

export function UniversityPendingApproval() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      variant="university"
      title="Registration Received"
      subtitle="Your university account request is currently under review by our administration team."
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pending Approval</h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Thank you for confirming your email. Your account is now <span className="font-semibold text-purple-600">pending admin approval</span>. We will review your uploaded verification documents to ensure authenticity. 
        </p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 text-left mb-8 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p>Email address verified successfully.</p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p>Awaiting administrator to review your verification file.</p>
          </div>
          <p className="pl-7 mt-2 text-gray-500">
            You will receive an email once your account has been approved. You can then log in to access the university dashboard.
          </p>
        </div>

        <button
          onClick={() => navigate("/university/signin")}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          Return to Sign In
        </button>
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
