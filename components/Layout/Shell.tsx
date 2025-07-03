import Sidebar from "./Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar /> {/* Mobile: Hidden by default, Desktop: Normal sidebar */}
      
      {/* Main content area - Account for mobile menu button and input bar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Add top padding on mobile for the menu button */}
        <main className="flex-1 overflow-hidden pt-0 md:pt-0">
          <div className="h-full w-full">
            {children} {/* ChatPanel renders here with full control */}
          </div>
        </main>
      </div>
    </div>
  );
}
