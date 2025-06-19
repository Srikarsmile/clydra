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
        'px-4 py-1 rounded-full text-sm font-medium',
        active && 'bg-teal-600 text-white shadow-sm',
        locked && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {locked && <Lock className="w-3 h-3 mr-1" />}
      {label}
    </Button>
  );
}
