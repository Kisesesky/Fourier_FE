// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/view.types.ts

export type CommandPaletteKind = "channel" | "user" | "message" | "link" | "file" | "slash";

export type CommandPaletteRow = {
  id: string;
  kind: CommandPaletteKind;
  label: string;
  desc?: string;
  aux?: string;
  payload?: any;
};

export type SlashCommand = {
  id: string;
  label: string;
  desc: string;
  insert: string;
};
