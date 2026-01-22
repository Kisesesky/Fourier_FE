This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

```ts
/
├─app/                                             # Next.js App Router loot (page 라우팅)
│  ├─(workspace)/                                  ├─# 워크스페이스 관련 전용 라우트
│  │  └─workspace/                                 │  └─# /workspace 경로 loot
│  │     └─[teamId]/                               │     └─# 특정 팀에 해당하는 모든 기능
│  │        ├─_components/                         │        ├─# 팀 레벨 공통 UI
│  │        │  ├─projects/                         │        │  ├─# 프로젝트 리스트/개요 전용 UI
│  │        │  │  ├─ProjectCard.tsx                │        │  │  ├─# 프로젝트 카드 UI
│  │        │  │  ├─ProjectMenu.tsx                │        │  │  ├─# 프로젝트 우클릭 메뉴
│  │        │  │  └─ProjectToolbar.tsx             │        │  │  └─# 프로젝트 상단 툴바
│  │        │  ├─views/                            │        │  ├─# 팀 대시보드 뷰
│  │        │  │  ├─ActivitiesView.tsx             │        │  │  ├─# 최근 활동 뷰
│  │        │  │  ├─MembersView.tsx                │        │  │  ├─# 팀 멤버 리스트 뷰
│  │        │  │  ├─RecentVisitedView.tsx          │        │  │  ├─# 최근 방문한 프로젝트 뷰
│  │        │  │  └─SettingsView.tsx               │        │  │  └─# workspace 설정 뷰
│  │        │  ├─InviteBanner.tsx                  │        │  ├─# 팀 초대 배너 UI
│  │        │  ├─LeftNav.tsx                       │        │  ├─# 팀 레벨 왼쪽 네비게이션
│  │        │  ├─WorkspaceSettingsModal.tsx        │        │  ├─# workspace 단위 설정 모달
│  │        │  └─WorkspaceTabs.tsx                 │        │  └─# 팀 레벨 탭 UI
│  │        ├─_model/                              │        ├─# type, schema, logic등
│  │        │  ├─activities.ts                     │        │  ├─# 활동 정보
│  │        │  └─workspaceData.ts                  │        │  └─# workspace mock data
│  │        ├─[projectId]/                         │        ├─# 특정 프로젝트에 해당하는 기능
│  │        │  ├─calendar/                         │        │  ├─# 프로젝트 캘린더 기능
│  │        │  │  ├─_components/                   │        │  │  ├─# UI(해당 도메인/route 전용)
│  │        │  │  │  ├─components/                 │        │  │  │  ├─# 캘린더 내뷰 UI
│  │        │  │  │  │  ├─AgendaView.tsx           │        │  │  │  │  ├─# 일/주 일정 리스트
│  │        │  │  │  │  ├─CalendarCreateModal.tsx  │        │  │  │  │  ├─# 일정 생성/수정 모달
│  │        │  │  │  │  ├─CalendarDetailsPanel.tsx │        │  │  │  │  ├─# 오른쪽 상세 패널
│  │        │  │  │  │  ├─CalendarHeader.tsx       │        │  │  │  │  ├─# 캘린더 top navigation
│  │        │  │  │  │  ├─CalendarManageModal.tsx  │        │  │  │  │  ├─# 캘린더 설정 관리
│  │        │  │  │  │  ├─CalendarMonthView.tsx    │        │  │  │  │  ├─# 월간 보기
│  │        │  │  │  │  ├─CalendarTimelineView.tsx │        │  │  │  │  ├─# 시간 축 기반 Day/Week
│  │        │  │  │  │  ├─DayEventPill.tsx         │        │  │  │  │  ├─# 일정 Pill UI
│  │        │  │  │  │  ├─TimelineTaskBar.tsx      │        │  │  │  │  ├─# 일정 타임라인 블록
│  │        │  │  │  │  └─UpcomingEventCard.tsx    │        │  │  │  │  └─# 다가오는 일정 카드
│  │        │  │  │  └─CalendarView.tsx            │        │  │  │  └─# 캘린더 전체 page View 
│  │        │  │  ├─_model/                        │        │  │  ├─# type, schema, logic등
│  │        │  │  │  ├─hooks/                      │        │  │  │  ├─# calendar hooks
│  │        │  │  │  │  └─useCalendarState.ts      │        │  │  │  │  └─# 캘린더 상태관리
│  │        │  │  │  ├─mocks.ts                    │        │  │  │  ├─# calendar mock data
│  │        │  │  │  ├─types.ts                    │        │  │  │  ├─# 이벤트, 캘린더 정보 타입
│  │        │  │  │  └─utils.ts                    │        │  │  │  └─# 날짜 포맷, 범위 계산 등
│  │        │  │  ├─_service/                      │        │  │  ├─# API,fetcher,socket, sync 등
│  │        │  │  │  └─api.ts                      │        │  │  │  └─# calendar api
│  │        │  │  └─page.tsx                       │        │  │  └─# calendar loot page
│  │        │  ├─chat/                             │        │  ├─# 프로젝트 채팅 기능
│  │        │  │  ├─_components/                   │        │  │  ├─# UI(해당 도메인/route 전용)
│  │        │  │  │  ├─ChannelModals.tsx           │        │  │  │  ├─# 채널 생성/수정/삭제 모달
│  │        │  │  │  ├─ChannelSettingsModal.tsx    │        │  │  │  ├─# 채널 설정
│  │        │  │  │  ├─ChannelDashboard.tsx        │        │  │  │  ├─# 채널 목록 + 검색 패널
│  │        │  │  │  ├─ChatHeader.tsx              │        │  │  │  ├─# 채널 상단 바
│  │        │  │  │  ├─ChatRightPanel.tsx          │        │  │  │  ├─# 우측 패널(스레드/파일등)
│  │        │  │  │  ├─ChatView.tsx                │        │  │  │  ├─# 메시지 리스트 전체 뷰
│  │        │  │  │  ├─CodeFencePreview.tsx        │        │  │  │  ├─# 코드 블록 미리보기
│  │        │  │  │  ├─CommandPalette.tsx          │        │  │  │  ├─# 채팅 명령 팔레트
│  │        │  │  │  ├─Composer.tsx                │        │  │  │  ├─# 메시지 입력창
│  │        │  │  │  ├─EmojiPicker.tsx             │        │  │  │  ├─# 이모지 선택창
│  │        │  │  │  ├─FilesPanel.tsx              │        │  │  │  ├─# 채널 파일목록
│  │        │  │  │  ├─HuddleBar.tsx               │        │  │  │  ├─# 음성/화상 위한 미니 바
│  │        │  │  │  ├─Lightbox.tsx                │        │  │  │  ├─# 이미지 확대
│  │        │  │  │  ├─LinkPreview.tsx             │        │  │  │  ├─# 링크 프리뷰
│  │        │  │  │  ├─LiveReadersBar.tsx          │        │  │  │  ├─# 읽고 있는 사람들 UI
│  │        │  │  │  ├─MarkdownText.tsx            │        │  │  │  ├─# 메시지 마크다운 랜더러
│  │        │  │  │  ├─MentionPopover.tsx          │        │  │  │  ├─# 멘션 자동완성
│  │        │  │  │  ├─MessageContextMenu.tsx      │        │  │  │  ├─# 메시지 우클릭 메뉴
│  │        │  │  │  ├─MessageGroup.tsx            │        │  │  │  ├─# 메시지 그룹핑
│  │        │  │  │  ├─PinManager.tsx              │        │  │  │  ├─# 고정 메시지 UI
│  │        │  │  │  ├─ProfilePopover.tsx          │        │  │  │  ├─# 사용자 프로필 팝오버
│  │        │  │  │  ├─ReactionBar.tsx             │        │  │  │  ├─# 리액션 버튼 목록
│  │        │  │  │  ├─ReadBy.tsx                  │        │  │  │  ├─# 읽은 사용자 목록
│  │        │  │  │  ├─SavedModal.tsx              │        │  │  │  ├─# 저장된 메시지 보기 모달
│  │        │  │  │  ├─SearchPanel.tsx             │        │  │  │  ├─# 채팅 검색창
│  │        │  │  │  ├─SelectionBar.tsx            │        │  │  │  ├─# 선택 모드 UI
│  │        │  │  │  └─ThreadTeaser.tsx            │        │  │  │  └─# 스레드 티져
│  │        │  │  ├─_model/                        │        │  │  ├─# type, schema, logic 등
│  │        │  │  │  │  └─hooks/                   │        │  │  │  ├─# chat hooks
│  │        │  │  │  │     ├─useChatLifecycle.ts   │        │  │  │  │  ├─# 채팅연결/정리 관리
│  │        │  │  │  │     └─useMessageSections.ts │        │  │  │  │  └─# 날짜별 메시지 구간
│  │        │  │  │  ├─mocks.ts                    │        │  │  │  ├─# chat mock data
│  │        │  │  │  ├─store.ts                    │        │  │  │  ├─# 채팅 전용 zustand store
│  │        │  │  │  └─types.ts                    │        │  │  │  └─# chat domain 타입 정의
│  │        │  │  ├─_service/                      │        │  │  ├─# API,fetcher,socket, sync 등
│  │        │  │  │  ├─api.ts                      │        │  │  │  └─# chat api
│  │        │  │  │  └─commands.ts                 │        │  │  │  └─# slash commands, 명렁어
│  │        │  │  ├─[channelId]/                   │        │  │  ├─# 특정 채널 화면
│  │        │  │  │  └─page.tsx                    │        │  │  │  └─# 채널 메시지 page
│  │        │  │  └─page.tsx                       │        │  │  └─# chat loot page
│  │        │  ├─dashboard/                        │        │  ├─# 프로젝트 대시보드 요약
│  │        │  │  └─_components/                   │        │  │  └─# UI(해당 도메인/route 전용)
│  │        │  │     └─DashboardView.tsx           │        │  │     └─# 그래프/상태 요약 뷰
│  │        │  ├─docs/                             │        │  ├─# 문서 기능
│  │        │  │  ├─_components/                   │        │  │  ├─# UI(해당 도메인/route 전용)
│  │        │  │  │  ├─note-drive/                 │        │  │  │  ├─# 폴더/문서 라이브러리 UI
│  │        │  │  │  │  ├─tree/                    │        │  │  │  │  ├─# tree 폴더와 문서
│  │        │  │  │  │  │  ├─DelteConfirmModal.tsx │        │  │  │  │  │  ├─# ContextMenu삭제모달
│  │        │  │  │  │  │  ├─DocNode.tsx           │        │  │  │  │  │  ├─# tree docs UI
│  │        │  │  │  │  │  ├─DocsTree.tsx          │        │  │  │  │  │  ├─# tree rendering
│  │        │  │  │  │  │  ├─FolderNode.tsx        │        │  │  │  │  │  ├─# tree folder UI
│  │        │  │  │  │  │  ├─index.ts              │        │  │  │  │  │  ├─# components export
│  │        │  │  │  │  │  ├─TreeContextMenu.tsx   │        │  │  │  │  │  ├─# tree 우클릭 메뉴
│  │        │  │  │  │  │  └─TreeToolbar.tsx       │        │  │  │  │  │  └─# tree toolbar
│  │        │  │  │  │  ├─CreateFolderModal.tsx    │        │  │  │  │  ├─# 새폴더 생성 모달
│  │        │  │  │  │  ├─DocumentGrid.tsx         │        │  │  │  │  ├─# 문서 그리드 전환
│  │        │  │  │  │  ├─DocumentTable.tsx        │        │  │  │  │  ├─# 문서 테이블 전환
│  │        │  │  │  │  ├─FilterMenu.tsx           │        │  │  │  │  ├─# filtermenu
│  │        │  │  │  │  ├─FolderGrid.tsx           │        │  │  │  │  ├─# 폴더 그리드 전환
│  │        │  │  │  │  ├─SortMenu.tsx             │        │  │  │  │  ├─# sort menu
│  │        │  │  │  │  └─utils.ts                 │        │  │  │  │  └─# 문서 목록 filter/sort
│  │        │  │  │  ├─BulkActionBar.tsx           │        │  │  │  ├─# 다중 액션 바
│  │        │  │  │  ├─DocEditorCanvas.tsx         │        │  │  │  ├─# DocCanvas
│  │        │  │  │  ├─DocEditorContext.tsx        │        │  │  │  ├─# tiptap editor context
│  │        │  │  │  ├─DocEditorTabs.tsx           │        │  │  │  ├─# DocEfitor Tab부분
│  │        │  │  │  ├─DocEditorToolbar.tsx        │        │  │  │  ├─# DocEfitor toolbar
│  │        │  │  │  ├─DocImageModal.tsx           │        │  │  │  ├─# Doc Image Modal
│  │        │  │  │  ├─DocLinkModal.tsx            │        │  │  │  ├─# Doc Link Modal
│  │        │  │  │  ├─DocsDashboard.tsx           │        │  │  │  ├─# 문서 대시보드(최근문서)
│  │        │  │  │  ├─DocsRightPanel.tsx          │        │  │  │  ├─# 버전, 댓글, 활동 등
│  │        │  │  │  ├─DocView.tsx                 │        │  │  │  ├─# 문서 에디터 실제 화면
│  │        │  │  │  ├─SelectionOverlay.tsx        │        │  │  │  ├─# Doc메인 화면
│  │        │  │  │  └─SlashMenu.tsx               │        │  │  │  └─# 슬래시 명령
│  │        │  │  ├─_model/                        │        │  │  ├─# type, schema, logic 등
│  │        │  │  │  ├─hooks/                      │        │  │  │  ├─# dcos hooks
│  │        │  │  │  │  ├─useDocOutline.ts         │        │  │  │  │  ├─# 문서 아웃라인
│  │        │  │  │  │  ├─useDocTree.ts            │        │  │  │  │  ├─# 폴더+문서 계층 트리
│  │        │  │  │  │  ├─useTreeDrag.ts           │        │  │  │  │  ├─# 트리 드래그 앤 드롭
│  │        │  │  │  │  └─useTreeSelection.ts      │        │  │  │  │  └─# 트리 선택
│  │        │  │  │  ├─docs.ts                     │        │  │  │  ├─# 문서 구조, 블록 구조
│  │        │  │  │  ├─events.ts                   │        │  │  │  ├─# docs:update 이벤트 hub
│  │        │  │  │  ├─stroe.ts                    │        │  │  │  ├─# doc 전용 zustand store
│  │        │  │  │  └─types.ts                    │        │  │  │  └─# docs domain 타입 정의
│  │        │  │  ├─lib/                           │        │  │  ├─# docs lib
│  │        │  │  │  └─mocks                       │        │  │  │  └─# mocks data
│  │        │  │  │    └─mocks.ts                  │        │  │  │    └─# docs mocks data
│  │        │  │  └─page.tsx                       │        │  │  └─# doc loot page
│  │        │  ├─issues/                           │        │  ├─# Kanba / issue 트레킹
│  │        │  │  ├─_components/                   │        │  │  ├─# UI(해당 도메인/route 전용)
│  │        │  │  │  ├─kanban/                     │        │  │  │  ├─# 칸반 UI
│  │        │  │  │  │  ├─constants.ts             │        │  │  │  │  ├─# 칸반 컬럼 상수
│  │        │  │  │  │  ├─date.ts                  │        │  │  │  │  ├─# 일정 계산
│  │        │  │  │  │  ├─FilterPanel.tsx          │        │  │  │  │  ├─# 필터 UI
│  │        │  │  │  │  ├─JobSheetDialog.tsx       │        │  │  │  │  ├─# 작업표 생성/수정 모달
│  │        │  │  │  │  ├─JobSheetSection.tsx      │        │  │  │  │  ├─# Jobsheet 공통 섹션
│  │        │  │  │  │  ├─PaintingSection.tsx      │        │  │  │  │  ├─# 컬러/표시 관련section
│  │        │  │  │  │  ├─PlanningSection.tsx      │        │  │  │  │  ├─# 일정 계획
│  │        │  │  │  │  ├─ResourceSection.tsx      │        │  │  │  │  ├─# 리소스/담당자 관리
│  │        │  │  │  │  ├─SubcontractSection.tsx   │        │  │  │  │  ├─# 외주 관련 입력
│  │        │  │  │  │  ├─text.ts                  │        │  │  │  │  ├─# 이슈 문구
│  │        │  │  │  │  ├─types.ts                 │        │  │  │  │  ├─# kanban type
│  │        │  │  │  │  ├─utils.ts                 │        │  │  │  │  ├─# kanban utils
│  │        │  │  │  │  └─validation.ts            │        │  │  │  │  └─# Jobsheet validation
│  │        │  │  │  ├─IsuueDetails.tsx            │        │  │  │  ├─# issue 상세 화면
│  │        │  │  │  ├─KanbanView.tsx              │        │  │  │  ├─# kanban 전체화면
│  │        │  │  │  ├─NewIssueDialog.tsx          │        │  │  │  ├─# new issue 만들기
│  │        │  │  │  ├─RightPanel.tsx              │        │  │  │  ├─# 오른쪽 정보 패널
│  │        │  │  │  └─SprintStats.tsx             │        │  │  │  └─# 스프린트 통계
│  │        │  │  ├─_model/                        │        │  │  ├─# type, schema, logic 등
│  │        │  │  │  ├─kanbanTypes.ts              │        │  │  │  ├─# kanban 관련 type. 별도
│  │        │  │  │  ├─store.ts                    │        │  │  │  ├─# issue/kaban zustand store
│  │        │  │  │  └─types.ts                    │        │  │  │  └─# issue types
│  │        │  │  ├─_service/                      │        │  │  ├─# API,fetcher,socket, sync 등
│  │        │  │  │  └─api.ts                      │        │  │  │  └─# issue CRUD API
│  │        │  │  ├─[id]/                          │        │  │  ├─# 개별 issue
│  │        │  │  │  └─page.tsx                    │        │  │  │  └─# issue 상세 page
│  │        │  │  └─page.tsx                       │        │  │  └─# issue loot page
│  │        │  ├─members                           │        │  ├─# 멤버 관리
│  │        │  │  ├─_components/                   │        │  │  ├─# UI(해당 도메인/route 전용)
│  │        │  │  │  ├─InviteForm.tsx              │        │  │  │  ├─# 멤버 초대
│  │        │  │  │  ├─MemberAvatar.tsx            │        │  │  │  ├─# 프로필 이미지
│  │        │  │  │  ├─MemberCard.tsx              │        │  │  │  ├─# 멤버 카드
│  │        │  │  │  ├─MemberProfilePanle.tsx      │        │  │  │  ├─# 상세 패널
│  │        │  │  │  └─MembersView.tsx             │        │  │  │  └─# 전체 멤버 리스트
│  │        │  │  ├─_model/                        │        │  │  ├─# type, schema, logic 등
│  │        │  │  │  ├─mocks.ts                    │        │  │  │  ├─# member mock data
│  │        │  │  │  ├─store.ts                    │        │  │  │  ├─# member zustand store
│  │        │  │  │  └─types.ts                    │        │  │  │  └─# member types
│  │        │  │  └─page.tsx                       │        │  │  └─# member loot page
│  │        │  └─worksheet                         │        │  └─# 작업표/템플릿
│  │        │     ├─_components/                   │        │     ├─# UI(해당 도메인/route 전용)
│  │        │     │  ├─shared.ts                   │        │     │  ├─# 공통 스타일/상수
│  │        │     │  ├─WorksheetDetailView.tsx     │        │     │  ├─# 상세 화면
│  │        │     │  └─WorksheetListView.tsx       │        │     │  └─# 목록 화면
│  │        │     ├─_model/                        │        │     ├─# type, schema, logic 등
│  │        │     │  ├─mocks.ts                    │        │     │  ├─# worksheet mock data
│  │        │     │  ├─store.ts                    │        │     │  ├─# worksheet zustand store
│  │        │     │  └─types.ts                    │        │     │  └─# worksheet types
│  │        │     └─page.tsx                       │        │     └─# worksheet loot page
│  │        ├─layout.tsx                           │        ├─# teamId level layout
│  │        └─page.tsx                             │        └─# team loot page(Overview)
│  ├─api/                                          ├─# API 라우트 디렉터리 (Next Router용)
│  │  ├─calendar/                                  │  ├─# 캘린더 라우트
│  │  │  └─route.ts                                │  │  └─# 캘린더 API 라우트
│  │  ├─channels/                                  │  ├─# 챈러 라우트
│  │  │  └─route.ts                                │  │  └─# 채널 관련 API 라우트
│  │  └─messages/                                  │  └─# 메시지 라우트
│  │     └─route.ts                                │     └─# 메시지 관련 API 라우트
│  ├─favicon.ico                                   ├─# 사이트 파비콘 아이콘
│  ├─globals.css                                   ├─# Tailwind CSS 전역 스타일 정의
│  ├─layout.tsx                                    ├─# 전체 loot 레이아웃 (앱 최상위)
│  └─page.tsx                                      └─# 최상위 loot page
│
├─components/                                      # App 전반에 쓰이는 UI 컴포넌트 디렉터리
│  ├─command/                                      ├─# 명령 팔레트 및 명령 관련 UI 컴포넌트
│  │  ├─CommandPalette.tsx                         │  ├─# 명령어 검색 및 실행 UI
│  │  └─Highlight.tsx                              │  └─# 텍스트 하이라이트용 UI 컴포넌트
│  ├─common/                                       ├─# 공용 유틸 UI 컴포넌트
│  │  └─Modal.tsx                                  │  └─# 기본 모달 래퍼 (전역 스타일/애니메이션)
│  ├─layout/                                       ├─# 공통 레이아웃 컴포넌트
│  │  ├─AppShell.tsx                               │  ├─# 앱의 기본 틀, 레이아웃 래퍼
│  │  ├─MobileNavHeader.tsx                        │  ├─# 모바일 상단바(검색/알림 등)
│  │  ├─Sidebar.tsx                                │  ├─# 좌측 워크스페이스 및 채널 목록 사이드바
│  │  └─Topbar.tsx                                 │  └─# 상단 검색, 알림, 명령 팔레트 영역
│  ├─providers/                                    ├─# 전역 상태/컨텍스트 제공 컴포넌트
│  │  └─ModalHost.tsx                              │  └─# 전역 모달 컨테이너 (React Portal)
│  ├─settings/                                     ├─# 앱 설정 관련 뷰
│  │  ├─DashboardSettingsModal.tsx                 │  ├─# 대시보드 환경 설정 모달
│  │  └─SettingsModal.tsx                          │  └─# 전역 사용자 설정(테마, 알림 등) 모달
│  └─ui/                                           └─# 각종 공용 UI 컴포넌트
│     ├─button.tsx                                    ├─# 버튼 컴포넌트
│     ├─Drawer.tsx                                    ├─# 모바일용 드로어 패널 컴포넌트
│     ├─input.tsx                                     ├─# 입력창 컴포넌트
│     ├─Tabs.tsx                                      ├─# 탭 전환 UI 컴포넌트
│     ├─ThemeToggle.tsx                               ├─# 다크/라이트 모드 전환 토글
│     └─Toast.tsx                                     └─# 토스트 알림 컴포넌트
│
├─docs/                                            # 문서 관련 정리 및 가이드 파일들
│  └─ ...                                          └─# 상세문서는 직접 읽을수 있도록
│
├─hooks/                                           # 공통 hooks
│  ├─useSidebarCollapse.ts                         ├─# 사이드바 접힘 상태 제어
│  ├─useThemeMode.ts                               ├─# 다크/라이트/시스템 모드
│  ├─useWorkspacePath.ts                           ├─# (teamId / projectId) path 파싱
│  └─useWorkspaceUser.ts                           └─# 현재 유저 정보 + 권한 체크
│
├─lib/                                             # 각종 유틸리티 및 헬퍼 함수 모음
│  ├─commands.ts                                   ├─# 명령 관련 헬퍼 및 함수
│  ├─dashboardBackground.ts                        ├─# dashboard 배경 생성 로직
│  ├─kanbanHistory.ts                              ├─# Kanban 보드 히스토리 처리 관련 함수
│  ├─persist.ts                                    ├─# 로컬 저장소(로컬스토리지 등) 처리 함수
│  ├─realtime.ts                                   ├─# 실시간 동기화 및 Presence 관련 유팅
│  ├─search.ts                                     ├─# 검색 기능 지원 함수
│  ├─socket.ts                                     ├─# WebSocket 통신 함수 및 설정
│  ├─theme.ts                                      ├─# 테마 관련 유틸
│  ├─utils.ts                                      ├─# tailwind-merge 및 clsx 같이 공용 유틸 함수
│  └─workspacePath.ts                              └─# teamId/projectId path 파서
│
├─public/                                          # 정적 리소스 (이미지, 아이콘 등)
│
├─scripts/                                         # 자동화 스크립트 모음
│  └─setup-docs.mjs                                └─# 문서 초기 설정 스크립트
│
├─types/                                           # TypeScript 타입 선언 모음
│  ├─global.d.ts                                   ├─# 전역 타입 및 환경 선언
│  ├─tiptap-table.d.ts                             ├─# TipTap 에디터 테이블 타입 확장
│  └─workspace.ts                                  └─# 워크스페이스 관련 타입 정의
│
├─.gitignore                                       # gitignore
├─eslint.config.mjs                                # 개발 도구 및 빌드 환경에 대한 설정 정의
├─next-env.d.ts                                    # Next.js TypeScript 자동 생성되는 파일
├─next.config.mjs                                  # Next.js 설정 파일
├─next.config.ts                                   # Next.js 설정 파일
├─package-lock.json                                # 의존성 패키지 생성/관리 잠금 파일
├─package.json                                     # 프로젝트 의존성 및 스크립트 정의
├─postcss.config.js                                # PostCSS 설정 파일
├─README.md                                        # 프로젝트 전반 안내 문서
├─tailwind.config.ts                               # Tailwind CSS 설정 파일
└─tsconfig.json                                    # TypeScript 컴파일러 설정

```

node scripts/setup (deprecated placeholder)-docs.mjs
