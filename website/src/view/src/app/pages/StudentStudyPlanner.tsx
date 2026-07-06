import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2, Loader2, Clock, BookOpen, Coffee } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  StudyPlanItem,
  StudyPlannerRequest,
  StudyPlannerResponse,
  generateDailyStudyPlan,
} from "../../lib/studyPlanner";


interface Subject {
  id: string;
  name: string;
  weight: number;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function PlanItemCard({ item, index }: { item: StudyPlanItem; index: number }) {
  const isBreak = item.type === "break";
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${
        isBreak
          ? "bg-gray-50 border-gray-200"
          : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
      }`}
    >
      <span
        className={`text-xs font-bold w-6 text-center flex-shrink-0 ${
          isBreak ? "text-gray-400" : "text-indigo-500"
        }`}
      >
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <Coffee className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          )}
          <span
            className={`text-sm font-medium truncate ${
              isBreak ? "text-gray-600" : "text-indigo-900"
            }`}
          >
            {isBreak ? "Break" : item.subject}
          </span>
        </div>
        {item.display_time && (
          <p className="text-xs text-gray-500 mt-0.5 ml-6">{item.display_time}</p>
        )}
      </div>
      <span
        className={`text-sm font-semibold flex-shrink-0 ${
          isBreak ? "text-gray-500" : "text-indigo-700"
        }`}
      >
        {item.minutes}m
      </span>
    </div>
  );
}

export function StudentStudyPlanner() {
  const navigate = useNavigate();

  const [totalHours, setTotalHours] = useState<number>(4);
  const [breakMinutes, setBreakMinutes] = useState<number>(15);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "", weight: 5 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<StudyPlannerResponse | null>(null);

  const addSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: "", weight: 5 },
    ]);
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubject = (id: string, patch: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const validate = (): string => {
    if (!totalHours || totalHours <= 0) return "Total hours cannot be 0 or empty.";
    if (totalHours > 24) return "Total hours cannot exceed 24.";
    if (!breakMinutes || breakMinutes < 5) return "Break duration must be at least 5 minutes.";
    if (breakMinutes > 60) return "Break duration cannot exceed 60 minutes.";
    if (breakMinutes > totalHours * 60) return "Break duration cannot exceed total available minutes.";
    if (subjects.length === 0) return "Add at least one subject.";
    for (const s of subjects) {
      if (!s.name.trim()) return "Each subject must have a name.";
      if (s.weight < 1 || s.weight > 10) return "Subject weight must be between 1 and 10.";
    }
    return "";
  };

  const handleGenerate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setIsLoading(true);
    setPlan(null);
    try {
      const payload: StudyPlannerRequest = {
        total_hours: totalHours,
        break_minutes: breakMinutes,
        subjects: subjects.map((s) => ({ name: s.name.trim(), weight: s.weight })),
      };
      const result = await generateDailyStudyPlan(payload);
      setPlan(result);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail) {
        setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else {
        setError("Failed to generate study plan. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => navigate("/student/chat")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">Daily Study Planner</h1>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Input card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Your Study Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hours + break */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Total Available Hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Subjects
              </label>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) =>
                        updateSubject(subject.id, { name: e.target.value })
                      }
                      placeholder="Subject name"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-gray-500 hidden sm:inline">Weight</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={subject.weight}
                        title="Weight (1–10)"
                        onChange={(e) =>
                          updateSubject(subject.id, { weight: Number(e.target.value) })
                        }
                        className="w-16 px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubject(subject.id)}
                      disabled={subjects.length === 1}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Remove subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSubject}
                className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>

            {/* Inline error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Plan...
                </span>
              ) : (
                "Generate Plan"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {plan && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatMinutes(plan.total_minutes)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <BookOpen className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatMinutes(plan.study_minutes)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Study Time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <Coffee className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatMinutes(plan.break_minutes_total)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Break Time</p>
                </CardContent>
              </Card>
            </div>

            {/* Plan items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Study Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan.items.map((item, idx) => (
                  <PlanItemCard key={idx} item={item} index={idx + 1} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
