import { textToJSON } from "@/utils/json";
import { DocMeta, DocFolder } from "@/workspace/docs/_model/types";

// 날짜 유틸
const now = Date.now();
const hoursAgo = (h: number) =>
  new Date(now - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) =>
  new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

// ---------------------------------------------
// 초기 폴더 Mock
// ---------------------------------------------
export const MOCK_FOLDERS: DocFolder[] = [
  {
    id: "root-planning",
    name: "기획",
    icon: "📝",
    color: "#fbbf24",
    parentId: null,
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(3),
  },
  {
    id: "root-design",
    name: "디자인",
    icon: "🎨",
    color: "#a855f7",
    parentId: null,
    createdAt: daysAgo(9),
    updatedAt: hoursAgo(12),
  },
  {
    id: "root-meeting",
    name: "회의록",
    icon: "📂",
    color: "#38bdf8",
    parentId: null,
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(20),
  },
  {
    id: "ux-sub",
    name: "UX",
    icon: "💡",
    color: "#f472b6",
    parentId: "root-design",
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(10),
  },
];

// ---------------------------------------------
// 초기 문서 Mock
// ---------------------------------------------
export const MOCK_DOCS: DocMeta[] = [
  {
    id: "doc-spec",
    title: "프로젝트 요구사항",
    description: "Flowdash v1 스펙 정의",
    icon: "📘",
    color: "#2563eb",
    starred: true,
    owner: "Flowdash 팀",
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(5),
    folderId: "root-planning",
    locations: ["root-planning"],
    fileSize: 140,
    versions: [
      {
        id: "v1",
        date: daysAgo(10),
        content: textToJSON("초기 스펙 문서"),
      },
    ],
  },

  {
    id: "doc-roadmap",
    title: "Q4 로드맵",
    description: "이니셔티브 + 마일스톤",
    icon: "🗺️",
    color: "#f97316",
    owner: "전략팀",
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(12),
    folderId: "root-planning",
    locations: ["root-planning", "root-meeting"],
    fileSize: 220,
  },

  {
    id: "doc-sprint-retro",
    title: "Sprint 42 회고",
    description: "회고 + Action item",
    icon: "🔄",
    color: "#10b981",
    owner: "개발팀",
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(2),
    folderId: "root-meeting",
    locations: ["root-meeting"],
    fileSize: 180,
  },

  {
    id: "doc-launch",
    title: "런치 브리프",
    description: "베타 론칭 정의",
    icon: "🚀",
    color: "#a855f7",
    owner: "마케팅팀",
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(30),
    folderId: "root-design",
    locations: ["root-design"],
    fileSize: 95,
  },

  {
    id: "doc-ux-guide",
    title: "UX 가이드 문서",
    description: "버튼/색상/네비게이션 정책",
    icon: "✨",
    color: "#f472b6",
    owner: "디자인팀",
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(4),
    folderId: "ux-sub",
    locations: ["ux-sub"],
    fileSize: 150,
    starred: true,
  },
];

// ---------------------------------------------
// Export
// ---------------------------------------------
export const MOCK_DATA = {
  folders: MOCK_FOLDERS,
  docs: MOCK_DOCS,
};

export type DocCommentMock = {
  id: string;
  docId: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export const DOC_COMMENTS: DocCommentMock[] = [
  {
    id: "comment-1",
    docId: "doc-spec",
    authorId: "mem-alice",
    message: "상단 요약 섹션에 최신 스크린샷을 추가하고 싶어요.",
    createdAt: hoursAgo(3),
  },
  {
    id: "comment-2",
    docId: "doc-spec",
    authorId: "mem-bob",
    message: "엔지니어링 체크리스트에 API timeout 값을 넣어보겠습니다.",
    createdAt: hoursAgo(2),
  },
  {
    id: "comment-3",
    docId: "doc-roadmap",
    authorId: "mem-erin",
    message: "Q4 목표는 CS팀에서 공유받은 수치로 업데이트 필요합니다.",
    createdAt: hoursAgo(4),
  },
];
