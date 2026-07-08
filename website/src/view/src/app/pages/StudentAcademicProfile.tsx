import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import api from "../../services/api";
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Trash2,
  X,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui/accordion";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../components/ui/table";
import {
  GradeLetter,
  GRADE_OPTIONS,
  GRADE_POINTS,
  Course,
  CourseCategory,
  TermGrades,
  getTermGrades,
  addTermGrades,
  deleteTermGrades,
  deleteCourseFromTerm,
  calculateGPA,
  calculateCumulativeGPA,
  getRegisteredCreditHours,
  getPassedCreditHours,
} from "../lib/termGrades";
import {
  ResultImage,
  getResultImages,
  addResultImage,
  deleteResultImage,
} from "../lib/resultImages";
import {
  StudentProfile,
  getStudentProfile,
  updateStudentProfile,
  EMPTY_STUDENT_PROFILE,
} from "../lib/studentProfile";
import {
  calculateStanding,
  getRemainingBreakdown,
  checkGraduationEligibility,
  GraduationEligibility,
} from "../lib/academicStanding";
import {
  CurriculumCourse,
  CourseStatus,
  getCurriculum,
  getPassedCurriculumIds,
  getCourseStatus,
  findPassedCourseDetail,
} from "../lib/curriculum";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function modeButtonClass(active: boolean): string {
  return `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
    }`;
}

function pillButtonClass(active: boolean): string {
  return `px-3 py-1.5 rounded-lg text-sm font-medium ${active ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
    }`;
}

/* ───────────────────────── Shared course editing ───────────────────────── */

function getGradeFromPoints(pts: number): GradeLetter {
  if (pts >= 4.0) return "A+";
  if (pts >= 3.7) return "A-";
  if (pts >= 3.3) return "B+";
  if (pts >= 3.0) return "B";
  if (pts >= 2.7) return "B-";
  if (pts >= 2.3) return "C+";
  if (pts >= 2.0) return "C";
  if (pts >= 1.7) return "C-";
  if (pts >= 1.3) return "D+";
  if (pts >= 1.0) return "D";
  return "F";
}

function CourseRow({
  course,
  onUpdate,
  onRemove,
}: {
  course: Course;
  onUpdate: (patch: Partial<Course>) => void;
  onRemove: () => void;
}) {
  const [pointInput, setPointInput] = useState<string>("");

  const handlePointChange = (val: string) => {
    setPointInput(val);
    const pts = parseFloat(val);
    if (!isNaN(pts)) {
      onUpdate({ grade: getGradeFromPoints(pts) });
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        value={course.courseName}
        onChange={(e) => onUpdate({ courseName: e.target.value })}
        placeholder="Course name"
        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="number"
        min={1}
        value={course.creditHours}
        onChange={(e) => onUpdate({ creditHours: Number(e.target.value) || 0 })}
        className="w-16 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Credit Hours"
      />
      <input
        type="number"
        min={0}
        max={4}
        step={0.1}
        value={pointInput}
        onChange={(e) => handlePointChange(e.target.value)}
        placeholder="Pts"
        className="w-16 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Points (e.g., 3.5)"
      />
      <Select value={course.grade} onValueChange={(v) => onUpdate({ grade: v as GradeLetter })}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRADE_OPTIONS.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={course.category || "Mandatory"} onValueChange={(v) => onUpdate({ category: v as CourseCategory })}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Mandatory">Mandatory</SelectItem>
          <SelectItem value="Elective">Elective</SelectItem>
          <SelectItem value="Major">Major</SelectItem>
        </SelectContent>
      </Select>
      <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function CourseEditor({
  courses,
  onChange,
}: {
  courses: Course[];
  onChange: (courses: Course[]) => void;
}) {
  const addCourse = () =>
    onChange([
      ...courses,
      { id: `${Date.now()}-${courses.length}`, courseName: "", creditHours: 3, grade: "A", category: "Mandatory" },
    ]);

  const updateCourse = (id: string, patch: Partial<Course>) =>
    onChange(courses.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const removeCourse = (id: string) => onChange(courses.filter((c) => c.id !== id));

  return (
    <div className="space-y-2">
      {courses.map((course) => (
        <CourseRow
          key={course.id}
          course={course}
          onUpdate={(patch) => updateCourse(course.id, patch)}
          onRemove={() => removeCourse(course.id)}
        />
      ))}
      <button
        type="button"
        onClick={addCourse}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <Plus className="w-4 h-4" /> Add Course
      </button>
    </div>
  );
}

function GpaResult({ gpa, courseCount }: { gpa: number; courseCount: number }) {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
      <p className="text-sm text-indigo-700 font-medium mb-1">Calculated GPA</p>
      <p className="text-4xl font-bold text-indigo-900">{courseCount ? gpa.toFixed(2) : "—"}</p>
      <p className="text-xs text-indigo-600 mt-1">
        {courseCount} course{courseCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function WhatIfCalculator({ baseCourses }: { baseCourses: Course[] }) {
  const [hypothetical, setHypothetical] = useState<Course | null>(null);
  const baseGpa = calculateGPA(baseCourses);
  const projectedGpa = hypothetical ? calculateGPA([...baseCourses, hypothetical]) : baseGpa;

  return (
    <div className="border-t border-gray-200 pt-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">What-if Calculator</p>
      {!hypothetical ? (
        <button
          type="button"
          onClick={() =>
            setHypothetical({ id: `whatif-${Date.now()}`, courseName: "", creditHours: 3, grade: "A" })
          }
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" /> Add Hypothetical Course
        </button>
      ) : (
        <div className="space-y-3">
          <CourseRow
            course={hypothetical}
            onUpdate={(patch) => setHypothetical({ ...hypothetical, ...patch })}
            onRemove={() => setHypothetical(null)}
          />
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
            <span className="text-gray-600">Current GPA</span>
            <span className="font-semibold text-gray-900">{baseGpa.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Projected</span>
            <span className={`font-semibold ${projectedGpa >= baseGpa ? "text-green-600" : "text-red-600"}`}>
              {projectedGpa.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── GPA Calculator tab ───────────────────────── */

function ManualMode() {
  const [courses, setCourses] = useState<Course[]>([]);
  const gpa = calculateGPA(courses);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual GPA</CardTitle>
        <CardDescription>Add courses and grades to calculate an instant GPA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CourseEditor courses={courses} onChange={setCourses} />
        <GpaResult gpa={gpa} courseCount={courses.length} />
        <WhatIfCalculator baseCourses={courses} />
      </CardContent>
    </Card>
  );
}

function CumulativeMode({ terms }: { terms: TermGrades[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => terms.map((t) => t.id));

  useEffect(() => {
    setSelectedIds(terms.map((t) => t.id));
  }, [terms.length]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedCourses = terms.filter((t) => selectedIds.includes(t.id)).flatMap((t) => t.courses);
  const gpa = calculateGPA(selectedCourses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative GPA</CardTitle>
        <CardDescription>Auto-loaded from your saved terms — choose which ones to include.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {terms.length === 0 ? (
          <p className="text-sm text-gray-500">
            No term grades saved yet. Add a term in Grades History to see your cumulative GPA.
          </p>
        ) : (
          <div className="space-y-2">
            {terms.map((t) => {
              const termGpa = calculateGPA(t.courses);
              return (
                <label
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Checkbox
                      checked={selectedIds.includes(t.id)}
                      onCheckedChange={() => toggle(t.id)}
                    />
                    <span className="text-sm text-gray-700">{t.termName}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {t.courses.length} courses · GPA {termGpa.toFixed(2)}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        <GpaResult gpa={gpa} courseCount={selectedCourses.length} />
        <WhatIfCalculator baseCourses={selectedCourses} />
      </CardContent>
    </Card>
  );
}

function CustomTermMode({ terms }: { terms: TermGrades[] }) {
  const [source, setSource] = useState<"saved" | "manual">("saved");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [manualCourses, setManualCourses] = useState<Course[]>([]);

  const selectedTerm = terms.find((t) => t.id === selectedTermId);
  const activeCourses = source === "saved" ? selectedTerm?.courses ?? [] : manualCourses;
  const gpa = calculateGPA(activeCourses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Term GPA</CardTitle>
        <CardDescription>Pick a saved term, or enter grades manually.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setSource("saved")} className={pillButtonClass(source === "saved")}>
            Saved Term
          </button>
          <button type="button" onClick={() => setSource("manual")} className={pillButtonClass(source === "manual")}>
            Enter Manually
          </button>
        </div>

        {source === "saved" ? (
          <div className="space-y-2">
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.termName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTerm && selectedTerm.courses.length === 0 && (
              <p className="text-sm text-amber-600">This term has no courses recorded.</p>
            )}
          </div>
        ) : (
          <CourseEditor courses={manualCourses} onChange={setManualCourses} />
        )}

        <GpaResult gpa={gpa} courseCount={activeCourses.length} />
        <WhatIfCalculator baseCourses={activeCourses} />
      </CardContent>
    </Card>
  );
}

function GpaCalculatorTab({ terms }: { terms: TermGrades[] }) {
  const [mode, setMode] = useState<"manual" | "cumulative" | "custom">("manual");
  const modeLabels: Record<typeof mode, string> = {
    manual: "Manual",
    cumulative: "Cumulative",
    custom: "Custom Term",
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(Object.keys(modeLabels) as Array<typeof mode>).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={modeButtonClass(mode === m)}>
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {mode === "manual" && <ManualMode />}
      {mode === "cumulative" && <CumulativeMode terms={terms} />}
      {mode === "custom" && <CustomTermMode terms={terms} />}
    </div>
  );
}

/* ───────────────────────── Grades History tab ───────────────────────── */



function AddTermDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (term: { termName: string; courses: Course[] }) => void;
}) {
  const [termName, setTermName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const previewGpa = calculateGPA(courses);

  const reset = () => {
    setTermName("");
    setCourses([]);
    setError("");
  };

  const handleSubmit = () => {
    if (!termName.trim()) {
      setError("Term name is required");
      return;
    }
    if (courses.length === 0) {
      setError("Add at least one course");
      return;
    }
    onSave({ termName: termName.trim(), courses });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Term</DialogTitle>
          <DialogDescription>Add courses and grades for this term.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Term Name</label>
            <input
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              placeholder="Fall 2025"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Courses</label>
            <CourseEditor courses={courses} onChange={setCourses} />
          </div>
          {courses.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-center">
              <p className="text-xs text-indigo-700">Live GPA Preview</p>
              <p className="text-2xl font-bold text-indigo-900">{previewGpa.toFixed(2)}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Term</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GradesHistoryTab({
  terms,
  onAddTerm,
  onDeleteTerm,
  onDeleteCourse,
}: {
  terms: TermGrades[];
  onAddTerm: (term: { termName: string; courses: Course[] }) => Promise<void>;
  onDeleteTerm: (id: string) => Promise<void>;
  onDeleteCourse: (termId: string, courseId: string) => Promise<void>;
}) {
  const [showAddTerm, setShowAddTerm] = useState(false);

  return (
    <div className="space-y-10">


      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Term Grades</h3>
          <Button onClick={() => setShowAddTerm(true)}>
            <Plus className="w-4 h-4" /> Add Term
          </Button>
        </div>

        {terms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            No term grades yet. Add a term to start tracking your GPA.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {terms.map((term) => {
              const gpa = calculateGPA(term.courses);
              const hours = term.courses.reduce((sum, c) => sum + c.creditHours, 0);
              return (
                <AccordionItem
                  key={term.id}
                  value={term.id}
                  className="border border-gray-200 rounded-xl px-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium text-gray-900">{term.termName}</span>
                        <span className="text-xs text-gray-500">
                          {term.courses.length} courses · GPA {gpa.toFixed(2)} · {hours} hrs
                        </span>
                      </div>
                    </AccordionTrigger>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTerm(term.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <AccordionContent>
                    {term.courses.length === 0 ? (
                      <p className="text-sm text-gray-500">No courses recorded.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course Name</TableHead>
                            <TableHead>Credit Hours</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Grade Points</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {term.courses.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell>{c.courseName}</TableCell>
                              <TableCell>{c.creditHours}</TableCell>
                              <TableCell>{c.grade}</TableCell>
                              <TableCell>{GRADE_POINTS[c.grade].toFixed(1)}</TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => onDeleteCourse(term.id, c.id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </section>

      <AddTermDialog
        open={showAddTerm}
        onOpenChange={setShowAddTerm}
        onSave={onAddTerm}
      />
    </div>
  );
}

/* ───────────────────────── Overview tab ───────────────────────── */

function CheckRow({ label, passed, detail }: { label: string; passed: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-lg">
      {passed ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

function EligibilityModal({
  open,
  onOpenChange,
  eligibility,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibility: GraduationEligibility;
  profile: StudentProfile;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Graduation Eligibility Breakdown</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <CheckRow
            label="Credit hours"
            passed={eligibility.hoursCheck}
            detail={`${eligibility.passedHours} / ${profile.totalRequiredCreditHours || "—"} passed`}
          />
          <CheckRow
            label="GPA ≥ 2.0"
            passed={eligibility.gpaCheck}
            detail={`Current cumulative GPA: ${eligibility.gpa.toFixed(2)}`}
          />
          <CheckRow
            label="Mandatory requirements"
            passed={eligibility.mandatoryCheck}
            detail={eligibility.mandatoryCheck ? "No obvious gaps" : "Gaps detected — see reasons below"}
          />
        </div>
        {!eligibility.eligible && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
            <p className="font-medium mb-1">Unmet requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {eligibility.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OverviewTab({
  profile,
  terms,
  onCheckEligibility,
}: {
  profile: StudentProfile;
  terms: TermGrades[];
  onCheckEligibility: () => void;
}) {
  const registeredHours = getRegisteredCreditHours(terms);
  const passedHours = getPassedCreditHours(terms);
  const remainingHours = Math.max(0, profile.totalRequiredCreditHours - passedHours);
  const hasCourses = terms.some((t) => t.courses.length > 0);
  const gpa = calculateCumulativeGPA(terms);
  const standing = calculateStanding(gpa, hasCourses);
  const breakdown = getRemainingBreakdown(profile, terms);
  const eligibility = checkGraduationEligibility(profile, terms);
  const progressPct =
    profile.totalRequiredCreditHours > 0
      ? Math.min(100, Math.round((passedHours / profile.totalRequiredCreditHours) * 100))
      : 0;

  const statusStyles: Record<GraduationEligibility["status"], string> = {
    green: "border-green-200 bg-green-50",
    yellow: "border-yellow-200 bg-yellow-50",
    red: "border-red-200 bg-red-50",
  };

  return (
    <div className="space-y-6">
      {!hasCourses && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          Add your term grades to see progress
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registered Credit Hours</CardDescription>
            <CardTitle className="text-3xl">{registeredHours}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Passed Credit Hours</CardDescription>
            <CardTitle className="text-3xl text-green-600">{passedHours}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining Credit Hours</CardDescription>
            <CardTitle className="text-3xl text-indigo-600">{remainingHours}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graduation Progress</CardTitle>
          <CardDescription>
            {passedHours} of {profile.totalRequiredCreditHours || "—"} credit hours completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPct} />
          <p className="text-sm text-gray-500 mt-2">{progressPct}% complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remaining Course Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{breakdown.mandatoryRemaining}</p>
            <p className="text-sm text-gray-500">Mandatory</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{breakdown.electiveRemaining}</p>
            <p className="text-sm text-gray-500">Elective</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{breakdown.majorRemaining}</p>
            <p className="text-sm text-gray-500">Major</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Academic Standing</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium ${standing.colorClass}`}
            >
              {standing.label}
            </span>
            {hasCourses && <p className="text-sm text-gray-500 mt-2">Cumulative GPA: {gpa.toFixed(2)}</p>}
          </CardContent>
        </Card>

        <Card className={statusStyles[eligibility.status]}>
          <CardHeader>
            <CardTitle>Graduation Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eligibility.eligible ? (
              <p className="text-sm text-green-700">You meet all graduation requirements.</p>
            ) : (
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                {eligibility.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" onClick={onCheckEligibility}>
              Check Eligibility
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── My Info tab ───────────────────────── */

function MyInfoTab({
  profile,
  onSave,
}: {
  profile: StudentProfile;
  onSave: (patch: Partial<StudentProfile>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<StudentProfile> | Record<string, any>>(profile);
  const [showSuccess, setShowSuccess] = useState(false);
  const [academicPlan, setAcademicPlan] = useState<any>(null);

  useEffect(() => setForm(profile), [profile]);

  useEffect(() => {
    if (profile.department) {
      api.get(`/academic-plans/by-program/${encodeURIComponent(profile.department)}`)
        .then((res) => setAcademicPlan(res.data))
        .catch((err) => console.error("Failed to load academic plan", err));
    }
  }, [profile.department]);

  const field = (label: string, key: keyof StudentProfile, type: "text" | "number" = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key] !== undefined && form[key] !== null ? form[key] : ""}
        onChange={(e) =>
          setForm({
            ...form,
            [key]: type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value,
          })
        }
        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Full Name", "fullName")}
            {field("Student ID", "studentId")}
            {field("University", "university")}
            {field("Faculty", "faculty")}
            {field("Department", "department")}
            {field("Enrollment Year", "enrollmentYear", "number")}
            {field("Expected Graduation Year", "expectedGraduationYear", "number")}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={async () => {
                await onSave(form as Partial<StudentProfile>);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
              }}
            >
              Save Changes
            </Button>
            {showSuccess && <span className="text-sm text-green-600 font-medium">Profile updated successfully!</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Plan Summary</h3>
          {academicPlan ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">Program Name</p>
                  <p className="font-semibold text-gray-900">{academicPlan.programName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Credit Hours</p>
                  <p className="font-semibold text-gray-900">{academicPlan.totalRequiredCreditHours}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">Mandatory Hours</p>
                  <p className="font-semibold text-gray-900">{academicPlan.mandatoryCreditHours}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">Elective Hours</p>
                  <p className="font-semibold text-gray-900">{academicPlan.electiveCreditHours}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">Major Hours</p>
                  <p className="font-semibold text-gray-900">{academicPlan.majorCreditHours}</p>
                </div>
              </div>

              {academicPlan.curriculumPdfName && (
                <div className="mt-4 flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium text-sm">{academicPlan.curriculumPdfName}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(api.defaults.baseURL + "/" + academicPlan.curriculumPdfPath, '_blank')} className="bg-white hover:bg-gray-50 text-indigo-600 border-indigo-200">
                    View PDF
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm">No academic plan assigned to your program yet.</p>
              <p className="text-gray-400 text-xs mt-1">Please wait for your faculty administration to upload it.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────────────────── Curriculum Map tab ───────────────────────── */

function CourseDetailDialog({
  course,
  curriculum,
  onOpenChange,
}: {
  course: CurriculumCourse | null;
  curriculum: CurriculumCourse[];
  onOpenChange: () => void;
}) {
  const prereqNames = course?.prerequisites.map((id) => curriculum.find((c) => c.id === id)?.name ?? id) ?? [];

  return (
    <Dialog open={!!course} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course?.name}</DialogTitle>
          <DialogDescription>
            Year {course?.year} · Semester {course?.semester}
          </DialogDescription>
        </DialogHeader>
        {course && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Credit Hours</span>
              <span className="font-medium text-gray-900">{course.creditHours}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Category</span>
              <span className="font-medium text-gray-900 capitalize">{course.category.replace("_", " ")}</span>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Prerequisites</span>
              <p className="font-medium text-gray-900 mt-1">
                {prereqNames.length === 0 ? "None" : prereqNames.join(", ")}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseNode({
  course,
  status,
  curriculum,
  passedDetail,
  onClick,
}: {
  course: CurriculumCourse;
  status: CourseStatus;
  curriculum: CurriculumCourse[];
  passedDetail: { grade: string; termName: string } | null;
  onClick: () => void;
}) {
  const styles: Record<CourseStatus, string> = {
    passed: "bg-green-50 border-green-300 text-green-800",
    available: "bg-blue-50 border-blue-300 text-blue-800 cursor-pointer hover:border-blue-500 hover:shadow-sm",
    locked: "bg-gray-50 border-gray-200 text-gray-400",
  };

  const node = (
    <div
      onClick={status === "available" ? onClick : undefined}
      className={`px-3 py-2.5 rounded-lg border text-sm transition-all ${styles[status]}`}
    >
      <p className="font-medium">{course.name}</p>
      <p className="text-xs opacity-75 mt-0.5">{course.creditHours} credit hours</p>
    </div>
  );

  if (status === "locked") {
    const prereqNames = course.prerequisites.map((id) => curriculum.find((c) => c.id === id)?.name ?? id);
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent>Requires: {prereqNames.length ? prereqNames.join(", ") : "None"}</TooltipContent>
      </Tooltip>
    );
  }

  if (status === "passed" && passedDetail) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent>
          Grade: {passedDetail.grade} · {passedDetail.termName}
        </TooltipContent>
      </Tooltip>
    );
  }

  return node;
}

function CurriculumMapTab({ terms }: { terms: TermGrades[] }) {
  const curriculum = useMemo(() => getCurriculum(), []);
  const passedIds = useMemo(() => getPassedCurriculumIds(curriculum, terms), [curriculum, terms]);
  const [selectedCourse, setSelectedCourse] = useState<CurriculumCourse | null>(null);
  const years = Array.from(new Set(curriculum.map((c) => c.year))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" /> Passed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Locked
        </span>
      </div>

      {years.map((year) => (
        <div key={year}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Year {year}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2].map((semester) => (
              <div key={semester} className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Semester {semester}</p>
                <div className="space-y-2">
                  {curriculum
                    .filter((c) => c.year === year && c.semester === semester)
                    .map((course) => {
                      const status = getCourseStatus(course, passedIds);
                      return (
                        <CourseNode
                          key={course.id}
                          course={course}
                          status={status}
                          curriculum={curriculum}
                          passedDetail={status === "passed" ? findPassedCourseDetail(course, terms) : null}
                          onClick={() => setSelectedCourse(course)}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <CourseDetailDialog
        course={selectedCourse}
        curriculum={curriculum}
        onOpenChange={() => setSelectedCourse(null)}
      />
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export function StudentAcademicProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile>(EMPTY_STUDENT_PROFILE);
  const [terms, setTerms] = useState<TermGrades[]>([]);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const p = await getStudentProfile();
        setProfile(p);
        const t = await getTermGrades();
        setTerms(t);
      } catch (err) {
        console.error("Failed to load academic profile:", err);
      }
    };
    loadData();
  }, []);

  const eligibility = checkGraduationEligibility(profile, terms);

  const handleSaveProfile = async (patch: Partial<StudentProfile>) => {
    try {
      const updated = await updateStudentProfile(patch);
      setProfile(updated);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };



  const handleAddTerm = async (term: { termName: string; courses: Course[] }) => {
    try {
      const newTerm = await addTermGrades(term);
      setTerms((prev) => {
        const filtered = prev.filter((t) => t.termName !== term.termName);
        return [newTerm, ...filtered];
      });
    } catch (err) {
      console.error("Failed to add term:", err);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      await deleteTermGrades(id);
      setTerms((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete term:", err);
    }
  };

  const handleDeleteCourse = async (termId: string, courseId: string) => {
    try {
      await deleteCourseFromTerm(termId, courseId);
      setTerms((prev) =>
        prev.map((t) => {
          if (t.id === termId) {
            return { ...t, courses: t.courses.filter((c) => c.id !== courseId) };
          }
          return t;
        })
      );
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
            <button onClick={() => navigate("/student/chat")} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Academic Profile</h1>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") || "overview"}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="grades">Grades History & GPA</TabsTrigger>
            <TabsTrigger value="info">My Info</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum Map</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab profile={profile} terms={terms} onCheckEligibility={() => setShowEligibilityModal(true)} />
          </TabsContent>

          <TabsContent value="grades" className="mt-6 space-y-12">
            <GradesHistoryTab
              terms={terms}
              onAddTerm={handleAddTerm}
              onDeleteTerm={handleDeleteTerm}
              onDeleteCourse={handleDeleteCourse}
            />

            <section>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">GPA Calculator</h3>
                <p className="text-sm text-gray-500">Calculate cumulative, manual, or hypothetical GPAs.</p>
              </div>
              <GpaCalculatorTab terms={terms} />
            </section>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <MyInfoTab profile={profile} onSave={handleSaveProfile} />
          </TabsContent>

          <TabsContent value="curriculum" className="mt-6">
            <CurriculumMapTab terms={terms} />
          </TabsContent>
        </Tabs>
      </main>

      <EligibilityModal
        open={showEligibilityModal}
        onOpenChange={setShowEligibilityModal}
        eligibility={eligibility}
        profile={profile}
      />
      </div>
    </div>
  );
}
