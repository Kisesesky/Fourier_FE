// types/worksheet.ts

export type WorksheetStatus = "draft" | "in-review" | "done";

export type WorksheetColumnType = "text" | "number" | "date" | "select";

export type WorksheetColumn = {
  id: string;
  title: string;
  type: WorksheetColumnType;
  options?: string[];
  width?: number;
};

export type WorksheetCell = {
  columnId: string;
  value: string | number | null;
};

export type WorksheetRow = {
  id: string;
  cells: WorksheetCell[];
  assignee?: string;
  status?: WorksheetStatus;
  memo?: string;
  updatedAt: number;
};

export type Worksheet = {
  id: string;
  title: string;
  ownerName: string;
  updatedAt: number;
  status: WorksheetStatus;
  columns: WorksheetColumn[];
  rows: WorksheetRow[];
  tags?: string[];
  description?: string;
};

export type WorksheetMeta = Pick<Worksheet, "id" | "title" | "ownerName" | "updatedAt" | "status">;

