// @threads - Thread list sidebar component
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Trash2 } from "lucide-react"; // @ux-refresh - Add delete icon
import { cn } from "../../lib/utils";

interface Thread {
  id: string;
  title: string;
  created_at: string;
  msg_count?: number; // @ui-polish - Add message count
}

interface ThreadListProps {
  activeThread?: string | null;
}

export default function ThreadList({ activeThread }: ThreadListProps) {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null); // @ux-refresh - Track deleting state

  // Fetch threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch("/api/threads");
        if (response.ok) {
          const data = await response.json();
          setThreads(data);
        }
      } catch (error) {
        console.error("Failed to fetch threads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, []);

  // @ux-refresh - Delete thread functionality
  const deleteThread = async (threadId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigation when clicking delete
    event.stopPropagation();

    if (deletingId === threadId) return;

    if (
      !confirm(
        "Are you sure you want to delete this chat? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(threadId);
    try {
      const response = await fetch("/api/threads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });

      if (response.ok) {
        // Remove thread from local state
        setThreads((prev) => prev.filter((t) => t.id !== threadId));

        // Redirect if deleting active thread
        if (activeThread === threadId) {
          router.push("/dashboard");
        }
      } else {
        throw new Error("Failed to delete thread");
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
      alert("Failed to delete chat. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };
  // @ux-refresh - End delete thread functionality

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="w-full h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-100 animate-pulse rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
        {threads?.map((thread) => (
          <li key={thread.id}>
            {/* @ui-polish - Enhanced thread item with message count and delete functionality */}
            <div
              className={cn(
                "group flex items-center justify-between rounded-md transition-colors hover:bg-gray-100",
                thread.id === activeThread && "bg-brand/10"
              )}
            >
              <Link
                href={`/dashboard?thread=${thread.id}`}
                className={cn(
                  "flex items-center justify-between flex-1 px-2 py-1 text-sm transition-colors",
                  thread.id === activeThread
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "hover:bg-brand-50/50"
                )}
              >
                <span className="truncate">{thread.title}</span>
                {thread.msg_count && thread.msg_count > 0 && (
                  <span className="ml-2 text-[10px] rounded bg-gray-200 px-1">
                    {thread.msg_count}
                  </span>
                )}
              </Link>

              <button
                onClick={(e) => deleteThread(thread.id, e)}
                disabled={deletingId === thread.id}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-1 mr-1 rounded transition-all",
                  "hover:bg-red-100 hover:text-red-600 text-gray-400",
                  deletingId === thread.id && "opacity-100 cursor-not-allowed"
                )}
                title="Delete chat"
              >
                {deletingId === thread.id ? (
                  <div className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
            </div>
            {/* @ui-polish - End enhanced thread item */}
          </li>
        ))}
        {threads?.length === 0 && (
          <li className="text-sm text-gray-500 px-2 py-1">
            No conversations yet
          </li>
        )}
      </ul>
    </div>
  );
}
