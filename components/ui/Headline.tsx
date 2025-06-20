import React from "react";

export const Headline = ({ children }: { children: React.ReactNode }) => (
  <h1 className="animate-fadeMove text-3xl lg:text-5xl font-semibold -tracking-[0.02em] text-center">
    {children}
  </h1>
);
