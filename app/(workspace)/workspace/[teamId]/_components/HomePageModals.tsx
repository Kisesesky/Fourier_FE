// app/(workspace)/workspace/[teamId]/_components/HomePageModals.tsx
'use client';

import {
  ConfirmModal,
  CreateProjectModal,
  CreateTeamModal,
  EditProjectModal,
  TeamRenameModal,
} from "./home-page-modals";
import type { HomePageModalsProps } from "../_model/types/home-page-modals.types";

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
