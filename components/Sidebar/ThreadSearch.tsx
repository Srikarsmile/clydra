// @ux-fix - Thread search component with enhanced focus behavior
import { useRef } from "react";

interface ThreadSearchProps {
  placeholder?: string;
  className?: string;
}

export default function ThreadSearch({
  placeholder = "Search your threads…",
  className = "w-full rounded-md bg-muted px-2 py-1 text-sm focus:ring-2 focus:ring-brand-200 focus:outline-none",
}: ThreadSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null); // @ux-fix

  return (
    <input
      ref={inputRef} // @ux-fix
      type="text"
      placeholder={placeholder}
      className={className} // @layout-fix
      onMouseDown={(e) => {
        // @ux-fix
        // ensure single click focuses even if parent has focus-steal
        if (document.activeElement !== inputRef.current) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }}
    />
  );
}
