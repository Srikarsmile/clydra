// @multi-model - Component for switching between multiple model responses
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { MODEL_ALIASES } from "@/types/chatModels";

interface ModelResponse {
  id: string;
  model: string;
  modelDisplayName: string;
  content: string;
  tokensUsed: number;
  isPrimary: boolean;
  responseNumber: number;
  totalResponses: number;
}

interface MultiModelResponseProps {
  messageId: string;
  initialContent: string;
  onResponseSwitch?: (newContent: string, model: string) => void;
}

export default function MultiModelResponse({
  messageId,
  initialContent,
  onResponseSwitch,
}: MultiModelResponseProps) {
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // Load available responses for this message
  useEffect(() => {
    const loadResponses = async () => {
      try {
        const response = await fetch(`/api/chat/responses/${messageId}`);
        if (response.ok) {
          const data = await response.json();
          setResponses(data.responses || []);
          
          // Find the currently primary response
          const primaryIndex = data.responses.findIndex((r: ModelResponse) => r.isPrimary);
          if (primaryIndex !== -1) {
            setCurrentResponseIndex(primaryIndex);
          }
        }
      } catch (error) {
        console.error("Failed to load responses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResponses();
  }, [messageId]);

  // Switch to a different response
  const switchToResponse = async (responseIndex: number) => {
    if (responseIndex === currentResponseIndex || switching) return;
    
    setSwitching(true);
    try {
      const targetResponse = responses[responseIndex];
      const response = await fetch("/api/chat/switch-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          responseId: targetResponse.id,
        }),
      });

      if (response.ok) {
        setCurrentResponseIndex(responseIndex);
        onResponseSwitch?.(targetResponse.content, targetResponse.model);
      }
    } catch (error) {
      console.error("Failed to switch response:", error);
    } finally {
      setSwitching(false);
    }
  };

  // Navigation handlers
  const goToPrevious = () => {
    const newIndex = currentResponseIndex > 0 ? currentResponseIndex - 1 : responses.length - 1;
    switchToResponse(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentResponseIndex < responses.length - 1 ? currentResponseIndex + 1 : 0;
    switchToResponse(newIndex);
  };

  if (loading) {
    return (
      <div className="bg-white text-gray-900 shadow-md rounded-2xl px-3 sm:px-6 py-3 sm:py-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If only one response or no responses, show the regular message
  if (responses.length <= 1) {
    return (
      <div className="bg-white text-gray-900 shadow-md rounded-2xl px-3 sm:px-6 py-3 sm:py-4">
        <ChatMessage
          content={initialContent}
          role="assistant"
          timestamp={new Date()}
        />
      </div>
    );
  }

  const currentResponse = responses[currentResponseIndex];

  return (
    <div className="bg-white text-gray-900 shadow-md rounded-2xl px-3 sm:px-6 py-3 sm:py-4 relative group">
      {/* Model switcher header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="hidden xs:inline">
            {currentResponse.modelDisplayName}
          </span>
          <span className="xs:hidden">
            {currentResponse.modelDisplayName.split(' ')[0]}
          </span>
        </div>
        
        {/* Response counter and navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            disabled={switching}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Previous response"
          >
            <ChevronLeft className="w-3 h-3 text-gray-500" />
          </button>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 min-w-[3rem] justify-center">
            <span className="font-mono">
              {switching ? "..." : `<${currentResponseIndex + 1}/${responses.length}>`}
            </span>
          </div>
          
          <button
            onClick={goToNext}
            disabled={switching}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Next response"
          >
            <ChevronRight className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Message content */}
      <div className={switching ? "opacity-50 transition-opacity" : ""}>
        <ChatMessage
          content={currentResponse.content}
          role="assistant"
          timestamp={new Date()}
        />
      </div>

      {/* Model indicator pills at bottom */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex gap-1 flex-wrap">
          {responses.map((response, index) => (
            <button
              key={response.id}
              onClick={() => switchToResponse(index)}
              disabled={switching}
              className={`px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                index === currentResponseIndex
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
              title={`Switch to ${response.modelDisplayName} response (${response.tokensUsed} tokens)`}
            >
              {response.modelDisplayName.split(' ')[0]}
            </button>
          ))}
        </div>
        
        {/* Token usage info */}
        <div className="text-xs text-gray-500 mt-2">
          Used {currentResponse.tokensUsed} tokens • 
          {responses.length > 1 && (
            <span> Total: {responses.reduce((sum, r) => sum + r.tokensUsed, 0)} tokens saved</span>
          )}
        </div>
      </div>
    </div>
  );
} 