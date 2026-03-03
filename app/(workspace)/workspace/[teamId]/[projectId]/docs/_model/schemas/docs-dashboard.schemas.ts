// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/schemas/docs-dashboard.schemas.ts

import { z } from "zod";
import type { DocumentCommentDto } from "@/workspace/docs/_model/types/api.types";
import { DocumentCommentDtoSchema } from "./docs-api.schemas";

export const parseDocumentComments = (input: unknown): DocumentCommentDto[] => {
  const parsed = z.array(DocumentCommentDtoSchema).safeParse(input ?? []);
  return parsed.success ? parsed.data : [];
};
