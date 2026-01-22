import clsx from "clsx";
import { ArrowRight, Copy, Pencil, Trash2 } from "lucide-react";

interface ProjectMenuProps {
  onClose: () => void;
}

const ProjectMenu = ({ onClose }: ProjectMenuProps) => {
  const items = [
    { label: "Rename", icon: Pencil },
    { label: "Clone Project", icon: Copy },
    { label: "Move Project", icon: ArrowRight },
    { label: "Delete Project", icon: Trash2, className: "text-red-300" },
  ];

  return (
    <div
      className="absolute right-0 top-full z-20 mt-2 w-40 rounded-2xl border border-border bg-panel text-sm text-foreground shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={clsx("flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-accent", item.className)}
          onClick={onClose}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ProjectMenu;

