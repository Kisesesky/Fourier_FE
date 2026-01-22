// types/project.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  iconType?: string;
  iconValue?: string;
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
}