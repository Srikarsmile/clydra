// @ux-fix - Thread search component with enhanced focus behavior
import { useRef } from "react";

interface ThreadSearchProps {
  placeholder?: string;
  className?: string;
}

export default function ThreadSearch({
  placeholder = "Search conversations…",
  className = "w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 focus:outline-none placeholder-gray-500 transition-colors",
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
