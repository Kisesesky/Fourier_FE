# Fourier FE

프로젝트 협업을 위한 워크스페이스 프론트엔드입니다.  
`Next.js(App Router)` 기반으로 **채팅, 이슈, 캘린더, 문서, 파일, 멤버** 모듈을 하나의 프로젝트 화면에서 통합 제공합니다.

## 핵심 목표
- 팀/프로젝트 단위 협업 화면 통합
- 모듈별 대시보드 + 상세 뷰 제공
- 프론트 구조 표준화: `_components / _model / _service`
- 상태 관리 일관화: `hooks + zustand store + zod schema`

## 주요 기능
- 인증: 로그인/회원가입/비밀번호 찾기/프로필
- 프로젝트 홈 대시보드: 모듈 요약 + 상세 패널
- 채팅: 채널/DM/스레드, 검색, 읽음 처리, 반응, 핀/보관
- 이슈: 보드/테이블/타임라인/차트 기반 이슈 관리
- 캘린더: 월/타임라인/아젠다 뷰, 이벤트/카테고리/캘린더 관리
- 문서: 노트 드라이브, 에디터(Tiptap), 댓글, 폴더 구조
- 파일: 업로드/탐색/폴더 기반 관리
- 멤버: 멤버 조회/초대/권한/프로필

## 기술 스택
- Framework: `Next.js 14`, `React 18`, `TypeScript`
- Styling/UI: `Tailwind CSS`, `Radix UI`, `lucide-react`
- State: `zustand`
- Validation/Parsing: `zod`
- Editor: `Tiptap`
- Data/HTTP: `axios`
- Realtime: `socket.io-client`

## 프로젝트 구조
```ts
/
├─app/                                                # Next.js App Router loot (page 라우팅)
│ ├─(auth)/                                           ├─# 인증 관련 전용 라우트 그룹
│ │ ├─_model/                                         │ ├─# type, schema, logic등
│ │ │ ├─auth.constants.ts                             │ │ ├─# 사용자 상수
│ │ │ └─auth.types.ts                                 │ │ └─# 사용자 타입
│ │ ├─find-password/                                  │ ├─# 비밀번호 찾기 
│ │ │ └─page.tsx                                      │ │ └─# 찾기 및 재설정
│ │ ├─profile/                                        │ ├─# 사용자 프로필
│ │ │ └─page.tsx                                      │ │ └─# 프로필 편집/조회
│ │ ├─sign-in/                                        │ ├─# 로그인
│ │ │ └─page.tsx                                      │ │ └─# 로그인 폼
│ │ ├─sign-up/                                        │ ├─# 회원가입
│ │ │ └─page.tsx                                      │ │ └─# 회원가입 폼
│ │ └─layout.tsx                                      │ └─# 인증 페이지 공통 레이아웃
│ ├─(workspace)/                                      ├─# 워크스페이스 관련 전용 라우트 그룹
│ │ └─workspace/                                      │ └─# /workspace 경로 루트
│ │   ├─[teamId]/                                     │   ├─# 특정 팀에 해당하는 모든 기능
│ │   │ ├─_components/                                │   │ ├─# 팀 레벨 공통 UI
│ │   │ │ ├─floating-dm/                              │   │ │ ├─# 플로팅 디엠 UI
│ │   │ │ │ ├─DmListView.tsx                          │   │ │ │ ├─# 디엠 리스트 뷰
│ │   │ │ │ ├─floating-dm.constants.ts                │   │ │ │ ├─# 플로팅 디엠 상수 정의
│ │   │ │ │ ├─floating-dm.utils.ts                    │   │ │ │ ├─# 플로팅 디엠 유틸
│ │   │ │ │ ├─FloatingLauncher.tsx                    │   │ │ │ ├─# 플로팅 런처
│ │   │ │ │ └─index.ts                                │   │ │ │ └─# components export
│ │   │ │ ├─home-page-modals/                         │   │ │ ├─# 홈페이지 모달
│ │   │ │ │ ├─ConfirmModal.tsx                        │   │ │ │ ├─# 확인 모달
│ │   │ │ │ ├─CreateProjectModal.tsx                  │   │ │ │ ├─# 프로젝트생성 모달
│ │   │ │ │ ├─CreateTeamModal.tsx                     │   │ │ │ ├─# 팀생성 모달
│ │   │ │ │ ├─EditProjectModal.tsx                    │   │ │ │ ├─# 프로젝트 수정 모달
│ │   │ │ │ ├─IconPickerSection.tsx                   │   │ │ │ ├─# 아이콘 선택 모달
│ │   │ │ │ ├─index.ts                                │   │ │ │ ├─# components export
│ │   │ │ │ ├─TeamRenameModal.tsx                     │   │ │ │ ├─# 팀이름 수정 모달
│ │   │ │ │ └─types.ts                                │   │ │ │ └─# 홈페이지모달 타입
│ │   │ │ ├─projects/                                 │   │ │ ├─# 프로젝트 리스트/개요 전용 UI
│ │   │ │ │ ├─index.ts                                │   │ │ │ ├─# components export
│ │   │ │ │ ├─ProjectCard.tsx                         │   │ │ │ ├─# 프로젝트 카드 UI
│ │   │ │ │ ├─ProjectMenu.tsx                         │   │ │ │ ├─# 프로젝트 우클릭 메뉴
│ │   │ │ │ └─ProjectToolbar.tsx                      │   │ │ │ └─# 프로젝트 상단 툴바
│ │   │ │ ├─views/                                    │   │ │ ├─# 팀 대시보드 뷰
│ │   │ │ │ ├─team-members/                           │   │ │ │ ├─# 팀멤버
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─InviteMemberModal.tsx                 │   │ │ │ │ ├─# 팀 초대 모달
│ │   │ │ │ │ ├─MembersTab.tsx                        │   │ │ │ │ ├─# 멤버 탭
│ │   │ │ │ │ ├─PendingInvitesTab.tsx                 │   │ │ │ │ ├─# 초대 탭
│ │   │ │ │ │ ├─RolesTab.tsx                          │   │ │ │ │ ├─# 권한 탭
│ │   │ │ │ │ ├─team-members.constants.ts             │   │ │ │ │ ├─# 팀 멤버 상수 정의
│ │   │ │ │ │ └─team-members.types.ts                 │   │ │ │ │ └─# 팀 멤버 타입 정의
│ │   │ │ │ ├─ActivitiesView.tsx                      │   │ │ │ ├─# 최근 활동 뷰
│ │   │ │ │ ├─FriendsView.tsx                         │   │ │ │ ├─# 친구 멤버 리스트 뷰
│ │   │ │ │ ├─index.ts                                │   │ │ │ ├─# components export
│ │   │ │ │ ├─RecentVisitedView.tsx                   │   │ │ │ ├─# 최근 방문한 프로젝트 뷰
│ │   │ │ │ ├─SettingsView.tsx                        │   │ │ │ ├─# 워크스페이스 설정 뷰
│ │   │ │ │ └─TeamMembersView.tsx                     │   │ │ │ └─# 팀 멤버 리스트 뷰
│ │   │ │ ├─FloatingSupportCenter.tsx                 │   │ │ ├─# 플로팅 고객센터 UI
│ │   │ │ ├─FloatingDm.tsx                            │   │ │ ├─# 플로팅 DM UI
│ │   │ │ ├─HomePageModals.tsx                        │   │ │ ├─# 홈페이지 모달
│ │   │ │ ├─index.ts                                  │   │ │ ├─# components export
│ │   │ │ ├─InviteBanner.tsx                          │   │ │ ├─# 팀 초대 배너 UI
│ │   │ │ ├─LeftNav.tsx                               │   │ │ ├─# 팀 레벨 왼쪽 네비게이션
│ │   │ │ ├─WorkspaceSettingsModal.tsx                │   │ │ ├─# 워크스페이스 단위 설정 모달
│ │   │ │ └─WorkspaceTabs.tsx                         │   │ │ └─# 팀 레벨 탭 UI
│ │   │ ├─_model/                                     │   │ ├─# type, schema, logic등
│ │   │ │ ├─hooks/                                    │   │ │ ├─# 팀 hooks
│ │   │ │ │ └─useTeams.ts                             │   │ │ │ └─# 팀 목록/상태 관리
│ │   │ │ ├─project.constants.ts                      │   │ │ ├─# 프로젝트 상수 정의
│ │   │ │ ├─project.types.ts                          │   │ │ ├─# 프로젝트 타입 정의
│ │   │ │ ├─view.constants.ts                         │   │ │ ├─# 뷰 상수 데이터
│ │   │ │ ├─view.types.ts                             │   │ │ ├─# 뷰 타입
│ │   │ │ ├─view.utils.ts                             │   │ │ ├─# 뷰 유틸
│ │   │ │ └─workspace.constants.ts                    │   │ │ └─# 워크스페이스 상수/설정값
│ │   │ ├─[projectId]/                                │   │ ├─# 특정 프로젝트에 해당하는 기능
│ │   │ │ ├─_components/                              │   │ │ ├─# UI(해당 도메인/route 전용)
│ │   │ │ │ ├─home-dashboard/                         │   │ │ │ ├─# 홈 대시보드
│ │   │ │ │ │ ├─details/                              │   │ │ │ │ ├─# 상세페이지
│ │   │ │ │ │ │ ├─CalendarDetailView.tsx              │   │ │ │ │ │ ├─# 캘린더 상세페이지
│ │   │ │ │ │ │ ├─ChatDetailView.tsx                  │   │ │ │ │ │ ├─# 채팅 상세페이지
│ │   │ │ │ │ │ ├─detail-view.types.ts                │   │ │ │ │ │ ├─# 상세페이지 타입 정의
│ │   │ │ │ │ │ ├─DocsDetailView.tsx                  │   │ │ │ │ │ ├─# 문서 상세페이지
│ │   │ │ │ │ │ ├─FileDetailView.tsx                  │   │ │ │ │ │ ├─# 파일 상세페이지
│ │   │ │ │ │ │ ├─IssuesDetailView.tsx                │   │ │ │ │ │ ├─# 이슈 상세페이지
│ │   │ │ │ │ │ └─MembersDetailView.tsx               │   │ │ │ │ │ └─# 멤버 상세페이지
│ │   │ │ │ │ ├─graph-ui.tsx                          │   │ │ │ │ ├─# 그래프 UI
│ │   │ │ │ │ └─ProjectModuleDetailView.tsx           │   │ │ │ │ └─# 프로젝트 모듈 상세페이지
│ │   │ │ ├─_model/                                   │   │ │ ├─# type, schema, logic등
│ │   │ │ │ ├─hooks/                                  │   │ │ │ ├─# 프로젝트 hook
│ │   │ │ │ │ ├─useProjectHomeDashboardData.ts        │   │ │ │ │ ├─# 프로젝트 홈 대시보드 데이터
│ │   │ │ │ │ └─useProjects.ts                        │   │ │ │ │ └─# 프로젝트 데이터
│ │   │ │ │ ├─schemas/                                │   │ │ │ ├─# Schemas
│ │   │ │ │ │ └─home-dashboard.schemas.ts             │   │ │ │ │ └─# 홈대시보드 스케마
│ │   │ │ │ ├─store/                                  │   │ │ │ ├─# Store
│ │   │ │ │ │ └─useProjectDashboardUiStore.ts         │   │ │ │ │ └─# 프로젝트대시보드 UI Store
│ │   │ │ │ ├─dashboard-page.constants.ts             │   │ │ │ ├─# 대시보드 페이지 상수 정의
│ │   │ │ │ ├─dashboard-page.types.ts                 │   │ │ │ ├─# 대시보드 페이지 타입 정의
│ │   │ │ │ └─dashboard-page.utils.ts                 │   │ │ │ └─# 대시보드 페이지 유틸
│ │   │ │ ├─calendar/                                 │   │ │ ├─# 프로젝트 캘린더 기능
│ │   │ │ │ ├─_components/                            │   │ │ │ ├─# UI(해당 도메인/route 전용)
│ │   │ │ │ │ ├─CalendarAgendaView.tsx                │   │ │ │ │ ├─# 일/주 일정 리스트
│ │   │ │ │ │ ├─CalendarCreateModal.tsx               │   │ │ │ │ ├─# 일정 생성/수정 모달
│ │   │ │ │ │ ├─CalendarDetailsPanel.tsx              │   │ │ │ │ ├─# 오른쪽 상세 패널
│ │   │ │ │ │ ├─CalendarHeader.tsx                    │   │ │ │ │ ├─# 캘린더 top navigation
│ │   │ │ │ │ ├─CalendarManageModal.tsx               │   │ │ │ │ ├─# 캘린더 설정 관리
│ │   │ │ │ │ ├─CalendarMonthView.tsx                 │   │ │ │ │ ├─# 월간 보기
│ │   │ │ │ │ ├─CalendarTimelineView.tsx              │   │ │ │ │ ├─# 시간 축 기반 Day/Week
│ │   │ │ │ │ ├─CalendarView.tsx                      │   │ │ │ │ ├─# 캘린더 전체 page View
│ │   │ │ │ │ ├─DayEventPill.tsx                      │   │ │ │ │ ├─# 일정 Pill UI
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─TimelineTaskBar.tsx                   │   │ │ │ │ ├─# 일정 타임라인 블록
│ │   │ │ │ │ └─UpcomingEventCard.tsx                 │   │ │ │ │ └─# 다가오는 일정 카드
│ │   │ │ │ ├─_model/                                 │   │ │ │ ├─# type, schema, logic등
│ │   │ │ │ │ ├─hooks/                                │   │ │ │ │ ├─# 캘린더 hooks
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ └─useCalendarState.ts                 │   │ │ │ │ │ └─# 캘린더 상태관리
│ │   │ │ │ │ ├─schemas/                              │   │ │ │ │ ├─# Schemas
│ │   │ │ │ │ │ └─calendar-view.schemas.ts            │   │ │ │ │ │ └─# 캘린더 뷰 스케마
│ │   │ │ │ │ ├─store/                                │   │ │ │ │ ├─# Store
│ │   │ │ │ │ │ └─useCalendarViewStore.ts             │   │ │ │ │ │ └─# 캘린더뷰 Store
│ │   │ │ │ │ ├─constants.ts                          │   │ │ │ │ ├─# 캘린더 상수 데이터
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─types.ts                              │   │ │ │ │ ├─# 이벤트, 캘린더 정보 타입
│ │   │ │ │ │ ├─utils.ts                              │   │ │ │ │ ├─# 날짜 포맷, 범위 계산 등
│ │   │ │ │ │ ├─view.constants.ts                     │   │ │ │ │ ├─# 캘린더 뷰 상수 데이터
│ │   │ │ │ │ ├─view.types.ts                         │   │ │ │ │ ├─# 캘린더 뷰 이벤트, 캘린더 정보 타입
│ │   │ │ │ │ └─view.utils.ts                         │   │ │ │ │ └─# 캘린더 뷰 유틸
│ │   │ │ │ ├─_service/                               │   │ │ │ ├─# API/서비스 등
│ │   │ │ │ │ ├─api.ts                                │   │ │ │ │ ├─# 캘린더 API
│ │   │ │ │ │ └─index.ts                              │   │ │ │ │ └─# components export
│ │   │ │ │ ├─[calendarId]/                           │   │ │ │ ├─# 특정 캘린더 상세
│ │   │ │ │ │ └─page.tsx                              │   │ │ │ │ └─# 캘린더 ID별 상세
│ │   │ │ │ └─page.tsx                                │   │ │ │ └─# 캘린더 루트 페이지
│ │   │ │ ├─chat/                                     │   │ │ ├─# 프로젝트 채팅 기능
│ │   │ │ │ ├─_components/                            │   │ │ │ ├─# UI(해당 도메인/route 전용)
│ │   │ │ │ │ ├─ChannelModals.tsx                     │   │ │ │ │ ├─# 채널 생성/수정/삭제 모달
│ │   │ │ │ │ ├─ChannelSettingsModal.tsx              │   │ │ │ │ ├─# 채널 설정
│ │   │ │ │ │ ├─ChatDashboard.tsx                     │   │ │ │ │ ├─# 채널 목록 + 검색 패널
│ │   │ │ │ │ ├─ChatHeader.tsx                        │   │ │ │ │ ├─# 채널 상단 바
│ │   │ │ │ │ ├─ChatRightPanel.tsx                    │   │ │ │ │ ├─# 우측 패널(스레드/파일등)
│ │   │ │ │ │ ├─ChatView.tsx                          │   │ │ │ │ ├─# 메시지 리스트 전체 뷰
│ │   │ │ │ │ ├─CodeFencePreview.tsx                  │   │ │ │ │ ├─# 코드 블록 미리보기
│ │   │ │ │ │ ├─CommandPalette.tsx                    │   │ │ │ │ ├─# 채팅 명령 팔레트
│ │   │ │ │ │ ├─Composer.tsx                          │   │ │ │ │ ├─# 메시지 입력창
│ │   │ │ │ │ ├─EmojiPicker.tsx                       │   │ │ │ │ ├─# 이모지 선택창
│ │   │ │ │ │ ├─FilesPanel.tsx                        │   │ │ │ │ ├─# 채널 파일목록
│ │   │ │ │ │ ├─HuddleBar.tsx                         │   │ │ │ │ ├─# 음성/화상 위한 미니 바
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─Lightbox.tsx                          │   │ │ │ │ ├─# 이미지 확대
│ │   │ │ │ │ ├─LinkPreview.tsx                       │   │ │ │ │ ├─# 링크 프리뷰
│ │   │ │ │ │ ├─LiveReadersBar.tsx                    │   │ │ │ │ ├─# 읽고 있는 사람들 UI
│ │   │ │ │ │ ├─MarkdownText.tsx                      │   │ │ │ │ ├─# 메시지 마크다운 랜더러
│ │   │ │ │ │ ├─MentionPopover.tsx                    │   │ │ │ │ ├─# 멘션 자동완성
│ │   │ │ │ │ ├─MessageContextMenu.tsx                │   │ │ │ │ ├─# 메시지 우클릭 메뉴
│ │   │ │ │ │ ├─MessageGroup.tsx                      │   │ │ │ │ ├─# 메시지 그룹핑
│ │   │ │ │ │ ├─PinManager.tsx                        │   │ │ │ │ ├─# 고정 메시지 UI
│ │   │ │ │ │ ├─ProfilePopover.tsx                    │   │ │ │ │ ├─# 사용자 프로필 팝오버
│ │   │ │ │ │ ├─ReadBy.tsx                            │   │ │ │ │ ├─# 읽은 사용자 목록
│ │   │ │ │ │ ├─SavedModal.tsx                        │   │ │ │ │ ├─# 저장된 메시지 보기 모달
│ │   │ │ │ │ ├─SearchPanel.tsx                       │   │ │ │ │ ├─# 채팅 검색창
│ │   │ │ │ │ ├─SelectionBar.tsx                      │   │ │ │ │ ├─# 선택 모드 UI
│ │   │ │ │ │ ├─ThreadsView.tsx                       │   │ │ │ │ ├─# 스레드 뷰
│ │   │ │ │ │ └─ThreadTeaser.tsx                      │   │ │ │ │ └─# 스레드 티져
│ │   │ │ │ ├─_model/                                 │   │ │ │ ├─# type, schema, logic 등
│ │   │ │ │ │ ├─hooks/                                │   │ │ │ │ ├─# 채팅 hooks
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ ├─useChatLifecycle.ts                 │   │ │ │ │ │ ├─# 채팅연결/정리 관리
│ │   │ │ │ │ │ ├─useMessageSections.ts               │   │ │ │ │ │ ├─# 날짜별 메시지 구간
│ │   │ │ │ │ │ └─useThreadItems.ts                   │   │ │ │ │ │ └─# 스레드 아이템 관리
│ │   │ │ │ │ ├─store/                                │   │ │ │ │ ├─# Store
│ │   │ │ │ │ │ ├─useChatDashboardUiStore.ts          │   │ │ │ │ │ ├─# 채팅대시보드 UI Store
│ │   │ │ │ │ │ ├─useChatViewUiStore.ts               │   │ │ │ │ │ ├─# 채팅 뷰 UI Store
│ │   │ │ │ │ │ └─useThreadViewSotre.ts               │   │ │ │ │ │ └─# 스레드 뷰 Store
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─store.ts                              │   │ │ │ │ ├─# 채팅 전용 zustand store
│ │   │ │ │ │ ├─types.ts                              │   │ │ │ │ ├─# 채팅 타입 정의
│ │   │ │ │ │ ├─view.constants.ts                     │   │ │ │ │ ├─# 채팅 뷰 상수 정의
│ │   │ │ │ │ └─view.types.ts                         │   │ │ │ │ └─# 채팅 뷰 타입 정의
│ │   │ │ │ ├─_service/                               │   │ │ │ ├─# API/서비스 등
│ │   │ │ │ │ ├─api.ts                                │   │ │ │ │ ├─# 채팅 API
│ │   │ │ │ │ └─index.ts                              │   │ │ │ │ └─# components export
│ │   │ │ │ ├─[channelId]/                            │   │ │ │ ├─# 특정 채널 화면
│ │   │ │ │ │ └─page.tsx                              │   │ │ │ │ └─# 채널 메시지 page
│ │   │ │ │ ├─threads/                                │   │ │ │ ├─# 스레드 목록
│ │   │ │ │ │ └─page.tsx                              │   │ │ │ │ └─# 스레드 탐색
│ │   │ │ │ └─page.tsx                                │   │ │ │ └─# 채팅 루트 페이지
│ │   │ │ ├─docs/                                     │   │ │ ├─# 문서 기능
│ │   │ │ │ ├─_components/                            │   │ │ │ ├─# UI(해당 도메인/route 전용)
│ │   │ │ │ │ ├─note-drive/                           │   │ │ │ │ ├─# 폴더/문서 라이브러리 UI
│ │   │ │ │ │ │ ├─tree/                               │   │ │ │ │ │ ├─# tree 폴더와 문서
│ │   │ │ │ │ │ │ ├─DeleteConfirmModal.tsx            │   │ │ │ │ │ │ ├─# 삭제 모달
│ │   │ │ │ │ │ │ ├─DocNode.tsx                       │   │ │ │ │ │ │ ├─# 문서 노드 UI
│ │   │ │ │ │ │ │ ├─DocsTree.tsx                      │   │ │ │ │ │ │ ├─# 폴더/문서 트리
│ │   │ │ │ │ │ │ ├─FolderNode.tsx                    │   │ │ │ │ │ │ ├─# 폴더 노드 UI
│ │   │ │ │ │ │ │ ├─index.ts                          │   │ │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ │ ├─TreeContextMenu.tsx               │   │ │ │ │ │ │ ├─# 트리 우클릭 메뉴
│ │   │ │ │ │ │ │ └─TreeToolbar.tsx                   │   │ │ │ │ │ │ └─# 트리 툴바
│ │   │ │ │ │ │ ├─CreateFolderModal.tsx               │   │ │ │ │ │ ├─# 새폴더 생성 모달
│ │   │ │ │ │ │ ├─DocumentGrid.tsx                    │   │ │ │ │ │ ├─# 문서 그리드 뷰
│ │   │ │ │ │ │ ├─DocumentTable.tsx                   │   │ │ │ │ │ ├─# 문서 테이블 뷰
│ │   │ │ │ │ │ ├─FilterMenu.tsx                      │   │ │ │ │ │ ├─# 필터 메뉴
│ │   │ │ │ │ │ ├─FolderGrid.tsx                      │   │ │ │ │ │ ├─# 폴더 그리드 뷰
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ └─SortMenu.tsx                        │   │ │ │ │ │ └─# 정렬 메뉴
│ │   │ │ │ │ ├─DocCommentsPanel.tsx                  │   │ │ │ │ ├─# 문서 댓글 패널
│ │   │ │ │ │ ├─DocEditorCanvas.tsx                   │   │ │ │ │ ├─# 문서 에디터
│ │   │ │ │ │ ├─DocEditorContext.tsx                  │   │ │ │ │ ├─# Tiptap 에디터 컨텍스트
│ │   │ │ │ │ ├─DocEditorTabs.tsx                     │   │ │ │ │ ├─# DocEditor Tab부분
│ │   │ │ │ │ ├─DocEditorToolbar.tsx                  │   │ │ │ │ ├─# DocEditor toolbar
│ │   │ │ │ │ ├─DocImageModal.tsx                     │   │ │ │ │ ├─# 문서 Image 모달
│ │   │ │ │ │ ├─DocLinkModal.tsx                      │   │ │ │ │ ├─# 문서 Link 모달
│ │   │ │ │ │ ├─DocReadView.tsx                       │   │ │ │ │ ├─# 읽기 전용 뷰
│ │   │ │ │ │ ├─DocsDashboard.tsx                     │   │ │ │ │ ├─# 문서 대시보드(최근문서)
│ │   │ │ │ │ ├─DocView.tsx                           │   │ │ │ │ ├─# 문서 에디터 뷰
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ └─SlashMenu.tsx                         │   │ │ │ │ └─# 슬래시 명령
│ │   │ │ │ ├─_model/                                 │   │ │ │ ├─# type, schema, logic 등
│ │   │ │ │ │ ├─hooks/                                │   │ │ │ │ ├─# 문서 hooks
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ ├─useDocOutline.ts                    │   │ │ │ │ │ ├─# 문서 아웃라인
│ │   │ │ │ │ │ └─useDocTree.ts                       │   │ │ │ │ │ └─# 폴더+문서 계층 트리
│ │   │ │ │ │ ├─schemas/                              │   │ │ │ │ ├─# Schemas
│ │   │ │ │ │ │ └─docs-dashboard.schemas.ts           │   │ │ │ │ │ └─# 문서 대시보드 스케마
│ │   │ │ │ │ ├─store/                                │   │ │ │ │ ├─# Store
│ │   │ │ │ │ │ └─useDocsDashboardStore.ts            │   │ │ │ │ │ └─# 문서 대시보드 Store
│ │   │ │ │ │ ├─utils/                                │   │ │ │ │ ├─# 문서 Utils
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ └─noteDriveViewUtils.ts               │   │ │ │ │ │ └─# 노트 드라이브 뷰 헬퍼
│ │   │ │ │ │ ├─docs.ts                               │   │ │ │ │ ├─# 문서 구조, 블록 구조
│ │   │ │ │ │ ├─events.ts                             │   │ │ │ │ ├─# docs:update 이벤트 hub
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─markdown.ts                           │   │ │ │ │ ├─# 마크다운 변환 로직
│ │   │ │ │ │ ├─types.ts                              │   │ │ │ │ ├─# 문서 타입 정의
│ │   │ │ │ │ ├─view.constants.ts                     │   │ │ │ │ ├─# 문서 뷰 상수
│ │   │ │ │ │ └─view.types.ts                         │   │ │ │ │ └─# 문서 뷰 타입
│ │   │ │ │ ├─_service/                               │   │ │ │ ├─# API/서비스 등
│ │   │ │ │ │ ├─api.ts                                │   │ │ │ │ ├─# 문서 API
│ │   │ │ │ │ └─index.ts                              │   │ │ │ │ └─# components export
│ │   │ │ │ ├─[docId]/                                │   │ │ │ ├─# 특정 문서 페이지
│ │   │ │ │ │ └─page.tsx                              │   │ │ │ │ └─# 문서 ID별 에디터
│ │   │ │ │ └─page.tsx                                │   │ │ │ └─# 문서 루트 페이지
│ │   │ │ ├─file/                                     │   │ │ ├─# 프로젝트 파일 관리 라우트
│ │   │ │ │ ├─_model/                                 │   │ │ │ ├─# type, schema, logic 등
│ │   │ │ │ │ ├─hooks/                                │   │ │ │ │ ├─# 파일 hooks
│ │   │ │ │ │ │ ├─useFilePageData.ts                  │   │ │ │ │ │ ├─# 파일 페이지 데이터
│ │   │ │ │ │ │ └─useProjectFileFolders.ts            │   │ │ │ │ │ └─# 파일 폴더 관리
│ │   │ │ │ │ ├─schemas/                              │   │ │ │ │ ├─# Schemas
│ │   │ │ │ │ │ └─file.schemas.ts                     │   │ │ │ │ │ └─# 파일 스케마
│ │   │ │ │ │ ├─store/                                │   │ │ │ │ ├─# Store
│ │   │ │ │ │ │ └─useFilePageStore.ts                 │   │ │ │ │ │ └─# 파일 페이지 Store
│ │   │ │ │ │ ├─file-page.types.ts                    │   │ │ │ │ ├─# 파일 페이지 타입 정의
│ │   │ │ │ │ └─vault.ts                              │   │ │ │ │ └─# 파일 저장소 로직
│ │   │ │ │ ├─_service/                               │   │ │ │ ├─# API/서비스 등
│ │   │ │ │ │ └─api.ts                                │   │ │ │ │ └─# 파일 업로드/관리 API
│ │   │ │ │ └─page.tsx                                │   │ │ │ └─# 파일 루트 페이지
│ │   │ │ ├─issues/                                   │   │ │ ├─# 이슈 트래커 라우트
│ │   │ │ │ ├─_components/                            │   │ │ │ ├─# UI(해당 도메인/route 전용)
│ │   │ │ │ │ ├─views/                                │   │ │ │ │ ├─# 이슈 리스트 뷰
│ │   │ │ │ │ │ ├─table/                              │   │ │ │ │ │ ├─# 테이블 뷰 컴포넌트
│ │   │ │ │ │ │ │ ├─index.ts                          │   │ │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ │ ├─IssueActions.tsx                  │   │ │ │ │ │ │ ├─# 이슈 액션 버튼
│ │   │ │ │ │ │ │ ├─IssueRow.tsx                      │   │ │ │ │ │ │ ├─# 이슈 행 UI
│ │   │ │ │ │ │ │ └─SubtaskList.tsx                   │   │ │ │ │ │ │ └─# 서브태스크 리스트
│ │   │ │ │ │ ├─timeline/                             │   │ │ │ │ │ ├─# 타임라인 뷰
│ │   │ │ │ │ │ │ ├─index.ts                          │   │ │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ │ ├─TimelineGroup.tsx                 │   │ │ │ │ │ │ ├─# 타임라인 그룹
│ │   │ │ │ │ │ │ └─TimelineTooltip.tsx               │   │ │ │ │ │ │ └─# 타임라인 툴팁
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ ├─IssuesChartView.tsx                 │   │ │ │ │ │ ├─# 이슈 차트 뷰
│ │   │ │ │ │ │ ├─IssuesDashboardView.tsx             │   │ │ │ │ │ ├─# 이슈 대시보드
│ │   │ │ │ │ │ ├─IssuesKanbanView.ts                 │   │ │ │ │ │ ├─# 칸반 보드 뷰
│ │   │ │ │ │ │ ├─IssuesTableView.ts                  │   │ │ │ │ │ ├─# 테이블 뷰
│ │   │ │ │ │ │ └─IssuesTimelineView.ts               │   │ │ │ │ │ └─# 타임라인 뷰
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ └─IssuesBoardView.tsx                   │   │ │ │ │ └─# 이슈 보드 메인 뷰(뷰 전환)
│ │   │ │ │ ├─_model/                                 │   │ │ │ ├─# type, schema, logic 등
│ │   │ │ │ │ ├─hooks/                                │   │ │ │ │ ├─# 이슈 hooks
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ └─useIssuesBoardState.ts              │   │ │ │ │ │ └─# 보드 상태 관리
│ │   │ │ │ │ ├─store/                                │   │ │ │ │ ├─# Store
│ │   │ │ │ │ │ └─useIssuesViewStore.ts               │   │ │ │ │ │ └─# 이슈 뷰 Store
│ │   │ │ │ │ ├─utils/                                │   │ │ │ │ ├─# 이슈 뷰 Utils
│ │   │ │ │ │ │ ├─index.ts                            │   │ │ │ │ │ ├─# components export
│ │   │ │ │ │ │ └─issueViewUtils.ts                   │   │ │ │ │ │ └─# 이슈 뷰 헬퍼
│ │   │ │ │ │ ├─analytics.constants.ts                │   │ │ │ │ ├─# 상수
│ │   │ │ │ │ ├─board.types.ts                        │   │ │ │ │ ├─# 칸반 보드 타입
│ │   │ │ │ │ ├─index.ts                              │   │ │ │ │ ├─# components export
│ │   │ │ │ │ ├─types.ts                              │   │ │ │ │ ├─# 이슈 타입 정의
│ │   │ │ │ │ ├─view.constants.ts                     │   │ │ │ │ ├─# 이슈 뷰 상수
│ │   │ │ │ │ └─view.types.ts                         │   │ │ │ │ └─# 이수 뷰 타입
│ │   │ │ │ ├─_service/                               │   │ │ │ ├─# API/서비스 등
│ │   │ │ │ │ ├─api.ts                                │   │ │ │ │ ├─# 이슈 API
│ │   │ │ │ │ └─index.ts                              │   │ │ │ │ └─# components export
│ │   │ │ │ ├─[id]/                                   │   │ │ │ ├─# 개별 이슈 상세 페이지
│ │   │ │ │ │ └─page.tsx                              │   │ │ │ │ └─# 이슈 ID별 페이지
│ │   │ │ │ └─page.tsx                                │   │ │ │ └─# 이슈 루트 페이지
│ │   │ │ └─members/                                  │   │ │ └─# 프로젝트 멤버 관리 라우트
│ │   │ │   ├─_components/                            │   │ │   ├─# UI(해당 도메인/route 전용)
│ │   │ │   │ ├─index.ts                              │   │ │   │ ├─# components export
│ │   │ │   │ ├─InviteForm.tsx                        │   │ │   │ ├─# 멤버 초대
│ │   │ │   │ ├─MemberAvatar.tsx                      │   │ │   │ ├─# 멤버 아바타
│ │   │ │   │ ├─MemberCard.tsx                        │   │ │   │ ├─# 멤버 카드
│ │   │ │   │ ├─MemberProfilePanel.tsx                │   │ │   │ ├─# 멤버 프로필 패널
│ │   │ │   │ └─MembersView.tsx                       │   │ │   │ └─# 멤버 리스트 뷰
│ │   │ │   ├─_model/                                 │   │ │   ├─# type, schema, logic 등
│ │   │ │   │ ├─schemas/                              │   │ │   │ ├─# Schemas
│ │   │ │   │ │ └─member.schemas.ts                   │   │ │   │ │ └─# 멤버 Schemas
│ │   │ │   │ ├─store/                                │   │ │   │ ├─# Store
│ │   │ │   │ │ └─useMembersViewStore.ts              │   │ │   │ │ └─# 멤버 뷰 Store
│ │   │ │   │ ├─index.ts                              │   │ │   │ ├─# components export
│ │   │ │   │ └─types.ts                              │   │ │   │ └─# 멤버 타입
│ │   │ │   └─page.tsx                                │   │ │   └─# 멤버 루트 페이지
│ │   │ ├─layout.tsx                                  │   │ ├─# teamId level layout
│ │   │ └─page.tsx                                    │   │ └─# team loot page(Overview)
│ │   └─layout.tsx                                    │   └─# workspace level layout
│ ├─product/                                          ├─# 상세페이지
│ │ └─[slug]/                                         │ └─# slug
│ │  ├─_components/                                   │   ├─# UI(해당 도메인/route 전용)
│ │  │ └─ModuleImageGallery.tsx                       │   │ └─# slug page
│ │  ├─_model/                                        │   ├─# type, schema, logic 등
│ │  │ └─module-page-data.ts                          │   │ └─# 모듈 페이지 데이터
│ │  └─page.tsx                                       │   └─# slug page
│ ├─favicon.ico                                       ├─# 사이트 파비콘 아이콘
│ ├─globals.css                                       ├─# Tailwind CSS 전역 스타일 정의
│ ├─layout.tsx                                        ├─# 전체 loot 레이아웃 (앱 최상위)
│ └─page.tsx                                          └─# 최상위 loot page
│
├─components/                                         # App 전반에 쓰이는 UI 컴포넌트 디렉터리
│ ├─command/                                          ├─# 명령 팔레트 및 명령 관련 UI 컴포넌트
│ │ ├─CommandPalette.tsx                              │ ├─# 명령어 검색 및 실행 UI
│ │ └─Highlight.tsx                                   │ └─# 텍스트 하이라이트용 UI 컴포넌트
│ ├─common/                                           ├─# 공용 유틸 UI 컴포넌트
│ │ └─Modal.tsx                                       │ └─# 기본 모달 래퍼 (전역 스타일/애니메이션)
│ ├─home/                                             ├─# 홈 화면
│ │ └─WorkspaceMainPanel.tsx                          │ └─# 홈화면 메인 판넬
│ ├─landing/                                          ├─# 랜딩 UI 컴포넌트
│ │ ├─landing.constants.ts                            │ ├─# 랜딩 상수
│ │ ├─LandingMainContent.tsx                          │ ├─# 랜딩 메인 UI
│ │ └─LandingShell.tsx                                │ └─# 랜딩 쉘
│ ├─layout/                                           ├─# 공통 레이아웃 컴포넌트
│ │ ├─sidebar/                                        │ ├─# 사이드바
│ │ │  ├─CalendarPanel.tsx                            │ │ ├─# 캘린더 판넬
│ │ │  ├─ChatPanel.tsx                                │ │ ├─# 채팅 판넬
│ │ │  ├─DocsPanel.tsx                                │ │ ├─# 문서 판넬
│ │ │  ├─FilePanel.tsx                                │ │ ├─# 파일 판넬
│ │ │  ├─IssuesPanel.tsx                              │ │ ├─# 이슈 판넬
│ │ │  ├─MembersPanel.tsx                             │ │ ├─# 멤버 판넬
│ │ │  ├─sidebar.constants.ts                         │ │ ├─# 사이드바 상수
│ │ │  ├─sidebar.shared.tsx                           │ │ ├─# 사이드바 공유
│ │ │  └─sidebar.types.ts                             │ │ └─# 사이드바 타입
│ │ ├─topbar/                                         │ ├─# 탑바
│ │ │  ├─DefaultTopbar.tsx                            │ │ ├─# 기본 탑바
│ │ │  ├─NotificationsMenu.tsx                        │ │ ├─# 알람 메뉴
│ │ │  ├─ProfilePanel.tsx                             │ │ ├─# 프로필 영역
│ │ │  ├─ToolbarIcon.tsx                              │ │ ├─# 탑바 아이콘
│ │ │  ├─topbar.constants.ts                          │ │ ├─# 탑바 상수 정의
│ │ │  ├─topbar.types.ts                              │ │ ├─# 탑바 타입 정의
│ │ │  ├─UserMenu.tsx                                 │ │ ├─# 사용자 메뉴
│ │ │  └─WorkspaceTopbar.tsx                          │ │ └─# 워크스페이스 탑바
│ │ ├─AppShell.tsx                                    │ ├─# 앱의 기본 틀, 레이아웃 래퍼
│ │ ├─ChatCreateChannelHost.tsx                       │ ├─# 채널 생성 호스트 컴포넌트
│ │ ├─MobileNavHeader.tsx                             │ ├─# 모바일 상단바(검색/알림 등)
│ │ ├─Sidebar.tsx                                     │ ├─# 좌측 워크스페이스 및 채널 목록 사이드바
│ │ └─Topbar.tsx                                      │ └─# 상단 검색, 알림, 명령 팔레트 영역
│ ├─settings/                                         ├─# 앱 설정 관련 뷰
│ │ └─SettingsModal.tsx                               │ └─# 전역 사용자 설정(테마, 알림 등) 모달
│ └─ui/                                               └─# 각종 공용 UI 컴포넌트
│   ├─button.tsx                                        ├─# 버튼 컴포넌트
│   ├─Drawer.tsx                                        ├─# 모바일용 드로어 패널 컴포넌트
│   ├─input.tsx                                         ├─# 입력창 컴포넌트
│   ├─Tabs.tsx                                          ├─# 탭 전환 UI 컴포넌트
│   └─Toast.tsx                                         └─# 토스트 알림 컴포넌트
│
├─docs/                                               # 문서 관련 정리 및 가이드 파일들
│ └─ ...                                              └─# 상세문서는 직접 읽을수 있도록
│
├─hooks/                                              # 공통 hooks
│ ├─useAuthProfile.ts                                 ├─# 인증 프로필 
│ ├─useProject.ts                                     ├─# 프로젝트 데이터
│ ├─useSidebarCollapse.ts                             ├─# 사이드바 접힘 상태 제어
│ ├─useThemeMode.ts                                   ├─# 다크/라이트/시스템 모드
│ ├─useWorkspace.ts                                   ├─# 워크스페이스 데이터
│ ├─useWorkspacePath.ts                               ├─# (teamId / projectId) path 파싱
│ └─useWorkspaceUser.ts                               └─# 현재 유저 정보 + 권한 체크
│
├─lib/                                                # 각종 유틸리티 및 헬퍼 함수 모음
│ ├─activity.ts                                       ├─# 활동 로그 유틸
│ ├─api.ts                                            ├─# 공통 API 클라이언트
│ ├─auth.ts                                           ├─# 인증 헬퍼
│ ├─chat.ts                                           ├─# 채팅 유틸
│ ├─commands.ts                                       ├─# 명령 관련 헬퍼 및 함수
│ ├─dashboardBackground.ts                            ├─# 대시보드 배경 생성 로직
│ ├─kanbanHistory.ts                                  ├─# 칸반 보드 히스토리 처리 관련 함수
│ ├─members.ts                                        ├─# 멤버 관리 유틸
│ ├─notifications.ts                                  ├─# 알림 시스템
│ ├─persist.ts                                        ├─# 로컬 저장소(로컬스토리지 등) 처리 함수
│ ├─presence.ts                                       ├─# 실시간 Presence
│ ├─profile-prefs.ts                                  ├─# 프로필 선호도
│ ├─projects.ts                                       ├─# 프로젝트 유틸
│ ├─realtime.ts                                       ├─# 실시간 동기화 및 Presence 관련 유팅
│ ├─search.ts                                         ├─# 검색 기능 지원 함수
│ ├─socket.ts                                         ├─# WebSocket 통신 함수 및 설정
│ ├─support.ts                                        ├─# 고객센터 관리
│ ├─team.ts                                           ├─# 팀 관리
│ ├─theme.ts                                          ├─# 테마 관련 유틸
│ ├─uploads.ts                                        ├─# 파일 업로드
│ ├─users.ts                                          ├─# 사용자 유틸
│ ├─utils.ts                                          ├─# tailwind-merge 및 clsx 같이 공용 유틸 함수
│ ├─workspace.ts                                      ├─# 워크스페이스 헬퍼
│ └─workspacePath.ts                                  └─# teamId/projectId path 파서
│
├─public/                                             # 정적 리소스 (이미지, 아이콘 등)
│
├─scripts/                                            # 자동화 스크립트 모음
│ └─setup-docs.mjs                                    └─# 문서 초기 설정 스크립트
│
├─types/                                              # TypeScript 타입 선언 모음
│ ├─global.d.ts                                       ├─# 전역 타입 및 환경 선언
│ ├─project.ts                                        ├─# 프로젝트 타입
│ ├─tiptap-table.d.ts                                 ├─# TipTap 에디터 테이블 타입 확장
│ └─workspace.ts                                      └─# 워크스페이스 관련 타입 정의
│
├─utils/                                              # JS 유틸
│ └─json.ts                                           └─# JSON 처리 헬퍼
├─.gitignore                                          # gitignore
├─eslint.config.mjs                                   # 개발 도구 및 빌드 환경에 대한 설정 정의
├─next-env.d.ts                                       # Next.js TypeScript 자동 생성되는 파일
├─next.config.mjs                                     # Next.js 설정 파일
├─next.config.ts                                      # Next.js 설정 파일
├─package-lock.json                                   # 의존성 패키지 생성/관리 잠금 파일
├─package.json                                        # 프로젝트 의존성 및 스크립트 정의
├─postcss.config.js                                   # PostCSS 설정 파일
├─README.md                                           # 프로젝트 전반 안내 문서
├─tailwind.config.ts                                  # Tailwind CSS 설정 파일
└─tsconfig.json                                       # TypeScript 컴파일러 설정

```

## 모듈 설계 원칙
각 도메인은 아래 레이어를 기본으로 사용합니다.

- `_components`: 화면/UI 표현
- `_model`: 타입, 상수, 계산 유틸, hooks, zustand store, zod schemas
- `_service`: 서버 통신(API)과 DTO 변환

권장 데이터 흐름:
`_service(api) -> zod schema parse -> hook/model 가공 -> store(UI state) -> component 렌더`

## 실행 방법
### 1) 설치
```bash
cd Fourier_FE
npm install
```

### 2) 환경 변수
`.env.local`에 백엔드 주소를 설정합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

기본값은 `Fourier_FE/lib/api.ts`에서
`http://localhost:3001/api/v1`로 지정되어 있습니다.

### 3) 개발 서버
```bash
npm run dev
```
- 기본 포트: `3000`

### 4) 빌드/실행
```bash
npm run build
npm run start
```

### 5) 린트
```bash
npm run lint
```

## 주요 라우트
- `/sign-in`, `/sign-up`, `/find-password`, `/profile`
- `/workspace/[teamId]`
- `/workspace/[teamId]/[projectId]`
- `/workspace/[teamId]/[projectId]/chat`
- `/workspace/[teamId]/[projectId]/issues`
- `/workspace/[teamId]/[projectId]/calendar`
- `/workspace/[teamId]/[projectId]/docs`
- `/workspace/[teamId]/[projectId]/file`
- `/workspace/[teamId]/[projectId]/members`

## 백엔드 연동
- 이 프론트는 `Fourier_BE` API와 연동을 전제로 구성되어 있습니다.
- 인증 토큰은 `localStorage(accessToken)` 기반으로 요청 헤더에 주입됩니다.
- 쿠키 기반 인증도 고려하여 `withCredentials: true`가 활성화되어 있습니다.

## 모듈별 API 맵
기본 베이스 URL: `NEXT_PUBLIC_API_BASE_URL` (기본값: `http://localhost:3001/api/v1`)

### Auth
| Method | Path | 설명 |
|---|---|---|
| POST | `/auth/sign-in` | 로그인 |
| POST | `/auth/sign-out` | 로그아웃 |
| GET | `/auth/profile` | 내 프로필 조회 |
| PATCH | `/users/update` | 프로필 수정 |

### Project Home
| Method | Path | 설명 |
|---|---|---|
| GET | `/team/:teamId/project` | 프로젝트 목록 |
| GET | `/team/:teamId/project/:projectId/members` | 프로젝트 멤버 목록 |
| GET | `/team/:teamId/project/:projectId/members/analytics` | 멤버 분석 데이터 |

### Chat
| Method | Path | 설명 |
|---|---|---|
| GET | `/chat/channels` | 채널 목록 |
| POST | `/chat/channels` | 채널 생성 |
| GET | `/chat/channel/messages` | 채널 메시지 목록 |
| POST | `/chat/channel/message` | 채널 메시지 전송 |
| POST | `/chat/dm/room` | DM 룸 생성/조회 |
| POST | `/chat/dm/message` | DM 메시지 전송 |
| POST | `/chat/thread/message` | 스레드 메시지 전송 |
| GET | `/chat/channel/pins` | 핀 메시지 목록 |
| GET | `/chat/messages/saved` | 저장 메시지 목록 |
| GET | `/chat/channel/preferences` | 채널 환경설정 조회 |
| POST | `/chat/channel/preferences` | 채널 환경설정 저장 |
| GET | `/chat/analytics/messages` | 메시지 분석 |
| GET | `/team/:teamId/project/:projectId/members` | 채팅 멤버 매핑용 프로젝트 멤버 |

### Issues
| Method | Path | 설명 |
|---|---|---|
| GET | `/projects/:projectId/issues` | 이슈 목록 |
| GET | `/projects/:projectId/issues/board` | 보드용 이슈 목록 |
| GET | `/projects/:projectId/issues/analytics` | 이슈 분석 |
| POST | `/projects/:projectId/issues` | 이슈 생성 |
| PATCH | `/projects/:projectId/issues/:issueId` | 이슈 수정 |
| DELETE | `/projects/:projectId/issues/:issueId` | 이슈 삭제 |
| GET | `/projects/:projectId/issues/groups` | 이슈 그룹 목록 |
| POST | `/projects/:projectId/issues/groups` | 이슈 그룹 생성 |
| PATCH | `/projects/:projectId/issues/groups/:groupId` | 이슈 그룹 수정 |
| PATCH | `/projects/:projectId/issues/groups/:groupId/remove` | 이슈 그룹 제거 |
| PATCH | `/projects/:projectId/issues/:issueId/status` | 이슈 상태 변경 |
| PATCH | `/projects/:projectId/issues/:issueId/progress` | 이슈 진행률 변경 |
| PATCH | `/projects/:projectId/issues/:issueId/assign` | 담당자 지정 |
| POST | `/projects/:projectId/issues/:issueId/comment` | 댓글 생성 |
| PATCH | `/projects/:projectId/issues/comment/:commentId` | 댓글 수정 |
| DELETE | `/projects/:projectId/issues/comment/:commentId` | 댓글 삭제 |
| POST | `/projects/:projectId/issues/subtask` | 하위 작업 생성 |
| DELETE | `/projects/:projectId/issues/subtask/:subtaskId` | 하위 작업 삭제 |
| GET | `/projects/:projectId/activity` | 이슈 활동 로그 소스 |

### Calendar
| Method | Path | 설명 |
|---|---|---|
| GET | `/projects/:projectId/calendar/events` | 이벤트 목록 |
| POST | `/projects/:projectId/calendar/events` | 이벤트 생성 |
| PATCH | `/projects/:projectId/calendar/events/:eventId` | 이벤트 수정 |
| DELETE | `/projects/:projectId/calendar/events/:eventId` | 이벤트 삭제 |
| GET | `/projects/:projectId/calendar/analytics` | 캘린더 분석 |
| GET | `/projects/:projectId/calendar/calendars` | 프로젝트 캘린더 목록 |
| POST | `/projects/:projectId/calendar/calendars` | 프로젝트 캘린더 생성 |
| PATCH | `/projects/:projectId/calendar/calendars/:calendarId` | 프로젝트 캘린더 수정 |
| DELETE | `/projects/:projectId/calendar/calendars/:calendarId` | 프로젝트 캘린더 삭제 |
| GET | `/projects/:projectId/calendar/calendars/:calendarId/categories` | 캘린더 카테고리 목록 |
| POST | `/projects/:projectId/calendar/calendars/:calendarId/categories` | 카테고리 생성 |
| PATCH | `/projects/:projectId/calendar/calendars/:calendarId/categories/:categoryId` | 카테고리 수정 |
| DELETE | `/projects/:projectId/calendar/calendars/:calendarId/categories/:categoryId` | 카테고리 삭제 |
| GET | `/projects/:projectId/calendar/categories` | 프로젝트 전체 카테고리 |
| GET | `/projects/:projectId/calendar/folders` | 캘린더 폴더 목록 |
| POST | `/projects/:projectId/calendar/folders` | 캘린더 폴더 생성 |
| PATCH | `/projects/:projectId/calendar/folders/:folderId` | 캘린더 폴더 수정 |
| DELETE | `/projects/:projectId/calendar/folders/:folderId` | 캘린더 폴더 삭제 |
| GET | `/projects/:projectId/calendar/calendars/:calendarId/members` | 캘린더 참여 멤버 |

### Docs
| Method | Path | 설명 |
|---|---|---|
| GET | `/docs/analytics` | 문서 분석 |
| GET | `/docs/folders` | 폴더 목록 |
| POST | `/docs/folder` | 폴더 생성 |
| PATCH | `/docs/folder/:id` | 폴더 수정 |
| PATCH | `/docs/folder/:id/move` | 폴더 이동 |
| DELETE | `/docs/folder/:id` | 폴더 삭제 |
| GET | `/docs/documents` | 문서 목록 |
| POST | `/docs/document` | 문서 생성 |
| PATCH | `/docs/document/:id` | 문서 수정 |
| DELETE | `/docs/document/:id` | 문서 삭제 |
| GET | `/docs/search` | 문서 검색 |
| GET | `/docs/document/:documentId/comments` | 문서 댓글 목록 |
| POST | `/docs/document/:documentId/comment` | 문서 댓글 생성 |
| PATCH | `/docs/comment/:commentId` | 문서 댓글 수정 |
| DELETE | `/docs/comment/:commentId` | 문서 댓글 삭제 |

### Files
| Method | Path | 설명 |
|---|---|---|
| GET | `/files/folders` | 파일 폴더 목록 |
| POST | `/files/folder` | 파일 폴더 생성 |
| PATCH | `/files/folder/:folderId` | 파일 폴더 수정 |
| DELETE | `/files/folder/:folderId` | 파일 폴더 삭제 |
| GET | `/files` | 파일 목록 |
| POST | `/files/project/upload` | 프로젝트 파일 업로드 |
| DELETE | `/files/:fileId` | 파일 삭제 |

### Members / Team
| Method | Path | 설명 |
|---|---|---|
| GET | `/team/:teamId/project/:projectId/members` | 프로젝트 멤버 목록 |
| POST | `/team/:teamId/project/:projectId/member` | 프로젝트 멤버 추가 |
| PATCH | `/team/:teamId/project/:projectId/member` | 프로젝트 멤버 권한 수정 |
| DELETE | `/team/:teamId/project/:projectId/member/:userId` | 프로젝트 멤버 제거 |
| GET | `/workspace/:workspaceId/team/:teamId/members` | 팀 멤버 목록 |
| GET | `/workspace/:workspaceId/team/:teamId/invites` | 팀 초대 목록 |
| POST | `/workspace/:workspaceId/team/:teamId/invite` | 팀 멤버 초대 |
| PATCH | `/workspace/:workspaceId/team/:teamId/members/:memberId/role` | 팀 멤버 역할 변경 |
| DELETE | `/workspace/:workspaceId/team/:teamId/members/:memberId` | 팀 멤버 제거 |

## 개발 가이드
- 새 기능은 도메인 경로 하위에 `_components / _model / _service`로 분리
- 타입/상수는 컴포넌트 내부 선언보다 `_model` 분리를 우선
- API 응답은 가능하면 `zod`로 검증 후 사용
- UI 로컬 상태가 커지면 `zustand store`로 승격
- 파일 상단 경로 주석 규칙을 유지하여 탐색성을 높임
