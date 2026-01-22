import type { JSONContent } from "@tiptap/react";

// default ID type
export type DocID = string;
export type FolderID = string;

// docmeta
export interface DocMeta {
  id: DocID;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  folderId: FolderID | null;
  locations: FolderID[];
  owner: string;
  fileSize?: number;
  starred?: boolean;
  content?: JSONContent;
  createdAt: string;
  updatedAt: string;
  versions?: DocVersion[];
}

export interface DocVersion {
  id: string;
  date: string;
  content: JSONContent;
}

// foldermeta
export interface DocFolder {
  id: FolderID;
  name: string;
  icon?: string;
  color?: string;
  parentId: FolderID | null;
  createdAt: string;
  updatedAt: string;
}


// Tree types (DocsTree / FolderNode / DocNode)
export interface TreeFolder {
  id: FolderID;
  type: "folder";
  name: string;
  icon?: string;
  color?: string;
  parentId: FolderID | null;
  children: TreeNode[];
}

export interface TreeDoc {
  id: DocID;
  type: "doc";
  title: string;
  icon?: string;
  color?: string;
  starred?: boolean;
}

export type TreeNode = TreeFolder | TreeDoc;


// selection state
export interface SelectionState {
  docs: Set<DocID>;
  folders: Set<FolderID>;
}

export type TreeContextTarget = {
  type: "folder" | "doc";
  id: string;
};

export type FolderExtra = {
  color?: string;
  icon?: string;
};

export type DocExtra = {
  color?: string;
  icon?: string;
};
