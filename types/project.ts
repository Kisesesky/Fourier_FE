// types/project.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  iconType?: "IMAGE";
  iconValue?: string;
  status?: "ACTIVE" | "DRAFT" | "DISABLED";
  isFavorite?: boolean;
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
}
