/**
 * @clydra-core
 * Convo Core - Model Selection Pill Component
 *
 * Shows available models with active states and lock icons for premium models
 */

import { Lock } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface ModelPillProps {
  label: string;
  active?: boolean;
  locked?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ModelPill({
  label,
  active = false,
  locked = false,
  onClick,
  className,
}: ModelPillProps) {
  return (
    <Button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={cn(
        // @ux-refresh - Updated styling with refined brand colors
        "rounded-full px-4 py-1 text-sm shadow-sm/5 transition",
        active && "bg-brand-500 text-white hover:bg-brand-600",
        !active && !locked && "bg-brand-50 text-brand-600 hover:bg-brand-100",
        locked && "opacity-40 cursor-not-allowed",
        className
        // @ux-refresh - End updated styling
      )}
    >
      {locked && <Lock className="w-3 h-3 mr-1" />}
      {label}
    </Button>
  );
}
