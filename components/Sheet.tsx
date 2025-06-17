import React, { useState, useEffect } from "react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
}

export default function Sheet({
  isOpen,
  onClose,
  children,
  side = "left",
}: SheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
        fixed top-0 ${side === "left" ? "left-0" : "right-0"} h-full w-80 
        bg-surface/95 backdrop-blur-xl border-r border-border/50 
        shadow-xl z-50 transform transition-transform duration-300 ease-out
        lg:hidden
        ${isOpen ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"}
      `}
      >
        {children}
      </div>
    </>
  );
}
