// app/product/[slug]/_model/module-page-data.ts
export type ModulePageData = {
  title: string;
  subtitle: string;
  description: string;
  points: string[];
  images: string[];
};

export const MODULE_PAGE_MAP: Record<string, ModulePageData> = {
  "home-dashboard": {
    title: "홈 대시보드",
    subtitle: "프로젝트 전체 현황",
    description: "채팅, 이슈, 일정, 문서, 파일, 멤버 상태를 한 화면에서 확인하는 통합 대시보드입니다.",
    points: [
      "모듈별 핵심 지표 요약",
      "빠른 이동과 상세 패널 연동",
      "프로젝트 단위 운영 흐름 시각화",
    ],
    images: ["/error/homedashboard.png", "/error/projectmain.png"],
  },
  chat: {
    title: "채팅",
    subtitle: "실시간 커뮤니케이션",
    description: "채널, DM, 스레드 기반으로 대화를 구조화하고 맥락을 유지합니다.",
    points: ["채널/DM/스레드", "멘션과 반응", "파일 및 링크 프리뷰"],
    images: ["/error/chat.png", "/error/thread.png"],
  },
  issues: {
    title: "이슈",
    subtitle: "업무 트래킹",
    description: "테이블, 칸반, 타임라인, 차트 뷰를 통해 업무를 체계적으로 관리합니다.",
    points: ["우선순위/상태 관리", "칸반 기반 진행", "테이블별 분석"],
    images: ["/error/tableissue.png", "/error/kanban.png", "/error/timeline.png", "/error/issuechart.png", "/error/issuedashboard.png"],
  },
  calendar: {
    title: "캘린더",
    subtitle: "일정 관리",
    description: "프로젝트 캘린더와 개인 일정, 이슈 일정을 통합적으로 확인합니다.",
    points: ["월/주/타임라인 뷰", "캘린더별 필터", "다가오는 일정 요약"],
    images: ["/error/calendar.png"],
  },
  docs: {
    title: "문서",
    subtitle: "지식 공유",
    description: "프로젝트 문서를 작성, 정리, 협업하기 위한 문서 모듈입니다.",
    points: ["문서 트리 구조", "댓글/토론", "코드 블록과 미리보기"],
    images: ["/error/docs.png", "/error/docsedit.png"],
  },
  files: {
    title: "파일함",
    subtitle: "자료 관리",
    description: "프로젝트 파일을 폴더 기반으로 관리하고 필요한 자료를 빠르게 찾을 수 있습니다.",
    points: ["폴더별 관리", "파일 업로드/정리", "프로젝트 자산 통합"],
    images: ["/error/file.png"],
  },
};
