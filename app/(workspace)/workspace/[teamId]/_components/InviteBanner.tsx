// app/(workspace)/workspace/[teamId]/_components/InviteBanner.tsx
'use client';

import { INVITE_BANNER_MESSAGE } from "../_model/constants/invite.constants";

export default function InviteBanner() {
  return (
    <div className="rounded-2xl border border-border bg-panel px-4 py-3 text-sm text-muted">
      {INVITE_BANNER_MESSAGE}
    </div>
  );
}
