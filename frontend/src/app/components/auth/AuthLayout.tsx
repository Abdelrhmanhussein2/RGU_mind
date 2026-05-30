import { ReactNode } from "react";
import { Brain } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  variant: "student" | "university";
}

export function AuthLayout({ children, title, subtitle, variant }: AuthLayoutProps) {
  const isStudent = variant === "student";
  const gradientClass = isStudent
    ? "from-indigo-600 via-purple-600 to-indigo-700"
    : "from-purple-600 via-indigo-600 to-purple-700";

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1695370992990-0c24a1c5b111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGVkdWNhdGlvbiUyMHRlY2hub2xvZ3klMjBhYnN0cmFjdHxlbnwxfHx8fDE3NzQ1ODYwNjh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="AI Education"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7" />
            </div>
            <span className="text-3xl font-semibold">ReguMind</span>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            {title}
          </h2>

          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            {subtitle}
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  {isStudent ? "Instant Answers" : "Easy Upload"}
                </p>
                <p className="text-sm text-white/80">
                  {isStudent ? "Get responses based on official regulations" : "Upload regulations in minutes"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  {isStudent ? "Verified Information" : "AI-Powered"}
                </p>
                <p className="text-sm text-white/80">
                  {isStudent ? "All answers cite source documents" : "Advanced RAG technology for accuracy"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  {isStudent ? "24/7 Available" : "Student Support"}
                </p>
                <p className="text-sm text-white/80">
                  {isStudent ? "Ask questions anytime, anywhere" : "Help students understand policies"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">ReguMind</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
