// scripts/setup-docs.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");
const docsDir = resolve(root, "docs");

const README = `# 🧩 Flowdash — 통합 워크 플랫폼 (Frontend Prototype)

> **Flow.team + Notion + Discord + Jira** 기능을 하나로 결합한 통합 Work OS  
> 현재 단계: 백엔드 없이 프론트엔드 UI/UX 완성 중심 MVP 구축

---

## 🎯 프로젝트 핵심 목표

| 영역 | 기능 |
|------|------|
| Chat | 채널/스레드/AI요약 |
| Docs | 블록 기반 문서 + 협업 에디터 |
| Issues | 칸반/스프린트 관리 |
| Calendar | 일정 뷰 + 연동 |
| Global | 알림 + 검색 + 단축키 시스템 |

---

## 🧰 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Editor | TipTap + Lowlight(Highlight.js) |
| State | Context API + LocalStorage |
| Icons | Lucide-react |
| Test | Vitest + Playwright |
| Deploy | Vercel / GitHub Actions |

---

## 📂 디렉터리 구조

\`\`\`
app/
 ├─ layout.tsx
 ├─ app/
 │   ├─ docs/
 │   │   ├─ layout.tsx
 │   │   └─ page.tsx
 │   ├─ issues/
 │   │   ├─ layout.tsx
 │   │   └─ page.tsx
 │   ├─ chat/
 │   │   ├─ layout.tsx
 │   │   └─ page.tsx
 │   └─ calendar/
 │       └─ page.tsx
components/
 ├─ layout/AppShell.tsx
 ├─ Sidebar.tsx / Topbar.tsx / RightPanel.tsx
 ├─ docs/
 │   ├─ DocEditorContext.tsx
 │   ├─ DocsRightPanel.tsx
 │   └─ SlashMenu.tsx
 ├─ chat/ChatRightPanel.tsx
 ├─ issues/KanbanView.tsx
 ├─ ui/
 │   ├─ Tabs.tsx / Toast.tsx / Drawer.tsx / button.tsx / input.tsx
 └─ views/
     ├─ docs/DocView.tsx
     ├─ chat/ChatView.tsx
     ├─ issues/KanbanView.tsx
     └─ calendar/CalendarView.tsx
lib/
 ├─ persist.ts / api.ts / utils.ts
 ├─ kanbanHistory.ts
 └─ socket.ts
docs/
 ├─ README.md
 ├─ DEVELOPMENT_GUIDE.md
 └─ PROJECT_LOG.md
\`\`\`

---

## 🚀 실행 방법

\`\`\`bash
npm install
npm run dev
# http://localhost:3000
\`\`\`

---

## 🧭 향후 로드맵
1. Chat / Docs / Issues 실시간 연동
2. AI Summarization 및 Task Extraction
3. Presence 기반 협업 에디팅
4. GitHub / Google Calendar 연동
5. 통합 검색 & Notification Stream
`;

const DEV_GUIDE = `# 📘 Flowdash Frontend 개발 가이드

---

## 1️⃣ 개발 철학
- **"프론트 단독 MVP"** : 백엔드 없이 UX 완성
- **모듈화된 레이아웃** : Sidebar / Topbar / RightPanel의 유기적 구성
- **Context 기반 상태** : DocEditor / ChatStore 등 전역 상태 공유
- **SSR 안정성** : TipTap은 always \`immediatelyRender: false\`

---

## 2️⃣ 기술 스택
| 항목 | 기술 |
|------|------|
| Framework | Next.js 14 App Router |
| Editor | TipTap + Lowlight |
| Styling | TailwindCSS |
| State | React Context + LocalStorage |
| Icons | Lucide-react |
| Build/Deploy | Vercel |
| Test | Vitest / Playwright |

---

## 3️⃣ 주요 도메인별 설명

### 📝 Docs (문서 에디터)
- 기반: TipTap
- 구성 요소:
  - \`DocView.tsx\` : 에디터 본체
  - \`DocEditorContext.tsx\` : 전역 Editor Provider
  - \`DocsRightPanel.tsx\` : Outline / History 탭
  - \`app/docs/layout.tsx\` : 전용 Drawer Shell
- 주요 기능:
  - / 명령 팝업 (todo, ul, ol, code, table, image, file)
  - 테이블 편집 + 셀 스타일링
  - 이미지/파일 업로드 + 업로드 플레이스홀더
  - 자동 스냅샷 (60초/200자 기준)
  - Outline 탭: 문서 헤딩 자동 추출
  - History 탭: 버전 리스트/복원(Mock)
  - 단축키: \`[\`, \`]\` (패널 토글)

### 💬 Chat
- 구성 요소:
  - \`ChatRightPanel.tsx\` : Thread / AI Summary 탭
  - \`app/chat/layout.tsx\` : Drawer + 단축키 Shell
- 특징:
  - 채널별 스레드 / 미리보기 / 요약
  - 모바일 Drawer 전환
  - 향후 WebSocket 연동 예정

### 📋 Issues (Kanban)
- \`KanbanView.tsx\`: DnD 칸반 보드
- \`app/issues/layout.tsx\`: AppShell + Drawer 구조
- 기능:
  - LocalStorage 기반 보드 저장
  - Undo/Redo 히스토리
  - 카드 생성/이동/완료일 자동 기입
  - 향후 /app/issues/[id] 중첩라우팅 예정

---

## 4️⃣ 상태 관리 & 스토리지
| 도메인 | 저장소 | 키 |
|--------|--------|----|
| Docs | localStorage | fd.docs.content:{id} |
| Docs Snapshots | localStorage | fd.docs.snapshots:{id} |
| Kanban | localStorage | fd.kanban.board |
| Sprint Days | localStorage | fd.kanban.sprintDays |

---

## 5️⃣ UI 구성 원칙
- 모든 뷰는 \`AppShell\`을 기반으로 함
- RightPanel은 반응형 Drawer로 전환
- ToastProvider는 항상 \`AppLayout\`에 포함
- TableExtension은 런타임 가드(hasTable) 필수

---

## 6️⃣ 반응형 패널 구조
| 모드 | 구조 |
|------|------|
| Desktop | Sidebar + Main + RightPanel |
| Tablet | Sidebar + Main |
| Mobile | Drawer로 RightPanel 토글 |

---

## 7️⃣ 향후 개선
| 범주 | 기능 | 상태 |
|------|------|------|
| Docs | Heading 자동 ID(slugify) | 예정 |
| Docs | Outline 직접 편집 | 예정 |
| Docs | Snapshot 복원(localStorage) | 예정 |
| Chat | Thread → Sidebar 연동 | 예정 |
| Layout | Panel Collapse Button | 예정 |
| Issues | 중첩 라우팅 연결 | 예정 |

---

## 8️⃣ 단축키 요약
| 키 | 기능 |
|----|------|
| \`]\` | 우측 패널 열기 |
| \`[\` | 우측 패널 닫기 |
| \`/\` | 슬래시 명령 호출 |
| \`Ctrl+S\` | 문서 저장 |
| \`Esc\` | 슬래시 메뉴 닫기 |

---

## 9️⃣ 배포 / 환경 변수
\`\`\`
NEXT_PUBLIC_AUTOSAVE_MS=60000
NEXT_PUBLIC_MAX_FILE_MB=20
NEXT_PUBLIC_API_URL=https://api.flowdash.dev
\`\`\`

---

## ✅ 완료 기준 (DoD)
- SSR/CSR 일관성
- TypeScript 오류 0
- 반응형 대응
- 접근성 준수
- 전역 상태 안정
`;

const LOG = `# 📜 프로젝트 로그 & 개발 히스토리 (2025-10-21 기준)

---

## 🧭 진행 타임라인

| 날짜 | 주요 내용 |
|------|------------|
| 10/19 | 프로젝트 구조 설계 |
| 10/20 | Next.js + Tailwind 세팅 |
| 10/20 | TipTap 초기 구성 및 SSR 오류 수정 |
| 10/21 | Table 확장 undefined 가드 처리 |
| 10/21 | KanbanView / IssuesLayout 완성 |
| 10/21 | Docs Outline + History 패널 구축 |
| 10/21 | ChatRightPanel + AI Summary 탭 추가 |
| 10/21 | Drawer + 단축키 시스템 통합 |
| 10/21 | 전체 문서 자동 생성 스크립트 작성 (본 파일) |

---

## 🧩 주요 개선 포인트

1. **ToastProvider 전역화**
   - RootLayout에서만 제공하던 Toast를 AppShell로 이관.
2. **RightPanel 중복 제거**
   - IssuesLayout, DocsLayout에서 Drawer 기반으로 분리.
3. **AppShell 통합 구조**
   - header / sidebar / rightPanel prop으로 구성.
4. **OutlineView 안정화**
   - editor.on → editor.off 방식으로 수정.

---

## 🧠 다음 단계 계획

| 항목 | 설명 |
|------|------|
| Docs 협업 | Presence, Mentions, Commenting |
| Kanban 확장 | Sprint / Filter / Chart |
| Chat 확장 | Thread / Reaction / File Upload |
| Layout 개선 | Collapse Button, Dynamic Width |
| State 통합 | Zustand Store 기반 전환 |
| AI 기능 | Summary / Auto Task / Insight |

---

> **Flowdash Frontend v0.5 — UX Skeleton Stable**
> “기능보다 흐름을 먼저 완성하라.”
`;

async function main() {
  await mkdir(docsDir, { recursive: true });
  await writeFile(resolve(docsDir, "README.md"), README, "utf8");
  await writeFile(resolve(docsDir, "DEVELOPMENT_GUIDE.md"), DEV_GUIDE, "utf8");
  await writeFile(resolve(docsDir, "PROJECT_LOG.md"), LOG, "utf8");
  console.log("✅ docs 폴더 및 문서 3종 생성 완료!");
  console.log("📁 생성 경로:", docsDir);
}

main().catch((err) => {
  console.error("문서 생성 중 오류:", err);
  process.exit(1);
});



