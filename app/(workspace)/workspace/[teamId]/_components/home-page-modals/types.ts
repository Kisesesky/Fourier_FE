// app/(workspace)/workspace/[teamId]/_components/home-page-modals/types.ts
export type StatusType = "ACTIVE" | "DRAFT" | "DISABLED";
export type IconMode = "url" | "upload";

export type IconPickerProps = {
  label: string;
  iconValue: string;
  iconMode: IconMode;
  iconFile: File | null;
  uploading: boolean;
  onSetIconMode: (mode: IconMode) => void;
  onSetIconValue: (value: string) => void;
  onSetIconFile: (file: File | null) => void;
  onUploadIcon: () => void;
};

export type CreateTeamModalProps = {
  open: boolean;
  teamName: string;
  icon: IconPickerProps;
  creating: boolean;
  onClose: () => void;
  onSetTeamName: (value: string) => void;
  onCreate: () => void;
};

export type CreateProjectModalProps = {
  open: boolean;
  projectName: string;
  description: string;
  status: StatusType;
  icon: IconPickerProps;
  creating: boolean;
  onClose: () => void;
  onSetProjectName: (value: string) => void;
  onSetDescription: (value: string) => void;
  onSetStatus: (status: StatusType) => void;
  onCreate: () => void;
};

export type EditProjectModalProps = {
  open: boolean;
  projectName: string;
  status: StatusType;
  icon: IconPickerProps;
  onClose: () => void;
  onSetProjectName: (value: string) => void;
  onSetStatus: (status: StatusType) => void;
  onSave: () => void;
};

export type TeamRenameModalProps = {
  open: boolean;
  teamName: string;
  icon: IconPickerProps;
  onClose: () => void;
  onSetTeamName: (value: string) => void;
  onSave: () => void;
};

export type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
};
