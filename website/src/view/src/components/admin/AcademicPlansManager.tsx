import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FileText, Upload } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent } from "../../app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../app/components/ui/dialog";
import api from "../../services/api";

interface AcademicPlan {
  id: string;
  facultyName: string;
  departmentName: string;
  totalRequiredCreditHours: number;
  mandatoryCreditHours: number;
  electiveCreditHours: number;
  majorCreditHours: number;
  curriculumPdfName?: string;
}

export function AcademicPlansManager() {
  const [plans, setPlans] = useState<AcademicPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AcademicPlan | null>(null);
  const [formData, setFormData] = useState({
    facultyName: "",
    departmentName: "",
    totalRequiredCreditHours: 0,
    mandatoryCreditHours: 0,
    electiveCreditHours: 0,
    majorCreditHours: 0,
  });
  const [pdfFile, setPdfFile] = useState<{ name: string; base64: string } | null>(null);
  const [error, setError] = useState("");

  const loadPlans = async () => {
    try {
      const { data } = await api.get("/academic-plans/");
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans", err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      facultyName: "",
      departmentName: "",
      totalRequiredCreditHours: 0,
      mandatoryCreditHours: 0,
      electiveCreditHours: 0,
      majorCreditHours: 0,
    });
    setPdfFile(null);
    setError("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: AcademicPlan) => {
    setEditingPlan(plan);
    setFormData({
      facultyName: plan.facultyName,
      departmentName: plan.departmentName,
      totalRequiredCreditHours: plan.totalRequiredCreditHours,
      mandatoryCreditHours: plan.mandatoryCreditHours,
      electiveCreditHours: plan.electiveCreditHours,
      majorCreditHours: plan.majorCreditHours,
    });
    setPdfFile(null);
    setError("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await api.delete(`/academic-plans/${id}`);
      loadPlans();
    } catch (err) {
      console.error("Failed to delete plan", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPdfFile({ name: file.name, base64: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        curriculumPdfName: pdfFile?.name,
        curriculumPdfBase64: pdfFile?.base64,
      };

      if (editingPlan) {
        await api.put(`/academic-plans/${editingPlan.id}`, payload);
      } else {
        await api.post("/academic-plans/", payload);
      }
      setIsDialogOpen(false);
      loadPlans();
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Academic Plans</h2>
        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{plan.departmentName}</h3>
                <p className="text-sm text-gray-500">{plan.facultyName}</p>
                <div className="text-sm text-gray-500 mt-2 grid grid-cols-2 gap-x-8 gap-y-1">
                  <span>Total Hours: {plan.totalRequiredCreditHours}</span>
                  <span>Mandatory Hours: {plan.mandatoryCreditHours}</span>
                  <span>Elective Hours: {plan.electiveCreditHours}</span>
                  <span>Major Hours: {plan.majorCreditHours}</span>
                </div>
                {plan.curriculumPdfName && (
                  <div className="flex items-center gap-1.5 text-sm text-indigo-600 mt-3 font-medium">
                    <FileText className="w-4 h-4" />
                    {plan.curriculumPdfName}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(plan)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No academic plans found.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Academic Plan" : "Create Academic Plan"}</DialogTitle>
          </DialogHeader>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={formData.facultyName}
                  onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Credit Hours</label>
                <input
                  type="number"
                  value={formData.totalRequiredCreditHours}
                  onChange={(e) => setFormData({ ...formData, totalRequiredCreditHours: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mandatory Hours</label>
                <input
                  type="number"
                  value={formData.mandatoryCreditHours}
                  onChange={(e) => setFormData({ ...formData, mandatoryCreditHours: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Elective Hours</label>
                <input
                  type="number"
                  value={formData.electiveCreditHours}
                  onChange={(e) => setFormData({ ...formData, electiveCreditHours: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major Hours</label>
                <input
                  type="number"
                  value={formData.majorCreditHours}
                  onChange={(e) => setFormData({ ...formData, majorCreditHours: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum PDF (Optional)</label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {pdfFile && <p className="text-xs text-indigo-600 mt-1">Selected: {pdfFile.name}</p>}
              {!pdfFile && editingPlan?.curriculumPdfName && (
                <p className="text-xs text-gray-500 mt-1">Current: {editingPlan.curriculumPdfName}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
