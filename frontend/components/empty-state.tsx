import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
        <Icon className="h-7 w-7 text-white/30" />
      </div>
      <p className="text-sm font-medium text-white/60">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-white/40">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-purple-600/30 px-4 py-2 text-xs font-medium text-purple-300 transition-all hover:bg-purple-600/40"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
