import Sidebar from "./Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar /> {/* real navigation only */}
      {/* main content area - removed extra padding for proper alignment */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-hidden">
          {children} {/* ChatPanel renders here with full control */}
        </main>
      </div>
    </div>
  );
}
