/**
 * @dashboard-redesign
 * Redesigned Chat Panel Component with fluid scrolling and smooth animations
 */

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from "react";
import { flushSync } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { ChatModel, MODEL_ALIASES } from "@/types/chatModels";
import UpgradeCTA from "../UpgradeCTA";
import ChatMessage from "./ChatMessage";
import InputBar from "./InputBar"; // @dashboard-redesign
import MultiModelResponse from "./MultiModelResponse"; // @multi-model
import { Menu } from "lucide-react";
import { useRouter } from "next/router"; // @persistence-fix - Add router for URL updates
import { toast } from "@/lib/toast";
import { FixedSizeList as List } from "react-window";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
  model?: ChatModel;
  annotations?: Array<{
    type: "url_citation";
    url_citation: {
      url: string;
      title: string;
      content?: string;
      start_index: number;
      end_index: number;
    };
  }>; // @web-search - Add web search citations
  webSearchUsed?: boolean; // @web-search - Indicate if web search was used
}

interface ChatPanelProps {
  threadId?: string;
  onTokensUpdated?: () => void; // Callback to refresh token gauge after chat responses
  onThreadCreated?: () => void; // Callback to refresh thread list after new thread creation
}

export default function ChatPanel({
  threadId,
  onTokensUpdated,
  onThreadCreated,
}: ChatPanelProps) {
  const { user } = useUser();
  const router = useRouter(); // @persistence-fix - Add router for URL updates
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ChatModel>(
    "google/gemini-2.5-flash-preview"
  ); // Updated to use Google Flash model
  const [enableWebSearch, setEnableWebSearch] = useState(false); // @web-search - Enable web search state management
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  // @fix-flickering - Removed streamingMessage state as we now update messages array directly
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    threadId
  ); // @persistence-fix - Track current thread

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const previousMessagesLength = useRef(0);

  // @ux-improvement - Add keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+N or Cmd+N for new chat
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        if (!isStreaming) {
          // Clear current messages and create new thread
          setMessages([]);
          setCurrentThreadId(undefined);
          setInput('');
          
          // Reset model to default for new chats
          setModel("google/gemini-2.5-flash-preview");
          console.log('🔄 Model reset to default for new chat');
          
          // Update URL to remove thread parameter
          router.replace('/dashboard');
          
          // Notify parent component to refresh thread list
          if (onThreadCreated) {
            console.log('🔄 Notifying parent to refresh thread list');
            onThreadCreated();
          }
          
          console.log('🎯 New chat started via keyboard shortcut');
        }
      }
      
      // Escape key to cancel streaming
      if (event.key === 'Escape' && isStreaming) {
        event.preventDefault();
        setIsStreaming(false);
        console.log('🛑 Streaming cancelled via keyboard shortcut');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, router, onThreadCreated]);

  // @ux-improvement - Enhanced new chat function with better UX
  const startNewChat = useCallback(async () => {
    if (isStreaming) {
      console.log('⏸️ Cannot start new chat while streaming');
      return;
    }
    
    console.log('🎯 Starting new chat...');
    
    // Clear current messages and state immediately for instant feedback
    setMessages([]);
    setCurrentThreadId(undefined);
    setInput('');
    
    // @fix-new-chat-button - Reset model to default for new chats
    setModel("google/gemini-2.5-flash-preview");
    console.log('🔄 Model reset to default for new chat');
    
    // Clear localStorage for current thread
    localStorage.removeItem("clydra-current-thread");
    
    // Always create new thread for consistent behavior
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { id } = await response.json();
        console.log("✅ New thread created from pen button:", id);

        // Update URL to include the new thread ID
        router.replace(`/dashboard?thread=${id}`, undefined, { shallow: true });
        
        // Update current thread ID state
        setCurrentThreadId(id);

        // Notify parent component to refresh thread list
        if (onThreadCreated) {
          console.log('🔄 Notifying parent to refresh thread list');
          onThreadCreated();
        }
        
        console.log('✅ New chat started successfully with thread:', id);
      } else {
        console.error("❌ Failed to create new thread:", response.status);
        // Fallback: still navigate to dashboard for clean state
        router.replace('/dashboard', undefined, { shallow: true });
        
        // Still notify parent to refresh
        if (onThreadCreated) {
          onThreadCreated();
        }
      }
    } catch (error) {
      console.error("❌ Error creating new thread:", error);
      // Fallback: still navigate to dashboard for clean state
      router.replace('/dashboard', undefined, { shallow: true });
      
      // Still notify parent to refresh
      if (onThreadCreated) {
        onThreadCreated();
      }
    }
  }, [isStreaming, router, onThreadCreated]);

  // @persistence-fix - Periodic backup recovery check
  useEffect(() => {
    const checkForUnsavedMessages = () => {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('clydra-unsaved-'));
      keys.forEach(async (key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.threadId && data.messages) {
            console.log(`🔄 Attempting to recover unsaved messages for thread ${data.threadId}`);
            
            // Try to save each unsaved message
            let allSaved = true;
            for (const msg of data.messages) {
              try {
                const method = msg.messageId ? "PUT" : "POST";
                const body = msg.messageId 
                  ? { messageId: msg.messageId, content: msg.content }
                  : { role: msg.role, content: msg.content };
                
                const response = await fetch(`/api/messages/${data.threadId}`, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });
                
                if (!response.ok) {
                  allSaved = false;
                  break;
                }
              } catch (error) {
                allSaved = false;
                break;
              }
            }
            
            if (allSaved) {
              localStorage.removeItem(key);
              console.log(`✅ Successfully recovered unsaved messages for thread ${data.threadId}`);
              toast.success("Recovered unsaved messages");
            }
          }
        } catch (error) {
          console.warn("Failed to process backup:", error);
          localStorage.removeItem(key);
        }
      });
    };

    // Check immediately and then every 30 seconds
    checkForUnsavedMessages();
    const interval = setInterval(checkForUnsavedMessages, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // @dashboard-redesign - Load messages when threadId changes
  useEffect(() => {
    if (!threadId || !user) {
      console.log(
        "🔄 Skipping message load: threadId =",
        threadId,
        "user =",
        !!user
      );
      return;
    }

    console.log("📥 Loading messages for thread:", threadId);

    const loadMessages = async (retryCount = 0) => {
      try {
        const response = await fetch(`/api/messages/${threadId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Messages loaded:", data.length);

          const formattedMessages: Message[] = data.map(
            (msg: {
              role: string;
              content: string;
              id?: number;
              model?: string;
            }) => ({
              role: msg.role,
              content: msg.content,
              id: msg.id?.toString(),
              model: msg.model || undefined, // Include model info when available
            })
          );
          setMessages(formattedMessages);

          // @fix-model-persistence - Restore model state from the most recent assistant message
          const lastAssistantMessage = formattedMessages
            .filter(msg => msg.role === "assistant" && msg.model)
            .pop();
          
          if (lastAssistantMessage?.model) {
            console.log("🔄 Restoring model state from last message:", lastAssistantMessage.model);
            setModel(lastAssistantMessage.model);
          } else {
            console.log("🔄 No model found in messages, keeping current model");
          }

          // @persistence-fix - Save messages to localStorage as backup
          localStorage.setItem(
            `clydra-messages-${threadId}`,
            JSON.stringify(formattedMessages)
          );
          
          // @persistence-fix - Check for and recover any unsaved messages
          const backupKey = `clydra-unsaved-${threadId}`;
          const unsavedData = localStorage.getItem(backupKey);
          if (unsavedData) {
            try {
              const backupData = JSON.parse(unsavedData);
              console.log("🔄 Found unsaved messages, attempting to recover...");
              
              // Try to save the unsaved messages
              for (const msg of backupData.messages) {
                try {
                  const response = await fetch(`/api/messages/${threadId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      role: msg.role,
                      content: msg.content,
                    }),
                  });
                  
                  if (response.ok) {
                    console.log("✅ Recovered unsaved message");
                  }
                } catch (error) {
                  console.warn("Failed to recover message:", error);
                }
              }
              
              // Clear the backup after recovery attempt
              localStorage.removeItem(backupKey);
              
              // Reload messages to include recovered ones
              if (backupData.messages.length > 0) {
                setTimeout(() => loadMessages(), 1000);
              }
            } catch (error) {
              console.warn("Failed to parse backup data:", error);
              localStorage.removeItem(backupKey);
            }
          }
        } else if (response.status === 404) {
          // Thread not found, clear messages but don't error
          console.warn("⚠️ Thread not found, clearing messages");
          setMessages([]);
        } else {
          const errorText = await response.text();
          console.error(
            "❌ Failed to load messages:",
            response.status,
            response.statusText,
            errorText
          );

          // @persistence-fix - Retry on server errors (5xx) or rate limits (429)
          if (
            (response.status >= 500 || response.status === 429) &&
            retryCount < 3
          ) {
            console.log(
              `🔄 Retrying message load (attempt ${retryCount + 1}/3)...`
            );
            setTimeout(
              () => loadMessages(retryCount + 1),
              1000 * (retryCount + 1)
            );
            return;
          }

          // @persistence-fix - Try to restore from localStorage on error
          const backupMessages = localStorage.getItem(
            `clydra-messages-${threadId}`
          );
          if (backupMessages) {
            try {
              const parsedMessages = JSON.parse(backupMessages);
              console.log(
                "🔄 Restored messages from localStorage backup:",
                parsedMessages.length
              );
              setMessages(parsedMessages);
            } catch (error) {
              console.warn("Failed to parse backup messages:", error);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to load messages:", error);

        // @persistence-fix - Retry on network errors
        if (retryCount < 3) {
          console.log(
            `🔄 Retrying message load after network error (attempt ${retryCount + 1}/3)...`
          );
          setTimeout(
            () => loadMessages(retryCount + 1),
            1000 * (retryCount + 1)
          );
          return;
        }

        // @persistence-fix - Try to restore from localStorage on network error
        const backupMessages = localStorage.getItem(
          `clydra-messages-${threadId}`
        );
        if (backupMessages) {
          try {
            const parsedMessages = JSON.parse(backupMessages);
            console.log(
              "🔄 Restored messages from localStorage backup:",
              parsedMessages.length
            );
            setMessages(parsedMessages);
          } catch (error) {
            console.warn("Failed to parse backup messages:", error);
          }
        }
      }
    };

    loadMessages();
  }, [threadId, user]); // Fixed: Only depend on threadId and user, not model

  // @persistence-fix - Clear messages when threadId becomes undefined (new chat)
  useEffect(() => {
    if (!threadId && currentThreadId) {
      console.log("🔄 Clearing messages for new chat");
      setMessages([]);
    }
  }, [threadId, currentThreadId]);

  // @persistence-fix - Sync current thread ID with prop changes and localStorage
  useEffect(() => {
    setCurrentThreadId(threadId);

    // Store thread ID in localStorage for recovery
    if (threadId) {
      localStorage.setItem("clydra-current-thread", threadId);
    } else {
      // Clear localStorage when no thread is active
      localStorage.removeItem("clydra-current-thread");
    }
  }, [threadId]);

  // @persistence-fix - Restore thread ID from localStorage on mount if no threadId prop
  useEffect(() => {
    if (!threadId && !currentThreadId) {
      const savedThreadId = localStorage.getItem("clydra-current-thread");
      if (savedThreadId) {
        console.log("🔄 Restoring thread ID from localStorage:", savedThreadId);
        router.replace(`/dashboard?thread=${savedThreadId}`);
      }
    }
  }, [threadId, currentThreadId, router]);

  // @persistence-fix - Create new thread when starting a fresh chat
  const createNewThread = useCallback(async (): Promise<string | null> => {
    try {
      console.log("🔧 Creating new thread with proper authentication...");
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies/auth are sent
      });

      if (response.ok) {
        const data = await response.json();
        const newThreadId = data.id;
        setCurrentThreadId(newThreadId);

        // Update URL to include the new thread ID so messages persist after refresh
        // Use replace instead of push to avoid page refresh and maintain user input
        router.replace(`/dashboard?thread=${newThreadId}`);

        // Notify parent component to refresh thread list
        if (onThreadCreated) {
          console.log("🔄 Notifying parent to refresh thread list");
          onThreadCreated();
        }

        return newThreadId;
      } else {
        console.error("Failed to create new thread:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error creating new thread:", error);
      return null;
    }
  }, [onThreadCreated, router]);

  // @fluid-scroll - Enhanced smooth scroll with proper timing and user intent detection
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    // Only auto-scroll if user is near bottom or if forced (new message)
    if (force || isNearBottom) {
      setIsAutoScrolling(true);

      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });

        // Reset auto-scroll flag after animation
        setTimeout(() => setIsAutoScrolling(false), 300);
      });
    }
  }, []);

  // @fluid-scroll - Smart auto-scroll logic
  useEffect(() => {
    const currentLength = messages.length;

    if (currentLength > previousMessagesLength.current) {
      // New message added, scroll to bottom
      scrollToBottom(true);
      // Auto-scroll react-window List if available
      if (listRef.current) {
        listRef.current.scrollToItem(messages.length - 1, 'end');
      }
    }

    previousMessagesLength.current = currentLength;
  }, [messages, scrollToBottom]);

  // @fluid-scroll - Intersection Observer for detecting scroll position
  useEffect(() => {
    if (!messagesEndRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isAutoScrolling) {
            // User manually scrolled to bottom
            setIsAutoScrolling(false);
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(messagesEndRef.current);

    return () => observer.disconnect();
  }, [isAutoScrolling]);

  // @performance - Simplified and robust streaming implementation
  const handleSubmit = useCallback(() => {
    if (isStreaming || !user || !input.trim()) return;

    const userMessageContent = input.trim();
    
    // Clear input immediately for better UX
    setInput("");

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: userMessageContent,
      id: `user-${Date.now()}`,
    };

    startTransition(() => {
      setMessages((prev) => [...prev, userMessage]);
    });
    scrollToBottom();

    // Process chat response
    const processChat = async () => {
      const assistantMessageId = `assistant-${Date.now()}`;
      let currentAssistantId = assistantMessageId;

      try {
        setIsStreaming(true);
        // @fix-flickering - Don't clear streamingMessage here, let it persist until final message is ready
        
        // @persistence-fix - Create new thread if this is a fresh chat
        let threadIdToUse = currentThreadId;
        if (!threadIdToUse) {
          console.log("🆕 Creating new thread for fresh chat...");
          
          // Try multiple times to create thread
          let newThreadId = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              newThreadId = await createNewThread();
              if (newThreadId) {
                console.log(`✅ New thread created on attempt ${attempt + 1}: ${newThreadId}`);
                break;
              }
            } catch (error) {
              console.warn(`Thread creation attempt ${attempt + 1} failed:`, error);
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          if (!newThreadId) {
            throw new Error("Failed to create new thread after 3 attempts");
          }
          threadIdToUse = newThreadId;
          
          // Update URL immediately with new thread
          router.push(`/?thread=${threadIdToUse}`, undefined, { shallow: true });
          setCurrentThreadId(threadIdToUse);
          if (onThreadCreated) onThreadCreated();
        }

        // @persistence-fix - Verify thread exists before saving messages
        console.log(`🔍 Verifying thread ${threadIdToUse} exists...`);
        try {
          const verifyResponse = await fetch(`/api/messages/${threadIdToUse}`);
          if (!verifyResponse.ok && verifyResponse.status === 404) {
            console.warn("⚠️ Thread not found, creating new one...");
            const newThreadId = await createNewThread();
            if (newThreadId) {
              threadIdToUse = newThreadId;
              router.push(`/?thread=${threadIdToUse}`, undefined, { shallow: true });
              setCurrentThreadId(threadIdToUse);
            }
          }
        } catch (error) {
          console.warn("Thread verification failed:", error);
        }
        
        // @persistence-fix - Save user message immediately to prevent loss on refresh
        console.log("💾 Saving user message immediately...");
        let userMessageSaved = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const userSaveResponse = await fetch(
              `/api/messages/${threadIdToUse}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role: "user",
                  content: userMessageContent,
                }),
              }
            );

            if (userSaveResponse.ok) {
              console.log("✅ User message saved immediately");
              userMessageSaved = true;
              break;
            } else {
              console.warn(
                `Attempt ${attempt + 1}: Failed to save user message:`,
                userSaveResponse.status
              );
            }
          } catch (error) {
            console.warn(
              `Attempt ${attempt + 1}: Error saving user message:`,
              error
            );
          }

          // Wait before retrying
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!userMessageSaved) {
          console.warn("Failed to save user message after 3 attempts - saving to localStorage backup");
          // Save to localStorage as backup
          const backupKey = `clydra-unsaved-${threadIdToUse || 'new'}`;
          const backupData = {
            messages: [{ role: "user", content: userMessageContent, timestamp: Date.now() }],
            threadId: threadIdToUse,
          };
          localStorage.setItem(backupKey, JSON.stringify(backupData));
          toast.error("Message saving failed - will retry automatically");
        } else {
          // Clear any existing backup for this thread
          const backupKey = `clydra-unsaved-${threadIdToUse}`;
          localStorage.removeItem(backupKey);
        }

        // @persistence-fix - Save empty assistant message immediately to prevent loss on refresh
        let assistantMessageDbId: string | null = null;
        try {
          const assistantSaveResponse = await fetch(
            `/api/messages/${threadIdToUse}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: "assistant",
                content: "", // Start with empty content, will be updated during streaming
              }),
            }
          );

          if (assistantSaveResponse.ok) {
            const savedAssistantMessage = await assistantSaveResponse.json();
            assistantMessageDbId = savedAssistantMessage.id.toString();
            console.log(
              "✅ Assistant message placeholder saved with ID:",
              assistantMessageDbId
            );
          } else {
            console.warn("Failed to save assistant message placeholder");
          }
        } catch (error) {
          console.warn("Error saving assistant message placeholder:", error);
        }

        // @fix-flickering - Add assistant message placeholder immediately with proper ID
        const assistantMessage: Message = {
          role: "assistant",
          content: "", // Start with empty content
          id: assistantMessageDbId || assistantMessageId,
          model,
        };
        currentAssistantId = assistantMessage.id || assistantMessageId;

        console.log("Creating assistant message with model:", {
          model,
          modelType: typeof model,
          assistantMessageId: assistantMessage.id,
          modelAlias: model ? MODEL_ALIASES[model] : "undefined",
        });

        // @fix-flickering - Add the assistant message to the messages array immediately
        startTransition(() => {
          setMessages((prev) => [...prev, assistantMessage]);
        });

        const response = await fetch("/api/chat/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model,
            threadId: threadIdToUse, // @persistence-fix - Use the current or newly created thread ID
            stream: true,
            enableWebSearch,
          }),
        });

        if (!response.ok) {
          // Remove placeholder message first
          startTransition(() => {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== currentAssistantId)
            );
          });

          // Get detailed error information
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage += `: ${errorData.error}`;
            }
          } catch {
            // If we can't parse JSON, use the status text
            errorMessage += `: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let lastUpdateTime = 0;

        // Add timeout to prevent infinite hanging
        const streamTimeout = setTimeout(() => {
          console.warn("Stream timeout - canceling reader");
          reader.cancel();
          setIsStreaming(false);
        }, 60000); // 60 second timeout

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              clearTimeout(streamTimeout);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;

                    // @fix-flickering - Update the assistant message in the messages array directly
                    // This eliminates the need for separate streamingMessage state
                    startTransition(() => {
                      setMessages((prev) => {
                        const updatedMessages = prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, content: fullContent }
                            : msg
                        );
                        return updatedMessages;
                      });
                    });

                    // @persistence-fix - Update database content periodically during streaming
                    const now = Date.now();
                    if (assistantMessageDbId && now - lastUpdateTime > 2000) {
                      // Update every 2 seconds
                      lastUpdateTime = now;
                      // Update in background without blocking the stream
                      fetch(`/api/messages/${threadIdToUse}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          messageId: assistantMessageDbId,
                          content: fullContent,
                        }),
                      }).catch((error) => {
                        console.warn(
                          "Failed to update message content during streaming:",
                          error
                        );
                      });
                    }

                    // Auto-scroll
                    requestAnimationFrame(() => scrollToBottom());
                  } else if (parsed.messageId) {
                    // Update the message with the database ID (if we didn't already have one)
                    if (!assistantMessageDbId) {
                      console.log(
                        `🔄 Updating message ID from ${assistantMessage.id} to ${parsed.messageId}`
                      );
                      startTransition(() => {
                        setMessages((prev) => {
                          const updatedMessages = prev.map((msg) =>
                            msg.id === assistantMessage.id
                              ? { ...msg, id: parsed.messageId.toString() }
                              : msg
                          );
                          return updatedMessages;
                        });
                      });
                    }
                    console.log(
                      `✅ Message saved to database with ID: ${parsed.messageId}`
                    );
                  } else {
                    console.log("📦 Received data:", parsed);
                  }
                } catch {
                  // Skip invalid JSON
                  continue;
                }
              }
            }
          }

          clearTimeout(streamTimeout); // Clear timeout on successful completion

          // @persistence-fix - Final update to database with complete content
          let finalMessageSaved = false;
          if (assistantMessageDbId && fullContent) {
            // Try multiple times to save final message
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                const response = await fetch(`/api/messages/${threadIdToUse}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    messageId: assistantMessageDbId,
                    content: fullContent,
                  }),
                });
                
                if (response.ok) {
                  console.log("✅ Final message content saved to database");
                  finalMessageSaved = true;
                  break;
                } else {
                  console.warn(`Attempt ${attempt + 1}: Failed to save final message:`, response.status);
                }
              } catch (error) {
                console.warn(`Attempt ${attempt + 1}: Error saving final message:`, error);
              }
              
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            if (!finalMessageSaved) {
              console.warn("Failed to save final message - creating backup");
              const backupKey = `clydra-unsaved-${threadIdToUse}`;
              const assistantBackup = {
                messages: [{ 
                  role: "assistant", 
                  content: fullContent, 
                  messageId: assistantMessageDbId, 
                  timestamp: Date.now() 
                }],
                threadId: threadIdToUse,
              };
              localStorage.setItem(backupKey, JSON.stringify(assistantBackup));
              toast.error("Response saving failed - will retry automatically");
            }
              
            try {
              // Use flushSync to ensure final token renders
              flushSync(() => {
                setMessages((prev) => {
                  const updatedMessages = prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: fullContent }
                      : msg
                  );
                  return updatedMessages;
                });
              });
            } catch (error) {
              console.warn("Failed to save final message content:", error);
            }
          }
        } finally {
          clearTimeout(streamTimeout); // Ensure timeout is cleared
          reader.releaseLock();
        }
      } catch (error) {
        console.error("Chat error:", error);

        // Ensure streaming is stopped immediately on any error
        setIsStreaming(false);

        // Remove the assistant placeholder message on error
        startTransition(() => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== currentAssistantId)
          );
        });

        // Show appropriate error message
        if (error instanceof Error) {
          if (
            error.message.includes("Daily message limit exceeded") ||
            error.message.includes("429")
          ) {
            setShowUpgrade(true);
          } else {
            toast.error('Unable to reach AI service. Please try again.');
          }
        } else {
          toast.error('Unable to reach AI service. Please try again.');
        }
      } finally {
        // Always ensure streaming is stopped
        setIsStreaming(false);
      }
    };

    processChat();
  }, [
    isStreaming,
    user,
    input,
    messages,
    model,
    enableWebSearch,
    scrollToBottom,
    currentThreadId,
    createNewThread,
  ]);

  // @performance - Refresh token gauge when messages change (throttled approach)
  useEffect(() => {
    // Only refresh if the last message is from assistant (indicating completion)
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage?.role === "assistant" &&
      lastMessage.id &&
      onTokensUpdated
    ) {
      console.log(
        "🔄 ChatPanel: Triggering token gauge refresh for completed message",
        lastMessage.id
      );
      onTokensUpdated();
    }

    // @persistence-fix - Save messages to localStorage whenever they change
    if (messages.length > 0 && currentThreadId) {
      localStorage.setItem(
        `clydra-messages-${currentThreadId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, onTokensUpdated, currentThreadId]); // Only trigger when the last message ID changes

  // @auto-thread - Create thread when user focuses on input (proactive thread creation)
  const handleInputFocus = useCallback(async () => {
    // Only create a thread if we don't have one already and user is signed in
    if (!currentThreadId && user && !isStreaming) {
      console.log("🎯 Input focused - creating thread proactively...");
      const newThreadId = await createNewThread();
      if (newThreadId) {
        console.log(`✅ Proactive thread created: ${newThreadId}`);
      }
    }
  }, [currentThreadId, user, isStreaming, createNewThread]);

  // @dashboard-redesign - Switch model and continue conversation
  const handleModelChange = useCallback(
    (newModel: ChatModel) => {
      if (newModel !== model) {
        // Simply switch to the new model and continue the conversation
        setModel(newModel);
      }
    },
    [model]
  );

  // @dashboard-redesign - Suggestions for empty state
  const suggestions = useMemo(
    () => [
      {
        icon: "✨",
        title: "Creative Writing",
        description: "Help me write a story or poem",
      },
      {
        icon: "🧠",
        title: "Problem Solving",
        description: "Analyze and solve complex problems",
      },
      {
        icon: "💻",
        title: "Code Review",
        description: "Review and improve my code",
      },
      {
        icon: "📊",
        title: "Data Analysis",
        description: "Help analyze data and insights",
      },
    ],
    []
  );

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to use chat</p>
        </div>
      </div>
    );
  }

  if (showUpgrade) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <UpgradeCTA />
          <Button
            variant="outline"
            onClick={() => setShowUpgrade(false)}
            className="w-full mt-4"
          >
            Continue with Free Plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* @dashboard-redesign - Chat container with mobile-optimized padding and safe areas */}
      <div className="flex-1 flex flex-col w-full px-3 sm:px-6 pb-28 sm:pb-32 min-h-0">
        {/* @dashboard-redesign - Mobile-optimized header with integrated hamburger menu */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-gray-100 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button integrated into header */}
            <button
              onClick={() => {
                // Toggle mobile sidebar - we'll need to pass this as a prop or use context
                const event = new CustomEvent("toggleMobileSidebar");
                window.dispatchEvent(event);
              }}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              Clydra
            </span>
          </div>
          {/* @dashboard-redesign - Mobile-responsive model badge with new chat button */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gray-100 border border-gray-200 text-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
              <span className="hidden xs:inline">{MODEL_ALIASES[model]}</span>
              <span className="xs:hidden">
                {MODEL_ALIASES[model].split(" ")[0]}
              </span>
            </span>
            
            {/* @ux-improvement - New chat pen icon button */}
            <button
              onClick={startNewChat}
              disabled={isStreaming}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              title="New Chat (Ctrl+N)"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
            </button>
            
            {/* @ux-improvement - Keyboard shortcut hint */}
            <span className="hidden lg:inline text-xs text-gray-500">
              Ctrl+N for new chat
            </span>
          </div>
        </div>

        {/* @fluid-scroll - Fixed scrolling container to prevent double scroll */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 chat-scroll scroll-smooth"
        >
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 pb-6 sm:pb-8">
            {messages.length === 0 ? (
              // @dashboard-redesign - Mobile-optimized empty state
              <div className="flex flex-col items-center space-y-4 sm:space-y-6 py-8 sm:py-16 animate-fade-in-up px-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-center leading-tight">
                  Hello{" "}
                  <span className="text-gray-900">{user?.firstName}!</span>
                </h1>
                <p className="text-lg sm:text-xl text-text-muted text-center max-w-md">
                  How can I assist you today?
                </p>

                {/* @dashboard-redesign - Mobile-responsive suggestion cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl w-full mt-6 sm:mt-8 animate-stagger">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion.description)}
                      className="group p-3 sm:p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1 active:scale-95"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="text-lg sm:text-xl transition-transform duration-300 group-hover:scale-110">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium text-text-main text-sm sm:text-base">
                          {suggestion.title}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-text-muted">
                        {suggestion.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* @fluid-scroll - Mobile-optimized message list with better retry button positioning */}
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up mb-6 sm:mb-8`}
                    style={{
                      animationDelay: `${Math.min(index * 50, 500)}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div
                      className={`w-full max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-2xl 2xl:max-w-4xl ${
                        message.role === "assistant"
                          ? "bg-white text-gray-900 shadow-md"
                          : "bg-gray-100 text-gray-900 shadow-sm"
                      } rounded-2xl px-3 sm:px-6 py-3 sm:py-4 relative group transition-all duration-300 hover:shadow-lg transform hover:scale-[1.01] sm:hover:scale-[1.02]`}
                    >
                      {/* @multi-model - Use MultiModelResponse for assistant messages, regular ChatMessage for user messages */}
                      {message.role === "assistant" ? (
                        <MultiModelResponse
                          initialContent={message.content}
                          initialModel={message.model || model}
                        />
                      ) : (
                        <ChatMessage
                          content={message.content}
                          role="user"
                          timestamp={new Date()}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* @performance - Mobile-optimized streaming message */}
                {/* Removed streamingMessage display */}

                <div ref={messagesEndRef} className="h-20 sm:h-24" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* @dashboard-redesign - InputBar component with web search support */}
      <InputBar
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onFocus={handleInputFocus} // @auto-thread - Pass focus handler for automatic thread creation
        disabled={isStreaming}
        loading={isStreaming} // Pass loading state for better UX
        placeholder="Type your message..."
        selectedModel={model}
        onModelChange={handleModelChange}
        userPlan="pro"
        enableWebSearch={enableWebSearch} // @web-search - Pass web search state
        onWebSearchChange={setEnableWebSearch} // @web-search - Pass web search handler
      />
    </div>
  );
}
