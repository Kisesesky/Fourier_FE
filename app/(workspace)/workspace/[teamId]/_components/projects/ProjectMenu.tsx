import clsx from "clsx";
import { Copy, Pencil, Trash2 } from "lucide-react";

interface ProjectMenuProps {
  onClose: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

const ProjectMenu = ({ onClose, onEdit, onClone, onDelete }: ProjectMenuProps) => {
  const items = [
    { label: "Edit", icon: Pencil, action: onEdit },
    { label: "Clone Project", icon: Copy, action: onClone },
    { label: "Delete Project", icon: Trash2, className: "text-red-300", action: onDelete },
  ];

  return (
    <div
      className="absolute right-4 top-4  z-20 w-40 rounded-xl border border-border bg-panel text-sm text-foreground shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={clsx("flex w-full rounded-xl items-center gap-2 px-4 py-2 text-left hover:bg-accent", item.className)}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ProjectMenu;
