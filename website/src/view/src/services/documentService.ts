import api from "./api";

export interface UploadedDocument {
  id: string;
  name: string;
  status: "processing" | "completed";
  uploadedAt: string;
}

// 🔌 BACKEND: POST /university/upload-regulation
export async function uploadDocuments(
  files: File[],
  facultyName: string,
  departmentName: string
): Promise<UploadedDocument[]> {
  const uploadedDocs: UploadedDocument[] = [];
  
  for (const file of files) {
    const formData = new FormData();
    formData.append("faculty_name", facultyName);
    formData.append("department_name", departmentName);
    formData.append("title", file.name.split('.')[0]); // Use filename as title without extension
    formData.append("version", "1.0");
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"; // Note: Use backend port
      
      const response = await fetch(`${baseUrl}/university/upload-regulation`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      
      uploadedDocs.push({
        id: responseData.document_id || Date.now().toString(),
        name: file.name,
        status: "processing",
        uploadedAt: "Just now",
      });
    } catch (error) {
      console.error("Error uploading file:", file.name, error);
    }
  }
  
  return uploadedDocs;
}

// 🔌 BACKEND: GET /university/regulations
export async function getDocuments(): Promise<UploadedDocument[]> {
  const response = await api.get("/university/regulations");
  return response.data;
}

// 🔌 BACKEND: DELETE /documents/:id  ⚠️ NOT YET IMPLEMENTED in backend
export async function deleteDocument(id: string): Promise<void> {
  void api; // will be: await api.delete(`/documents/${id}`)
  return new Promise((resolve) => setTimeout(resolve, 300));
}

// 🔌 BACKEND: DELETE /university/reset-regulation
export async function resetRegulation(facultyName: string, departmentName: string): Promise<void> {
  const response = await api.delete("/university/reset-regulation", {
    params: {
      faculty_name: facultyName,
      department_name: departmentName
    }
  });
  return response.data;
}
