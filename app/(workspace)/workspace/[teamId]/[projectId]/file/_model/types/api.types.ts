// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/types/api.types.ts
import type { z } from "zod";
import type {
  FileFolderDtoSchema,
  ProjectFileDtoSchema,
  UploadedProjectFileDtoSchema,
} from "../schemas/file-api.schemas";

export type FileFolderDto = z.infer<typeof FileFolderDtoSchema>;
export type ProjectFileDto = z.infer<typeof ProjectFileDtoSchema>;
export type UploadedProjectFileDto = z.infer<typeof UploadedProjectFileDtoSchema>;
