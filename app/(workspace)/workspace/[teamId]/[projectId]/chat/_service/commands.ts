// components/chat/SlashCommands.ts
export type Slash = { id: string; label: string; desc: string; insert: string };

export const SLASH_COMMANDS: Slash[] = [
  { id: 'todo',  label: '/todo',  desc: '체크리스트 토글', insert: '- [ ] ' },
  { id: 'h1',    label: '/h1',    desc: '제목 1', insert: '# ' },
  { id: 'h2',    label: '/h2',    desc: '제목 2', insert: '## ' },
  { id: 'code',  label: '/code',  desc: '코드 블록', insert: '```\n\n```' },
  { id: 'quote', label: '/quote', desc: '인용', insert: '> ' },
  { id: 'image', label: '/image', desc: '이미지 업로드', insert: '' },
];
