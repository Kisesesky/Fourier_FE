// app/(workspace)/workspace/[teamId]/_model/types/home-page-modals.types.ts
import type { IconMode, StatusType } from "../../_components/home-page-modals";

export type HomePageModalsProps = {
  showNewTeamModal: boolean;
  newTeamName: string;
  newTeamIconValue: string;
  teamIconMode: IconMode;
  teamIconFile: File | null;
  uploadingTeamIcon: boolean;
  creatingTeam: boolean;
  onCloseNewTeamModal: () => void;
  onSetNewTeamName: (value: string) => void;
  onSetNewTeamIconValue: (value: string) => void;
  onSetTeamIconMode: (mode: IconMode) => void;
  onSetTeamIconFile: (file: File | null) => void;
  onUploadTeamIcon: () => void;
  onCreateTeam: () => void;

  showNewProjectModal: boolean;
  newProjectName: string;
  newProjectDescription: string;
  newProjectIconValue: string;
  newProjectStatus: StatusType;
  projectIconMode: IconMode;
  projectIconFile: File | null;
  uploadingProjectIcon: boolean;
  creatingProject: boolean;
  onCloseNewProjectModal: () => void;
  onSetNewProjectName: (value: string) => void;
  onSetNewProjectDescription: (value: string) => void;
  onSetNewProjectIconValue: (value: string) => void;
  onSetNewProjectStatus: (status: StatusType) => void;
  onSetProjectIconMode: (mode: IconMode) => void;
  onSetProjectIconFile: (file: File | null) => void;
  onUploadProjectIcon: () => void;
  onCreateProject: () => void;

  editProjectModalOpen: boolean;
  editProjectName: string;
  editProjectStatus: StatusType;
  editProjectIconValue: string;
  editProjectIconMode: IconMode;
  editProjectIconFile: File | null;
  uploadingEditProjectIcon: boolean;
  onCloseEditProjectModal: () => void;
  onSetEditProjectName: (value: string) => void;
  onSetEditProjectStatus: (status: StatusType) => void;
  onSetEditProjectIconValue: (value: string) => void;
  onSetEditProjectIconMode: (mode: IconMode) => void;
  onSetEditProjectIconFile: (file: File | null) => void;
  onUploadEditProjectIcon: () => void;
  onUpdateProject: () => void;

  deleteModalOpen: boolean;
  targetProjectName: string;
  onCloseDeleteModal: () => void;
  onDeleteProject: () => void;

  teamRenameModalOpen: boolean;
  teamRenameValue: string;
  teamEditIconValue: string;
  teamEditIconMode: IconMode;
  teamEditIconFile: File | null;
  uploadingTeamEditIcon: boolean;
  onCloseTeamRenameModal: () => void;
  onSetTeamRenameValue: (value: string) => void;
  onSetTeamEditIconValue: (value: string) => void;
  onSetTeamEditIconMode: (mode: IconMode) => void;
  onSetTeamEditIconFile: (file: File | null) => void;
  onUploadTeamEditIcon: () => void;
  onRenameTeam: () => void;

  teamDeleteModalOpen: boolean;
  targetTeamName: string;
  onCloseTeamDeleteModal: () => void;
  onDeleteTeam: () => void;
};
