// components/ui/button.tsx
import React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  asChild?: boolean;
  children?: React.ReactNode;
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
  const variants = {
    primary: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/85",
    outline: "border-border bg-background text-foreground shadow-sm hover:border-primary/60 hover:bg-accent",
    ghost: "border-transparent text-muted hover:bg-accent",
  } as const;
  const sizes = {
    sm: "px-2.5 py-1.5",
    md: "px-3.5 py-2",
  } as const;
  const classes = cn(base, variants[variant], sizes[size], className);

  // asChild인 경우, children이 유효한 React element인지 확인한 뒤 `any` 타입으로 캐스팅해서 cloneElement 사용
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any, any>;
    return React.cloneElement(child, {
      ...child.props,
      className: cn(child.props?.className, classes),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
