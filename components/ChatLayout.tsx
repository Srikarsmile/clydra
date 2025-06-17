import React, { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatInterface from "./ChatInterface";
import Sheet from "./Sheet";

interface ChatLayoutProps {
  children?: React.ReactNode;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GenerationItem {
  id: string;
  type: "chat" | "image" | "video";
  prompt: string;
  result?: string;
  model: string;
  timestamp: Date;
  status: "generating" | "completed" | "failed";
  metadata?: {
    duration?: string;
    cost?: string;
    size?: string;
    error?: string;
  };
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New state for generations and history
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [currentImageGeneration, setCurrentImageGeneration] =
    useState<GenerationItem | null>(null);
  const [currentVideoGeneration, setCurrentVideoGeneration] =
    useState<GenerationItem | null>(null);
  const selectedImageModel = "fal-ai/imagen4/preview";
  const selectedVideoModel = "fal-ai/kling-video/v2/master/text-to-video";
  const [selectedVideoDuration, setSelectedVideoDuration] = useState("5");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");

  // Mock chat usage - in real app, this would come from API
  const chatUsage = { used: 420, total: 500 };

  const handleSendMessage = async (content: string, model: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add to history
    const chatGeneration: GenerationItem = {
      id: Date.now().toString(),
      type: "chat",
      prompt: content,
      model,
      timestamp: new Date(),
      status: "generating",
    };

    setGenerations((prev) => [chatGeneration, ...prev]);

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a mock response from ${model}. In a real implementation, this would be the actual AI response from the selected model.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Update generation status
      setGenerations((prev) =>
        prev.map((gen) =>
          gen.id === chatGeneration.id
            ? { ...gen, status: "completed", result: assistantMessage.content }
            : gen
        )
      );
    }, 1500);
  };

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) return;

    // Check daily limit first - count both local and API generations
    const today = new Date().toDateString();
    const todayGenerations = generations.filter(
      (g) =>
        g.type === "image" &&
        g.status === "completed" &&
        new Date(g.timestamp).toDateString() === today
    ).length;

    console.log('Today\'s image generations:', todayGenerations);

    if (todayGenerations >= 3) {
      // Show upgrade prompt instead of generating
      const failedGeneration: GenerationItem = {
        id: Date.now().toString(),
        type: "image",
        prompt: imagePrompt,
        model: selectedImageModel,
        timestamp: new Date(),
        status: "failed",
        metadata: {
          cost: "Free",
          error: "Daily limit reached. Upgrade to generate unlimited images.",
        },
      };

      setCurrentImageGeneration(failedGeneration);
      setGenerations((prev) => [failedGeneration, ...prev]);
      return;
    }

    const generation: GenerationItem = {
      id: Date.now().toString(),
      type: "image",
      prompt: imagePrompt,
      model: selectedImageModel,
      timestamp: new Date(),
      status: "generating",
      metadata: {
        cost: "Free",
      },
    };

    setCurrentImageGeneration(generation);
    setGenerations((prev) => [generation, ...prev]);

    try {
      console.log('Starting image generation with fal.ai API...');
      console.log('Request data:', {
        model: selectedImageModel,
        prompt: imagePrompt,
        settings: {
          width: 1024,
          height: 1024,
          num_images: 1,
        },
        skipCreditCheck: true,
      });
      
      // Call the real fal.ai API for free tier
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedImageModel,
          prompt: imagePrompt,
          settings: {
            width: 1024,
            height: 1024,
            num_images: 1,
          },
          skipCreditCheck: true, // Skip credit validation for free tier
        }),
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        throw new Error(result.error || result.details || `HTTP ${response.status}: ${response.statusText}`);
      }

            if (result.success && result.data) {
        console.log('✅ Generation successful, extracting image URL...');
        console.log('Result data structure:', result.data);
        
        // Extract image URL from fal.ai response
        // API wraps fal.ai response, so structure is: result.data.data.images[0].url
        const imageUrl = result.data.data?.images?.[0]?.url || result.data.images?.[0]?.url || result.data.image?.url;
        
        console.log('Extracted image URL:', imageUrl);
        
        if (!imageUrl) {
          console.error('❌ No image URL found in response data:', result.data);
          throw new Error('No image URL found in API response');
        }
        
        const completedGeneration = {
          ...generation,
          status: "completed" as const,
          result: imageUrl,
          metadata: {
            ...generation.metadata,
            cost: "Free",
          },
        };
        
        console.log('✅ Setting completed generation:', completedGeneration);
        
        setCurrentImageGeneration(completedGeneration);
        setGenerations((prev) =>
          prev.map((gen) =>
            gen.id === generation.id ? completedGeneration : gen
          )
        );
      } else {
        // Log the full API response for debugging
        console.error('Image API Error Response:', result);
        throw new Error(result.error || result.details || 'Generation failed');
      }
    } catch (error) {
      console.error("Image generation failed:", error);

      let errorMessage = "Generation failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check for specific error types
      if (errorMessage.includes("safety checks")) {
        errorMessage = "Image filtered by safety checks. Try a different prompt.";
      } else if (errorMessage.includes("Unauthorized")) {
        errorMessage = "Please sign in to generate images.";
      } else if (errorMessage.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment.";
      }

      const failedGeneration = {
        ...generation,
        status: "failed" as const,
        metadata: {
          ...generation.metadata,
          error: errorMessage,
        },
      };

      setCurrentImageGeneration(failedGeneration);
      setGenerations((prev) =>
        prev.map((gen) => (gen.id === generation.id ? failedGeneration : gen))
      );
    }
  };

  const handleVideoGeneration = async () => {
    if (!videoPrompt.trim()) return;

    // Check daily limit first
    const today = new Date().toDateString();
    const todayVideoGenerations = generations.filter(
      (g) =>
        g.type === "video" &&
        g.status === "completed" &&
        new Date(g.timestamp).toDateString() === today
    ).length;

    console.log('Today\'s video generations:', todayVideoGenerations);

    if (todayVideoGenerations >= 1) {
      // Show upgrade prompt for videos (1 per day)
      const failedGeneration: GenerationItem = {
        id: Date.now().toString(),
        type: "video",
        prompt: videoPrompt,
        model: selectedVideoModel,
        timestamp: new Date(),
        status: "failed",
        metadata: {
          duration: `${selectedVideoDuration}s`,
          cost: "Free",
          error: "Daily limit reached. Upgrade to generate unlimited videos.",
        },
      };

      setCurrentVideoGeneration(failedGeneration);
      setGenerations((prev) => [failedGeneration, ...prev]);
      return;
    }

    const generation: GenerationItem = {
      id: Date.now().toString(),
      type: "video",
      prompt: videoPrompt,
      model: selectedVideoModel,
      timestamp: new Date(),
      status: "generating",
      metadata: {
        duration: `${selectedVideoDuration}s`,
        cost: "Free",
      },
    };

    setCurrentVideoGeneration(generation);
    setGenerations((prev) => [generation, ...prev]);

    try {
      console.log('Starting video generation with fal.ai API...');
      
      // Call the real fal.ai API for free tier
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedVideoModel,
          prompt: videoPrompt,
          settings: {
            duration: parseInt(selectedVideoDuration),
            aspect_ratio: "16:9",
            cfg_scale: 0.5,
            negative_prompt: "blur, distort, and low quality",
          },
          skipCreditCheck: true, // Skip credit validation for free tier
        }),
      });

      console.log('Video API response status:', response.status);
      console.log('Video API response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('Video API response:', result);
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        console.error('Full API Error Response:', result);
        throw new Error(result.error || result.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success && result.data) {
        console.log('✅ Video generation successful, extracting video URL...');
        console.log('Video result data structure:', result.data);
        
        // Extract video URL from fal.ai response
        // The fal.ai response structure is: result.data.video.url
        let videoUrl: string | undefined;
        
        // Try different possible paths for video URL based on actual API response
        if (result.data?.video?.url) {
          videoUrl = result.data.video.url;
        } else if (result.data?.url) {
          videoUrl = result.data.url;
        } else if (result.data?.data?.video?.url) {
          videoUrl = result.data.data.video.url;
        } else if (result.data?.data?.url) {
          videoUrl = result.data.data.url;
        }
        
        console.log('Extracted video URL:', videoUrl);
        
        if (!videoUrl) {
          console.error('❌ No video URL found in response data:', result.data);
          throw new Error('No video URL found in API response');
        }
        
        const completedGeneration = {
          ...generation,
          status: "completed" as const,
          result: videoUrl,
          metadata: {
            ...generation.metadata,
            cost: "Free",
          },
        };
        
        console.log('✅ Setting completed video generation:', completedGeneration);
        
        setCurrentVideoGeneration(completedGeneration);
        setGenerations((prev) =>
          prev.map((gen) =>
            gen.id === generation.id ? completedGeneration : gen
          )
        );
      } else {
        // Log the full API response for debugging
        console.error('Video API Error Response:', result);
        throw new Error(result.error || result.details || 'Generation failed');
      }
    } catch (error) {
      console.error("Video generation failed:", error);

      let errorMessage = "Generation failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check for specific error types
      if (errorMessage.includes("safety checks")) {
        errorMessage = "Video filtered by safety checks. Try a different prompt.";
      } else if (errorMessage.includes("Unauthorized")) {
        errorMessage = "Please sign in to generate videos.";
      } else if (errorMessage.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment.";
      } else if (errorMessage.includes("FAL_KEY")) {
        errorMessage = "Video generation service is not configured. Please check configuration.";
      }

      const failedGeneration = {
        ...generation,
        status: "failed" as const,
        metadata: {
          ...generation.metadata,
          error: errorMessage,
        },
      };

      setCurrentVideoGeneration(failedGeneration);
      setGenerations((prev) =>
        prev.map((gen) => (gen.id === generation.id ? failedGeneration : gen))
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        );
      case "images":
        return (
          <div className="flex flex-col h-full bg-bg-base">
            <div className="p-6 border-b border-border/30 bg-surface/50 backdrop-blur-sm">
              <h2 className="text-title-2 font-semibold text-text-main">
                AI Image Generation
              </h2>
              <p className="text-body text-text-muted mt-2">
                Create stunning images from text descriptions
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Generated Image Display */}
                {currentImageGeneration && (
                  <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-title-3 font-semibold text-text-main">
                        Generated Image
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-caption-1 font-medium ${
                            currentImageGeneration.status === "generating"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : currentImageGeneration.status === "completed"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {currentImageGeneration.status === "generating"
                            ? "Generating..."
                            : currentImageGeneration.status === "completed"
                              ? "Completed"
                              : "Failed"}
                        </span>
                        <span className="text-caption-1 text-text-muted">
                          {currentImageGeneration.metadata?.cost}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface/60 rounded-xl p-4 mb-4">
                      <p className="text-body text-text-main italic">
                        "{currentImageGeneration.prompt}"
                      </p>
                      <p className="text-caption-1 text-text-muted mt-2">
                        Model: Google Imagen4
                      </p>
                    </div>

                    {currentImageGeneration.status === "generating" ? (
                      <div className="aspect-square bg-surface/60 rounded-xl flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-body text-text-muted">
                            Generating your image...
                          </p>
                          <p className="text-caption-1 text-text-muted">
                            This usually takes 10-30 seconds
                          </p>
                        </div>
                      </div>
                    ) : currentImageGeneration.status === "completed" &&
                      currentImageGeneration.result ? (
                      <div className="space-y-4">
                        <img
                          src={currentImageGeneration.result}
                          alt="Generated image"
                          className="w-full aspect-square object-cover rounded-xl border border-border/30"
                        />
                        <div className="flex space-x-3">
                          <a
                            href={currentImageGeneration.result}
                            download="generated-image.jpg"
                            className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:shadow-primary-glow transition-all text-center"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => {
                              setCurrentImageGeneration(null);
                              handleImageGeneration();
                            }}
                            className="flex-1 bg-surface text-text-main py-3 px-4 rounded-xl font-medium border border-border/50 hover:bg-surface/80 transition-all"
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚡</span>
                          </div>
                          <h3 className="text-title-3 font-semibold text-text-main mb-2">
                            {currentImageGeneration.metadata?.error?.includes(
                              "Daily limit"
                            )
                              ? "Daily Limit Reached"
                              : "Generation Failed"}
                          </h3>
                          <p className="text-caption-1 text-text-muted mb-4">
                            {currentImageGeneration.metadata?.error ||
                              "Please try again"}
                          </p>
                          {currentImageGeneration.metadata?.error?.includes(
                            "Daily limit"
                          ) ? (
                            <button className="bg-gradient-neo-wave text-white px-6 py-3 rounded-xl font-medium hover:shadow-primary-glow transition-all duration-300 hover:scale-[1.02]">
                              Upgrade to Pro
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setCurrentImageGeneration(null);
                                handleImageGeneration();
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-caption-1 hover:bg-red-600 transition-all"
                            >
                              Try Again
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Free Tier Info */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎁</span>
                    </div>
                    <div>
                      <h3 className="text-title-3 font-semibold text-text-main">
                        Free Daily Images
                      </h3>
                      <p className="text-caption-1 text-green-600">
                        {3 -
                          generations.filter(
                            (g) =>
                              g.type === "image" &&
                              g.status === "completed" &&
                              new Date(g.timestamp).toDateString() ===
                                new Date().toDateString()
                          ).length}{" "}
                        of 3 remaining today
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-surface/60 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (generations.filter(
                            (g) =>
                              g.type === "image" &&
                              g.status === "completed" &&
                              new Date(g.timestamp).toDateString() ===
                                new Date().toDateString()
                          ).length /
                            3) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-caption-1 text-text-muted">
                    Resets daily at midnight • Upgrade for unlimited generations
                  </p>
                </div>

                {/* Model Selection */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    AI Model
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-4 p-4 bg-primary/10 border-2 border-primary/30 rounded-xl">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🎨</span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-callout font-semibold text-text-main">
                          Google Imagen4
                        </h4>
                        <p className="text-caption-1 text-text-muted">
                          Free tier • High quality • Fast generation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    Describe Your Image
                  </h3>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="A serene mountain landscape at sunset with golden light reflecting on a crystal-clear lake..."
                    rows={4}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-body text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none"
                  />
                  <button
                    onClick={handleImageGeneration}
                    disabled={
                      !imagePrompt.trim() ||
                      currentImageGeneration?.status === "generating"
                    }
                    className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-primary-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {currentImageGeneration?.status === "generating"
                      ? "Generating..."
                      : generations.filter(
                            (g) =>
                              g.type === "image" &&
                              g.status === "completed" &&
                              new Date(g.timestamp).toDateString() ===
                                new Date().toDateString()
                          ).length >= 3
                        ? "Upgrade for More"
                        : "Generate Image (Free)"}
                  </button>
                </div>

                {/* Quick Examples */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    💡 Popular Ideas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        title: "Product Photography",
                        prompt:
                          "Professional product shot with studio lighting, clean white background, commercial photography style",
                      },
                      {
                        title: "Social Media",
                        prompt:
                          "Instagram-ready flat lay workspace aesthetic, pastel colors, minimalist design, top-down view",
                      },
                      {
                        title: "Portrait Art",
                        prompt:
                          "Artistic portrait with dramatic lighting, cinematic style, professional photography",
                      },
                      {
                        title: "Landscape",
                        prompt:
                          "Breathtaking mountain sunset landscape, golden hour lighting, epic vista, nature photography",
                      },
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setImagePrompt(example.prompt)}
                        className="text-left p-4 bg-surface/60 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                      >
                        <h4 className="text-callout font-semibold text-text-main">
                          {example.title}
                        </h4>
                        <p className="text-caption-1 text-text-muted mt-1 line-clamp-2">
                          {example.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "video":
        return (
          <div className="flex flex-col h-full bg-bg-base">
            <div className="p-6 border-b border-border/30 bg-surface/50 backdrop-blur-sm">
              <h2 className="text-title-2 font-semibold text-text-main">
                AI Video Creation
              </h2>
              <p className="text-body text-text-muted mt-2">
                Generate professional videos from text prompts
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Generated Video Display */}
                {currentVideoGeneration && (
                  <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-title-3 font-semibold text-text-main">
                        Generated Video
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-caption-1 font-medium ${
                            currentVideoGeneration.status === "generating"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : currentVideoGeneration.status === "completed"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {currentVideoGeneration.status === "generating"
                            ? "Generating..."
                            : currentVideoGeneration.status === "completed"
                              ? "Completed"
                              : "Failed"}
                        </span>
                        <span className="text-caption-1 text-text-muted">
                          {currentVideoGeneration.metadata?.cost}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface/60 rounded-xl p-4 mb-4">
                      <p className="text-body text-text-main italic">
                        "{currentVideoGeneration.prompt}"
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-caption-1 text-text-muted">
                        <span>Model: Kling Video 2.0</span>
                        <span>•</span>
                        <span>
                          Duration: {currentVideoGeneration.metadata?.duration}
                        </span>
                      </div>
                    </div>

                    {currentVideoGeneration.status === "generating" ? (
                      <div className="aspect-video bg-surface/60 rounded-xl flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-body text-text-muted">
                            Generating your video...
                          </p>
                          <p className="text-caption-1 text-text-muted">
                            This may take 2-5 minutes
                          </p>
                        </div>
                      </div>
                    ) : currentVideoGeneration.status === "completed" &&
                      currentVideoGeneration.result ? (
                      <div className="space-y-4">
                        <video
                          src={currentVideoGeneration.result}
                          controls
                          className="w-full aspect-video rounded-xl border border-border/30"
                          poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDgwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjQwMCIgeT0iMjI1IiBmaWxsPSIjNjM2NjcxIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdlbmVyYXRlZCBWaWRlbzwvdGV4dD4KPC9zdmc+"
                        />
                        <div className="flex space-x-3">
                          <a
                            href={currentVideoGeneration.result}
                            download="generated-video.mp4"
                            className="flex-1 bg-accent text-white py-3 px-4 rounded-xl font-medium hover:shadow-accent-glow transition-all text-center"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => {
                              setCurrentVideoGeneration(null);
                              handleVideoGeneration();
                            }}
                            className="flex-1 bg-surface text-text-main py-3 px-4 rounded-xl font-medium border border-border/50 hover:bg-surface/80 transition-all"
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚡</span>
                          </div>
                          <h3 className="text-title-3 font-semibold text-text-main mb-2">
                            {currentVideoGeneration.metadata?.error?.includes(
                              "Daily limit"
                            )
                              ? "Daily Limit Reached"
                              : "Generation Failed"}
                          </h3>
                          <p className="text-caption-1 text-text-muted mb-4">
                            {currentVideoGeneration.metadata?.error ||
                              "Please try again"}
                          </p>
                          {currentVideoGeneration.metadata?.error?.includes(
                            "Daily limit"
                          ) ? (
                            <button className="bg-gradient-neo-wave text-white px-6 py-3 rounded-xl font-medium hover:shadow-primary-glow transition-all duration-300 hover:scale-[1.02]">
                              Upgrade to Pro
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setCurrentVideoGeneration(null);
                                handleVideoGeneration();
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-caption-1 hover:bg-red-600 transition-all"
                            >
                              Try Again
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Free Tier Info */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎁</span>
                    </div>
                    <div>
                      <h3 className="text-title-3 font-semibold text-text-main">
                        Free Daily Video
                      </h3>
                      <p className="text-caption-1 text-purple-600">
                        {1 -
                          generations.filter(
                            (g) =>
                              g.type === "video" &&
                              g.status === "completed" &&
                              new Date(g.timestamp).toDateString() ===
                                new Date().toDateString()
                          ).length}{" "}
                        of 1 remaining today
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-surface/60 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (generations.filter(
                            (g) =>
                              g.type === "video" &&
                              g.status === "completed" &&
                              new Date(g.timestamp).toDateString() ===
                                new Date().toDateString()
                          ).length /
                            1) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-caption-1 text-text-muted">
                    Resets daily at midnight • Upgrade for unlimited generations
                  </p>
                </div>

                {/* Model Selection */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    AI Model
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-4 p-4 bg-accent/10 border-2 border-accent/30 rounded-xl">
                      <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🎬</span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-callout font-semibold text-text-main">
                          Kling Video 2.0 Master
                        </h4>
                        <p className="text-caption-1 text-text-muted">
                          Free tier • High quality • Cinematic
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    Video Duration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedVideoDuration("5")}
                      className={`p-4 rounded-xl transition-all text-left ${
                        selectedVideoDuration === "5"
                          ? "bg-primary/10 border-2 border-primary/30"
                          : "bg-surface/60 border border-border/30 hover:bg-surface/80"
                      }`}
                    >
                      <div className="text-callout font-semibold text-text-main">
                        5 seconds
                      </div>
                      <div className="text-caption-1 text-text-muted mt-1">
                        Free
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedVideoDuration("10")}
                      className={`p-4 rounded-xl transition-all text-left ${
                        selectedVideoDuration === "10"
                          ? "bg-primary/10 border-2 border-primary/30"
                          : "bg-surface/60 border border-border/30 hover:bg-surface/80"
                      }`}
                    >
                      <div className="text-callout font-semibold text-text-main">
                        10 seconds
                      </div>
                      <div className="text-caption-1 text-text-muted mt-1">
                        Free
                      </div>
                    </button>
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    Describe Your Video
                  </h3>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="A dynamic product showcase rotating against a minimalist background, professional lighting, modern aesthetic..."
                    rows={4}
                    className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-body text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none"
                  />
                  <button
                    onClick={handleVideoGeneration}
                    disabled={
                      !videoPrompt.trim() ||
                      currentVideoGeneration?.status === "generating"
                    }
                    className="mt-4 bg-accent text-white px-6 py-3 rounded-xl font-medium hover:shadow-accent-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {currentVideoGeneration?.status === "generating"
                      ? "Generating..."
                      : generations.filter(
                            (g) =>
                              g.type === "video" &&
                              g.status === "completed" &&
                              new Date(g.timestamp).toDateString() ===
                                new Date().toDateString()
                          ).length >= 1
                        ? "Upgrade for More"
                        : `Generate Video (Free)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case "history":
        return (
          <div className="flex flex-col h-full bg-bg-base">
            <div className="p-6 border-b border-border/30 bg-surface/50 backdrop-blur-sm">
              <h2 className="text-title-2 font-semibold text-text-main">
                Generation History
              </h2>
              <p className="text-body text-text-muted mt-2">
                View your previous AI generations and conversations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* Filter Tabs */}
                <div className="flex space-x-2 mb-6">
                  {["All", "Chat", "Images", "Videos"].map((filter) => (
                    <button
                      key={filter}
                      className={`px-4 py-2 rounded-xl text-callout font-medium transition-all ${
                        filter === "All"
                          ? "bg-primary text-white"
                          : "bg-surface text-text-muted hover:text-text-main hover:bg-surface/80"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* History Items */}
                <div className="space-y-4">
                  {generations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-surface/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📚</span>
                      </div>
                      <h3 className="text-title-3 font-semibold text-text-main mb-2">
                        No History Yet
                      </h3>
                      <p className="text-body text-text-muted">
                        Start chatting or generating content to see your history
                        here.
                      </p>
                    </div>
                  ) : (
                    generations.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              item.type === "chat"
                                ? "bg-gradient-neo-wave"
                                : item.type === "image"
                                  ? "bg-primary/20"
                                  : "bg-accent/20"
                            }`}
                          >
                            <span className="text-white text-xl">
                              {item.type === "chat"
                                ? "💬"
                                : item.type === "image"
                                  ? "🎨"
                                  : "🎬"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-callout font-semibold text-text-main capitalize">
                                {item.type}{" "}
                                {item.type === "chat"
                                  ? "Conversation"
                                  : "Generation"}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-caption-2 font-medium ${
                                  item.status === "generating"
                                    ? "bg-yellow-500/20 text-yellow-600"
                                    : item.status === "completed"
                                      ? "bg-green-500/20 text-green-600"
                                      : "bg-red-500/20 text-red-600"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="text-caption-1 text-text-muted line-clamp-2 mb-3">
                              {item.prompt}
                            </p>
                            <div className="flex items-center space-x-4 text-caption-1 text-text-muted">
                              <span>{item.timestamp.toLocaleTimeString()}</span>
                              <span>•</span>
                              <span>
                                {item.type === "image"
                                  ? "Google Imagen4"
                                  : item.type === "video"
                                    ? "Kling Video 2.0"
                                    : item.model}
                              </span>
                              {item.metadata?.cost && (
                                <>
                                  <span>•</span>
                                  <span>{item.metadata.cost}</span>
                                </>
                              )}
                              {item.metadata?.duration && (
                                <>
                                  <span>•</span>
                                  <span>{item.metadata.duration}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {item.result && item.type === "image" && (
                            <img
                              src={item.result}
                              alt="Generated"
                              className="w-16 h-16 object-cover rounded-lg border border-border/30"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="flex flex-col h-full bg-bg-base">
            <div className="p-6 border-b border-border/30 bg-surface/50 backdrop-blur-sm">
              <h2 className="text-title-2 font-semibold text-text-main">
                Billing & Usage
              </h2>
              <p className="text-body text-text-muted mt-2">
                Manage your subscription and view usage statistics
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Current Plan */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    Current Plan
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-callout font-semibold text-text-main">
                        Free Plan
                      </div>
                      <div className="text-caption-1 text-text-muted">
                        $3.00 in free credits
                      </div>
                    </div>
                    <button className="bg-gradient-neo-wave text-white px-6 py-3 rounded-xl font-medium hover:shadow-primary-glow transition-all duration-300 hover:scale-[1.02]">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                    <h4 className="text-callout font-semibold text-text-main mb-2">
                      Chat Messages
                    </h4>
                    <div className="text-title-2 font-bold text-primary">
                      420 / 500
                    </div>
                    <div className="text-caption-1 text-text-muted">
                      80 remaining
                    </div>
                  </div>
                  <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                    <h4 className="text-callout font-semibold text-text-main mb-2">
                      Images Generated
                    </h4>
                    <div className="text-title-2 font-bold text-secondary">
                      {
                        generations.filter(
                          (g) => g.type === "image" && g.status === "completed"
                        ).length
                      }{" "}
                      / 30
                    </div>
                    <div className="text-caption-1 text-text-muted">
                      {30 -
                        generations.filter(
                          (g) => g.type === "image" && g.status === "completed"
                        ).length}{" "}
                      remaining
                    </div>
                  </div>
                  <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                    <h4 className="text-callout font-semibold text-text-main mb-2">
                      Videos Created
                    </h4>
                    <div className="text-title-2 font-bold text-accent">
                      {
                        generations.filter(
                          (g) => g.type === "video" && g.status === "completed"
                        ).length
                      }{" "}
                      / 5
                    </div>
                    <div className="text-caption-1 text-text-muted">
                      {5 -
                        generations.filter(
                          (g) => g.type === "video" && g.status === "completed"
                        ).length}{" "}
                      remaining
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50">
                  <h3 className="text-title-3 font-semibold text-text-main mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {generations.slice(0, 5).map((generation, index) => (
                      <div
                        key={generation.id}
                        className="flex items-center justify-between py-3 border-b border-border/20 last:border-b-0"
                      >
                        <div>
                          <div className="text-callout text-text-main capitalize">
                            {generation.type}{" "}
                            {generation.type === "chat"
                              ? "Message"
                              : "Generation"}
                          </div>
                          <div className="text-caption-1 text-text-muted">
                            {generation.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-callout font-semibold text-text-main">
                          {generation.metadata?.cost || "$0.02"}
                        </div>
                      </div>
                    ))}
                    {generations.length === 0 && (
                      <p className="text-center text-text-muted py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return children;
    }
  };

  return (
    <div className="h-screen bg-bg-base flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 h-full">
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatUsage={chatUsage}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 bg-surface/90 backdrop-blur-sm text-text-main p-2 rounded-xl border border-border/50 shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Sidebar Sheet */}
      <Sheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          chatUsage={chatUsage}
        />
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 h-full">{renderContent()}</div>
    </div>
  );
}
