// @threads - Thread list sidebar component
import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
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

export interface ThreadListRef {
  refreshThreads: () => void;
}

const ThreadList = forwardRef<ThreadListRef, ThreadListProps>(
  function ThreadList({ activeThread }, ref) {
    const router = useRouter();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null); // @ux-refresh - Track deleting state

    // Fetch threads - optimized with useCallback
    const fetchThreads = useCallback(async () => {
      try {
        const response = await fetch("/api/threads");
        if (response.ok) {
          const data = await response.json();
          setThreads(data || []);
          console.log("✅ Threads loaded successfully:", data?.length || 0);
        } else {
          console.error(
            "Failed to fetch threads:",
            response.status,
            response.statusText
          );

          // Handle different error scenarios
          if (response.status === 401) {
            console.error("❌ Authentication issue loading threads");
          } else if (response.status === 404) {
            console.error("❌ User not found when loading threads");
          } else {
            console.error("❌ Server error loading threads");
          }

          // Still set threads to empty array to prevent infinite loading
          setThreads([]);
        }
      } catch (error) {
        console.error("Failed to fetch threads:", error);
        // Set threads to empty array to prevent infinite loading
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

    // Expose refresh method to parent components
    useImperativeHandle(
      ref,
      () => ({
        refreshThreads: fetchThreads,
      }),
      [fetchThreads]
    );

    useEffect(() => {
      fetchThreads();
    }, [fetchThreads]);

    // Optimized navigation handler to prevent same URL navigation
    const handleThreadClick = useCallback(
      (threadId: string, event: React.MouseEvent) => {
        // Don't navigate if this is already the active thread
        if (activeThread === threadId) {
          event.preventDefault();
          return;
        }

        // Let the Link component handle the navigation
      },
      [activeThread]
    );

    // Improved delete thread functionality with better error handling
    const deleteThread = useCallback(
      async (threadId: string, event: React.MouseEvent) => {
        event.preventDefault();
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

          // Handle different response scenarios
          if (response.ok) {
            // Successfully deleted
            setThreads((prev) => prev.filter((t) => t.id !== threadId));

            // Redirect if deleting active thread
            if (activeThread === threadId) {
              router.push("/dashboard");
            }
          } else {
            // Handle different error responses
            let errorMessage = "Failed to delete chat";

            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // If we can't parse JSON, use status text
              errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
            }

            console.error("Delete thread API error:", {
              status: response.status,
              statusText: response.statusText,
              threadId,
            });

            // Show user-friendly error message
            if (response.status === 401) {
              alert("Please sign in again to delete this chat.");
              router.push("/sign-in");
            } else if (response.status === 404) {
              alert("This chat no longer exists or has already been deleted.");
              // Remove from local state since it doesn't exist
              setThreads((prev) => prev.filter((t) => t.id !== threadId));
            } else if (response.status === 403) {
              alert("You don't have permission to delete this chat.");
            } else {
              alert(`Failed to delete chat: ${errorMessage}`);
            }
          }
        } catch (networkError) {
          console.error("Network error deleting thread:", networkError);
          alert("Network error. Please check your connection and try again.");
        } finally {
          setDeletingId(null);
        }
      },
      [deletingId, activeThread, router]
    );

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
                  "group flex items-center justify-between rounded-lg transition-colors hover:bg-gray-50",
                  thread.id === activeThread && "bg-gray-100"
                )}
              >
                {/* Conditional rendering: button for active thread, Link for others */}
                {thread.id === activeThread ? (
                  <div
                    className={cn(
                      "flex items-center justify-between flex-1 px-3 py-2 text-sm cursor-default",
                      "bg-gray-100 text-gray-900 font-medium rounded-lg"
                    )}
                  >
                    <span className="truncate">{thread.title}</span>
                    {thread.msg_count && thread.msg_count > 0 && (
                      <span className="ml-2 text-[10px] rounded bg-gray-200 px-1.5 py-0.5 text-gray-600">
                        {thread.msg_count}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    href={`/dashboard?thread=${thread.id}`}
                    onClick={(e) => handleThreadClick(thread.id, e)}
                    className={cn(
                      "flex items-center justify-between flex-1 px-3 py-2 text-sm transition-colors",
                      "hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg"
                    )}
                  >
                    <span className="truncate">{thread.title}</span>
                    {thread.msg_count && thread.msg_count > 0 && (
                      <span className="ml-2 text-[10px] rounded bg-gray-100 px-1.5 py-0.5 text-gray-500">
                        {thread.msg_count}
                      </span>
                    )}
                  </Link>
                )}

                {/* @ux-refresh - Delete button with loading state */}
                <button
                  onClick={(e) => deleteThread(thread.id, e)}
                  disabled={deletingId === thread.id}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity",
                    "hover:bg-gray-200 text-gray-400 hover:text-gray-600",
                    deletingId === thread.id && "opacity-100 animate-pulse"
                  )}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}

          {/* @threads - Empty state */}
          {threads.length === 0 && (
            <li className="px-3 py-8 text-center text-gray-500 text-sm">
              No conversations yet.
              <br />
              Start a new chat to begin!
            </li>
          )}
        </ul>
      </div>
    );
  }
);

export default ThreadList;
