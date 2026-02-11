// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/file-page.types.ts

export type FileCategory = "image" | "document" | "other";

export type ViewFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  ext: string;
  category: FileCategory;
  createdAt: string;
  url: string;
  folderId: string | null;
};
