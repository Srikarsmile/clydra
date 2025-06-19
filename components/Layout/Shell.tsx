import { useClerk, useUser } from "@clerk/nextjs"; // @signout
import { LogOut, User } from "lucide-react"; // @signout
import Image from "next/image"; // @signout
import Sidebar from "./Sidebar"; // @signout
import { useState } from "react"; // @signout

export function Shell({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk(); // @signout
  const { user } = useUser(); // @signout
  const [activeTab, setActiveTab] = useState("chat"); // @signout

  return (
    <div className="min-h-screen flex">
      {/* @ui-polish - TOP BAR styling update */}
      <header className="fixed inset-x-0 top-0 h-12
                         flex items-center justify-between
                         px-6 lg:px-16
                         bg-surface shadow-sm/5 z-40">
        <span className="font-semibold text-lg">Clydra</span>

        <div className="flex items-center gap-3"> {/* @signout */}
          {/* Account Profile @signout */}
          {user && (
            <div className="flex items-center gap-2">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <User size={16} className="text-brand-600" />
                </div>
              )}
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {user.fullName || user.firstName || "User"}
              </span>
            </div>
          )}

          {/* @ui-polish - Logout Button styling update */}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR @signout */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* MAIN AREA @signout */}
      <main className="flex-1 mt-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 