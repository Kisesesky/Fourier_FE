// components/providers/ModalHost.tsx
'use client';

import { useEffect, useState } from 'react';
import SettingsModal from '@/components/settings/SettingsModal';
import DashboardSettingsModal from '@/components/settings/DashboardSettingsModal';

export default function ModalHost() {
  const [openSettings, setOpenSettings] = useState(false);
  const [openDashSettings, setOpenDashSettings] = useState(false);

  useEffect(() => {
    const openSettingsHandler = () => setOpenSettings(true);
    const openDashHandler = () => setOpenDashSettings(true);
    const closeAll = () => { setOpenSettings(false); setOpenDashSettings(false); };

    window.addEventListener('settings:open', openSettingsHandler);
    window.addEventListener('dashboard-settings:open', openDashHandler);
    window.addEventListener('modals:close', closeAll);
    return () => {
      window.removeEventListener('settings:open', openSettingsHandler);
      window.removeEventListener('dashboard-settings:open', openDashHandler);
      window.removeEventListener('modals:close', closeAll);
    };
  }, []);

  return (
    <>
      <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} />
      <DashboardSettingsModal open={openDashSettings} onClose={() => setOpenDashSettings(false)} />
    </>
  );
}
