// app/(workspace)/workspace/[teamId]/_components/HomePageModals.tsx
'use client';

import {
  ConfirmModal,
  CreateProjectModal,
  CreateTeamModal,
  EditProjectModal,
  TeamRenameModal,
  type IconMode,
  type StatusType,
} from "./home-page-modals";

type HomePageModalsProps = {
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

export default function HomePageModals(props: HomePageModalsProps) {
  return (
    <>
      <CreateTeamModal
        open={props.showNewTeamModal}
        teamName={props.newTeamName}
        creating={props.creatingTeam}
        onClose={props.onCloseNewTeamModal}
        onSetTeamName={props.onSetNewTeamName}
        onCreate={props.onCreateTeam}
        icon={{
          label: "Team",
          iconValue: props.newTeamIconValue,
          iconMode: props.teamIconMode,
          iconFile: props.teamIconFile,
          uploading: props.uploadingTeamIcon,
          onSetIconMode: props.onSetTeamIconMode,
          onSetIconValue: props.onSetNewTeamIconValue,
          onSetIconFile: props.onSetTeamIconFile,
          onUploadIcon: props.onUploadTeamIcon,
        }}
      />

      <CreateProjectModal
        open={props.showNewProjectModal}
        projectName={props.newProjectName}
        description={props.newProjectDescription}
        status={props.newProjectStatus}
        creating={props.creatingProject}
        onClose={props.onCloseNewProjectModal}
        onSetProjectName={props.onSetNewProjectName}
        onSetDescription={props.onSetNewProjectDescription}
        onSetStatus={props.onSetNewProjectStatus}
        onCreate={props.onCreateProject}
        icon={{
          label: "Project",
          iconValue: props.newProjectIconValue,
          iconMode: props.projectIconMode,
          iconFile: props.projectIconFile,
          uploading: props.uploadingProjectIcon,
          onSetIconMode: props.onSetProjectIconMode,
          onSetIconValue: props.onSetNewProjectIconValue,
          onSetIconFile: props.onSetProjectIconFile,
          onUploadIcon: props.onUploadProjectIcon,
        }}
      />

      <EditProjectModal
        open={props.editProjectModalOpen}
        projectName={props.editProjectName}
        status={props.editProjectStatus}
        onClose={props.onCloseEditProjectModal}
        onSetProjectName={props.onSetEditProjectName}
        onSetStatus={props.onSetEditProjectStatus}
        onSave={props.onUpdateProject}
        icon={{
          label: "Project",
          iconValue: props.editProjectIconValue,
          iconMode: props.editProjectIconMode,
          iconFile: props.editProjectIconFile,
          uploading: props.uploadingEditProjectIcon,
          onSetIconMode: props.onSetEditProjectIconMode,
          onSetIconValue: props.onSetEditProjectIconValue,
          onSetIconFile: props.onSetEditProjectIconFile,
          onUploadIcon: props.onUploadEditProjectIcon,
        }}
      />

      <ConfirmModal
        open={props.deleteModalOpen}
        title="프로젝트 삭제"
        message={`"${props.targetProjectName}" 프로젝트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
        onClose={props.onCloseDeleteModal}
        onConfirm={props.onDeleteProject}
      />

      <TeamRenameModal
        open={props.teamRenameModalOpen}
        teamName={props.teamRenameValue}
        onClose={props.onCloseTeamRenameModal}
        onSetTeamName={props.onSetTeamRenameValue}
        onSave={props.onRenameTeam}
        icon={{
          label: "Team",
          iconValue: props.teamEditIconValue,
          iconMode: props.teamEditIconMode,
          iconFile: props.teamEditIconFile,
          uploading: props.uploadingTeamEditIcon,
          onSetIconMode: props.onSetTeamEditIconMode,
          onSetIconValue: props.onSetTeamEditIconValue,
          onSetIconFile: props.onSetTeamEditIconFile,
          onUploadIcon: props.onUploadTeamEditIcon,
        }}
      />

      <ConfirmModal
        open={props.teamDeleteModalOpen}
        title="팀 삭제"
        message={`"${props.targetTeamName}" 팀을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
        onClose={props.onCloseTeamDeleteModal}
        onConfirm={props.onDeleteTeam}
      />
    </>
  );
}
