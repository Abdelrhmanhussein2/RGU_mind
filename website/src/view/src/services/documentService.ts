import api from "./api";

export interface UploadedDocument {
  id: string;
  name: string;
  status: "processing" | "completed";
  uploadedAt: string;
}

// 🔌 BACKEND: POST /data/upload  (multipart/form-data)  → { regulation_id, file_name, message }
// ⚠️ SHAPE MISMATCH: backend expects one file at a time plus query params: department_id (UUID), title, version
//    Frontend sends an array of files with no department_id/title/version — these params must be collected from UI
// ⚠️ RESPONSE MISMATCH: backend returns { regulation_id, file_name, message }, not UploadedDocument[]
export async function uploadDocuments(
  files: File[]
): Promise<UploadedDocument[]> {
  void api;
  // Real call (single file, requires department_id + title + version from the UI):
  //   const form = new FormData();
  //   form.append("file", file);
  //   return (await api.post(`/data/upload?department_id=${deptId}&title=${title}&version=${version}`, form, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   })).data;
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          files.map((f, i) => ({
            id: (Date.now() + i).toString(),
            name: f.name,
            status: "processing",
            uploadedAt: "Just now",
          }))
        ),
      1000
    )
  );
}

// 🔌 BACKEND: GET /documents  → UploadedDocument[]  ⚠️ NOT YET IMPLEMENTED in backend
export async function getDocuments(): Promise<UploadedDocument[]> {
  void api; // will be: return (await api.get("/documents")).data
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: "1",
            name: "Academic Regulations 2024.pdf",
            status: "completed",
            uploadedAt: "2 hours ago",
          },
          {
            id: "2",
            name: "Grading Policy.docx",
            status: "processing",
            uploadedAt: "10 minutes ago",
          },
        ]),
      300
    )
  );
}

// 🔌 BACKEND: DELETE /documents/:id  ⚠️ NOT YET IMPLEMENTED in backend
export async function deleteDocument(id: string): Promise<void> {
  void api; // will be: await api.delete(`/documents/${id}`)
  return new Promise((resolve) => setTimeout(resolve, 300));
}
