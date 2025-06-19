// @threads - Thread list sidebar component
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

interface ThreadListProps {
  activeThread?: string | null;
}

export default function ThreadList({ activeThread }: ThreadListProps) {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch('/api/threads');
        if (response.ok) {
          const data = await response.json();
          setThreads(data);
        }
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, []);

  // Create new thread
  const createThread = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const { id } = await response.json();
        router.push(`/dashboard?thread=${id}`);
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <aside className="w-64 px-2 py-4 space-y-2">
        <div className="w-full h-10 bg-gray-200 animate-pulse rounded"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 px-2 py-4 space-y-2 border-r border-border/30">
      <Button 
        onClick={createThread} 
        disabled={isCreating}
        className="w-full"
        variant="default"
      >
        {isCreating ? 'Creating...' : '＋ New Chat'}
      </Button>
      
      <input
        placeholder="Search your threads…"
        className="mt-3 w-full rounded-md bg-muted px-2 py-1 text-sm border border-border/30"
      />
      
      <ul className="space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
        {threads?.map(thread => (
          <li key={thread.id}>
            <Link 
              href={`/dashboard?thread=${thread.id}`}
              className={cn(
                "block truncate rounded-md px-2 py-1 text-sm transition-colors hover:bg-gray-100",
                thread.id === activeThread && "bg-brand/10 text-brand font-medium"
              )}
            >
              {thread.title}
            </Link>
          </li>
        ))}
        {threads?.length === 0 && (
          <li className="text-sm text-gray-500 px-2 py-1">
            No conversations yet
          </li>
        )}
      </ul>
    </aside>
  );
} 