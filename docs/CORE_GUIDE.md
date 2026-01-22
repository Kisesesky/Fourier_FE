# Frontend — 핵심 개발 가이드 (Core Guide)

## 1. 아키텍처 개요
- Next.js 14 App Router 기반
- 도메인 단위 캡슐화 구조:
  workspace/[teamId]/[projectId]/{docs,chat,issues,calendar,members,worksheet}
- 각 도메인의 기본 구조:
  - _components
  - _model (types, store, hooks, mocks, utils)
  - _service (api, socket, sync)
  - page.tsx / layout.tsx

---

## 2. 공통 규칙

### 컴포넌트 구조
- Server Component 우선
- 상호작용/상태 필요 시만 Client Component
- "use client"는 파일 최상단

### 네이밍 규칙
- 컴포넌트: PascalCase.tsx
- hooks: useXxxx.ts
- store: store.ts
- types: types.ts
- mocks: mocks.ts

### UI / Tailwind 규칙
- 공용 스타일은 globals.css 기준
- 모든 class는 twMerge/clsx 적용 권장
- 공용 UI 컴포넌트는 components/ui/* 사용

---

## 3. 상태 관리
- 도메인 단위 Zustand store
- cross-domain store 금지
- store 구성:
  - state
  - actions
  - selectors
  - derived state

---

## 4. 레이아웃 원칙
- AppShell: header / sidebar / content / rightPanel
- 모바일에서는 Drawer 변환
- RightPanel은 공통적으로 Drawer host 활용

---

## 5. 빌드 규칙
- TipTap SSR은 `immediatelyRender: false`
- DocEditor의 Table은 런타임 가드(hasTable)
- 로컬스토리지 접근 시 typeof window 검사

---

## 6. 단축키
- `]`: 패널 열기
- `[`: 패널 닫기
- `/`: 슬래시 메뉴
- `Ctrl+S`: 저장
- `Esc`: 팝오버 닫기

---

## 7. 작업 방식
1) 파일 경로 식별  
2) 영향 범위 분석  
3) 단계별 계획 작성  
4) 전체 코드 블록 제공  
5) 마지막에 `npm run build`로 검증 문구 포함

