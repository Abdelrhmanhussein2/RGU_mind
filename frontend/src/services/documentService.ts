import api from "./api";

export interface UploadedDocument {
  id: string;
  name: string;
  status: "processing" | "completed";
  uploadedAt: string;
}

// 🔌 BACKEND: POST /documents/upload  (multipart/form-data, field: "files")  → UploadedDocument[]
export async function uploadDocuments(
  files: File[]
): Promise<UploadedDocument[]> {
  void api;
  // Real call:
  //   const form = new FormData();
  //   files.forEach((f) => form.append("files", f));
  //   return (await api.post("/documents/upload", form, {
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

// 🔌 BACKEND: GET /documents  → UploadedDocument[]
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

// 🔌 BACKEND: DELETE /documents/:id
export async function deleteDocument(id: string): Promise<void> {
  void api; // will be: await api.delete(`/documents/${id}`)
  return new Promise((resolve) => setTimeout(resolve, 300));
}
