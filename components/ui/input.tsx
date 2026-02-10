// components/ui/input.tsx
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement>;
export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
        className
      )}
      {...props}
    />
  );
}
