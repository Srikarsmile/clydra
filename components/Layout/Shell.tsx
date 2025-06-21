import Sidebar from "./Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar />
      {/* main scroll container */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="w-full h-full px-4 lg:px-6">
            {children}  {/* ChatPanel renders here */}
          </div>
        </main>
      </div>
    </div>
  );
}
