// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/ProjectModuleDetailView.tsx
'use client';

import type { DetailViewBaseProps } from './details/detail-view.types';
import CalendarDetailView from './details/CalendarDetailView';
import ChatDetailView from './details/ChatDetailView';
import DocsDetailView from './details/DocsDetailView';
import FileDetailView from './details/FileDetailView';
import IssuesDetailView from './details/IssuesDetailView';
import MembersDetailView from './details/MembersDetailView';

type ProjectModuleDetailViewProps = DetailViewBaseProps & {
  view: string;
};

export default function ProjectModuleDetailView(props: ProjectModuleDetailViewProps) {
  const { view } = props;

  switch (view) {
    case 'chat':
      return <ChatDetailView {...props} />;
    case 'issues':
      return <IssuesDetailView {...props} />;
    case 'members':
      return <MembersDetailView {...props} />;
    case 'docs':
      return <DocsDetailView {...props} />;
    case 'calendar':
      return <CalendarDetailView {...props} />;
    case 'file':
      return <FileDetailView {...props} />;
    default:
      return null;
  }
}
