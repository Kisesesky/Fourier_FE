// components/ui/ThemeToggle.tsx
'use client';

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { applyTheme, getStoredTheme, persistTheme, ThemeMode } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('system');

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    persistTheme(theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [theme]);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="rounded-full border border-border bg-panel shadow-panel overflow-hidden flex">
        <button
          className={`p-2 ${theme==='light'?'bg-subtle/60':''}`}
          onClick={()=> setTheme('light')}
          title="라이트"
        ><Sun size={16}/></button>
        <button
          className={`p-2 ${theme==='dark'?'bg-subtle/60':''}`}
          onClick={()=> setTheme('dark')}
          title="다크"
        ><Moon size={16}/></button>
        <button
          className={`p-2 ${theme==='system'?'bg-subtle/60':''}`}
          onClick={()=> setTheme('system')}
          title="시스템"
        ><Monitor size={16}/></button>
      </div>
    </div>
  );
}
