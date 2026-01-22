import { X } from "lucide-react";

const InviteBanner = () => (
  <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-panel px-5 py-4 text-sm text-muted">
    <div>
      <p className="font-medium text-foreground">Invite a new user and earn a $10 credit.</p>
      <p className="text-xs text-muted">Learn more</p>
    </div>
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-accent"
      aria-label="Close"
    >
      <X size={16} />
    </button>
  </section>
);

export default InviteBanner;

