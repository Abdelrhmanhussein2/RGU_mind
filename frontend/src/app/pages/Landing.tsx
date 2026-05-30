import { useNavigate } from "react-router";
import { GraduationCap, Building2, Sparkles, BookOpen, Shield, Brain } from "lucide-react";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">ReguMind</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Academic Assistant</span>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Understand Your Academic
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Regulations Instantly
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            ReguMind uses advanced AI to help you navigate complex university regulations 
            with accurate, reliable answers based on official documentation.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* Student Card */}
          <button
            onClick={() => navigate("/student/signin")}
            className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:scale-105 text-left"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">I am a Student</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Get instant answers to questions about your university's academic regulations, 
              policies, and procedures.
            </p>
            
            <div className="flex items-center text-indigo-600 font-medium">
              <span>Start asking questions</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>

          {/* University Card */}
          <button
            onClick={() => navigate("/university/signin")}
            className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:scale-105 text-left"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">I am a University</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Upload your academic regulations and provide students with an AI-powered 
              assistant to help them understand your policies.
            </p>
            
            <div className="flex items-center text-purple-600 font-medium">
              <span>Upload regulations</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Accurate & Reliable</h4>
            <p className="text-sm text-gray-600">
              Answers based strictly on official university regulations
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">AI-Powered</h4>
            <p className="text-sm text-gray-600">
              Advanced RAG technology for intelligent responses
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Easy to Use</h4>
            <p className="text-sm text-gray-600">
              Simple chat interface for quick answers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
