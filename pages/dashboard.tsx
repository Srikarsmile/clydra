import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { GetServerSideProps } from "next";
import { buildClerkProps } from "@clerk/nextjs/server";
// import Image from "next/image"; // Currently using regular img tags
import Layout from "../components/Layout";
import UsageBars from "../components/UsageBars";
import Link from "next/link";

interface GenerationResult {
  data: {
    images?: Array<{ url: string }>;
    video?: { url: string };
    // Handle the actual fal.ai response structure
    data?: {
      images?: Array<{ url: string }>;
      video?: { url: string };
    };
  };
  requestId: string;
}

interface GenerationHistory {
  id: string;
  prompt: string;
  model: string;
  result: GenerationResult;
  timestamp: Date;
}

interface WalletBalance {
  balance: number; // in USD
  total_deposited: number; // in USD
  total_spent: number; // in USD
}

interface Generation {
  requestId: string;
  prompt: string;
  model: string;
  result: GenerationResult;
  timestamp: string;
}

// Helper functions for localStorage persistence
const loadFromLocalStorage = (key: string): unknown => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    return null;
  }
};

function Dashboard() {
  const { user, isLoaded } = useUser();
  const [activeModel, setActiveModel] = useState<"imagen4" | "kling">("imagen4");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [videoDuration, setVideoDuration] = useState<5 | 10>(5);

  // Model configurations with dollar pricing
  const models = [
    {
      id: "imagen4" as const,
      name: "AI Image Generation",
      description: "High-quality images from text descriptions",
      icon: "🎨",
      type: "image",
      cost: 0.10, // $0.10 per image
      features: ["Ultra-high resolution", "Multiple art styles", "Commercial rights"],
    },
    {
      id: "kling" as const,
      name: "AI Video Creation",
      description: "Professional videos from prompts",
      icon: "🎬",
      type: "video",
      cost: (videoDuration === 5 ? 1.50 : 3.00), // $1.50 for 5s, $3.00 for 10s
      features: ["4K quality", "Custom duration", "Cinematic effects"],
    },
  ];

  const currentModel = models.find((m) => m.id === activeModel);
  const currentModelCost = currentModel?.cost || 0;

  // Load user's generations from database on component mount
  useEffect(() => {
    if (user) {
      loadUserGenerations();
    }
    
    // Load video duration preference from localStorage
    const savedDuration = loadFromLocalStorage("videoDuration");
    if (savedDuration && (savedDuration === 5 || savedDuration === 10)) {
      setVideoDuration(savedDuration as 5 | 10);
    }
  }, [user]);

  // Fetch wallet balance
  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/credits/balance");
      const result = await response.json();

      if (result.success && result.data) {
        const walletBalance: WalletBalance = {
          balance: result.data.balance || 0,
          total_deposited: result.data.total_purchased || 0,
          total_spent: result.data.total_used || 0,
        };
        setBalance(walletBalance);
      } else {
        // Fallback to starting balance for new users
        const mockBalance: WalletBalance = {
          balance: 3.0, // $3.00 starting balance for new users
          total_deposited: 3.0,
          total_spent: 0.0,
        };
        setBalance(mockBalance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      // Fallback to starting balance
      const mockBalance: WalletBalance = {
        balance: 3.0,
        total_deposited: 3.0,
        total_spent: 0.0,
      };
      setBalance(mockBalance);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadUserGenerations = async () => {
    try {
      const response = await fetch("/api/generations/list?limit=5");
      const result = await response.json();

      if (result.success && result.data) {
        const generations = result.data.generations;
        
        // Set the most recent generation as current result
        if (generations.length > 0) {
          setResult(generations[0].result);
        }
        
        // Set history (convert to expected format)
        const historyItems: GenerationHistory[] = generations.map((gen: Generation) => ({
          id: gen.requestId,
          prompt: gen.prompt,
          model: gen.model === 'imagen4' ? 'imagen4' : 'kling',
          result: gen.result,
          timestamp: new Date(gen.timestamp),
        }));
        setHistory(historyItems);
      }
    } catch (err) {
      // Fallback to localStorage if database fails
      const savedResult = loadFromLocalStorage("lastGenerationResult");
      const savedHistory = loadFromLocalStorage("generationHistory");
      
      if (savedResult && typeof savedResult === 'object' && savedResult !== null) {
        setResult(savedResult as GenerationResult);
      }
      if (savedHistory && Array.isArray(savedHistory)) {
        const historyWithDates = savedHistory.map((item: GenerationHistory) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(historyWithDates);
      }
    }
  };

  const saveGenerationToDatabase = async (result: any, prompt: string, model: string, cost: number, latency: number) => {
    try {
      const response = await fetch("/api/generations/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model === "imagen4" ? "fal-ai/imagen4/preview" : "fal-ai/kling-video/v2/master/text-to-video",
          prompt,
          settings: model === "kling" ? { duration: videoDuration, aspect_ratio: "16:9" } : {},
          resultData: result.data,
          resultUrl: model === "imagen4" 
            ? result.data?.images?.[0]?.url || result.data?.data?.images?.[0]?.url
            : result.data?.video?.url || result.data?.data?.video?.url,
          cost,
          latency,
          requestId: result.requestId,
          status: 'success'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }
    } catch (err) {
      // Silent fail - not critical for user experience
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    // Check balance
    if (balance && balance.balance < currentModelCost) {
      alert(`Insufficient funds. You need $${currentModelCost.toFixed(2)} but only have $${balance.balance.toFixed(2)}. Please add funds to your account.`);
      return;
    }

    setIsGenerating(true);
    
    const startTime = Date.now();

    try {
      // Call the generation API endpoint
      const endpoint = "/api/v1/generate";
      const requestBody = {
        prompt,
        model: activeModel === "imagen4" ? "fal-ai/imagen4/preview" : "fal-ai/kling-video/v2/master/text-to-video",
        ...(activeModel === "kling" && { 
          settings: { 
            duration: videoDuration,
            aspect_ratio: "16:9"
          }
        })
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      setResult(result);
      
      // Save to database
      await saveGenerationToDatabase(result, prompt, activeModel, currentModelCost, latency);
      
      // Deduct credits
      try {
        await fetch("/api/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deltaImages: activeModel === "imagen4" ? 1 : 0,
            deltaSeconds: activeModel === "kling" ? videoDuration : 0,
            deltaUsd: -currentModelCost, // Negative to deduct
          }),
        });
      } catch (error) {
        console.error("Failed to update credits:", error);
      }
      
      // Refresh balance
      await fetchBalance();
      
      // Update history
      const newHistoryItem: GenerationHistory = {
        id: result.requestId,
        prompt,
        model: activeModel,
        result,
        timestamp: new Date(),
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
      
    } catch (error) {
      // Show error to user
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `rivo-creation-${Date.now()}.${url.includes('.mp4') ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  if (!isLoaded) {
    return (
      <Layout>
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-neo-wave rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <p className="text-text-muted">Loading your creative workspace...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-bg-base">
        {/* Header */}
        <div className="bg-gradient-neo-wave text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-large-title font-semibold mb-2 tracking-tight">AI Creative Studio</h1>
                <p className="text-body font-normal opacity-90">Generate stunning content with advanced AI models</p>
              </div>
              <div className="flex items-center space-x-6 text-body font-normal">
                <div>Balance: <span className="font-semibold">
                  {loadingBalance ? "Loading..." : `$${balance?.balance?.toFixed(2) || "0.00"}`}
                </span></div>
                <Link href="/sign-out" className="text-white/80 hover:text-white transition-colors">
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generation Panel */}
            <div className="lg:col-span-2 space-y-6">
                {/* Model Selection */}
              <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
                <h2 className="text-title-2 font-semibold text-text-main mb-6 tracking-tight">Model Selection</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setActiveModel(model.id)}
                      className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${
                          activeModel === model.id
                          ? "border-primary bg-primary/5 shadow-primary-glow transform scale-[1.02]"
                          : "border-border/50 bg-surface/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-secondary/[0.02] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Provider Badge */}
                      <span className="absolute top-3 left-3 text-xs bg-neutral-200 px-2 py-0.5 rounded-full text-text-muted">
                        Engine: {model.id === 'imagen4' ? 'Imagen 4' : 'Fal Kling Video'}
                      </span>
                      {/* Cost Badge */}
                      <span className="absolute top-3 right-3 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                        ${model.cost.toFixed(2)} / {model.type === "video" ? "video" : "img"}
                      </span>
                      <div className="relative z-10 mt-6">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl">{model.icon}</span>
                          <h3 className="text-callout font-semibold text-text-main">{model.name}</h3>
                        </div>
                        <p className="text-footnote text-text-muted mb-4 font-normal">{model.description}</p>
                        <div className="space-y-1">
                          {model.features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                              <span className="text-caption-2 text-text-muted font-normal">{feature}</span>
                            </div>
                          ))}
                        </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              {/* Prompt Input */}
              <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
                <h2 className="text-title-2 font-semibold text-text-main mb-6 tracking-tight">Create Your Prompt</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-callout font-medium text-text-main mb-3">
                      Describe what you want to create
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full h-32 bg-surface/60 border border-border/50 rounded-xl px-4 py-3 text-body text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 font-normal"
                      placeholder={activeModel === "kling" ? "A dynamic product showcase rotating against a minimalist background, professional lighting, modern aesthetic..." : "A serene mountain landscape at sunset with golden light reflecting on a crystal-clear lake..."}
                    />
                    
                    {/* Image Examples - only show for image model */}
                    {activeModel === "imagen4" && (
                      <div className="mt-4">
                        <label className="block text-callout font-medium text-text-main mb-3">
                          💡 Popular Image Ideas
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            {
                              title: "Product Photography",
                              prompt: "Professional product shot of a sleek smartphone on a clean white background, studio lighting, commercial quality, high resolution",
                              tag: "Commercial"
                            },
                            {
                              title: "Social Media",
                              prompt: "Instagram-ready flat lay of modern workspace with laptop, coffee, plants, minimal aesthetic, bright natural lighting, square format",
                              tag: "Social"
                            },
                            {
                              title: "Portrait Art",
                              prompt: "Artistic portrait of a person with dramatic lighting, oil painting style, rich colors, detailed facial features, professional composition",
                              tag: "Portrait"
                            }
                          ].map((example, index) => (
                            <button
                              key={index}
                              onClick={() => setPrompt(example.prompt)}
                              className="text-left p-4 bg-surface/60 rounded-xl border border-border/30 hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200 group"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-callout font-semibold text-text-main group-hover:text-secondary transition-colors">
                                  {example.title}
                                </h4>
                                <span className="text-caption-2 text-text-muted bg-surface/80 px-2 py-1 rounded-lg">
                                  {example.tag}
                                </span>
                              </div>
                              <p className="text-caption-1 text-text-muted line-clamp-2 leading-relaxed">
                                {example.prompt}
                              </p>
                            </button>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-5 h-5 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-callout font-medium text-text-main mb-1">Pro Tip for Images</p>
                              <p className="text-caption-1 text-text-muted">Be specific about lighting, style, and composition. Add "ultra-detailed" or "high resolution" for best quality.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Video Examples - only show for video model */}
                    {activeModel === "kling" && (
                      <div className="mt-4">
                        <label className="block text-callout font-medium text-text-main mb-3">
                          💡 Popular Video Ideas
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            {
                              title: "Instagram Reel",
                              prompt: "A trendy product showcase with smooth rotation, vibrant colors, modern studio lighting, vertical 9:16 format, dynamic movement",
                              tag: "Social Media"
                            },
                            {
                              title: "Brand Commercial",
                              prompt: "Professional lifestyle scene with elegant transitions, soft natural lighting, minimal aesthetic, cinematic quality",
                              tag: "Marketing"
                            },
                            {
                              title: "Food Content",
                              prompt: "Delicious food preparation in slow motion, steam rising, close-up details, warm kitchen lighting, appetizing presentation",
                              tag: "Food & Drink"
                            }
                          ].map((example, index) => (
                            <button
                              key={index}
                              onClick={() => setPrompt(example.prompt)}
                              className="text-left p-4 bg-surface/60 rounded-xl border border-border/30 hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 group"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-callout font-semibold text-text-main group-hover:text-accent transition-colors">
                                  {example.title}
                                </h4>
                                <span className="text-caption-2 text-text-muted bg-surface/80 px-2 py-1 rounded-lg">
                                  {example.tag}
                                </span>
                              </div>
                              <p className="text-caption-1 text-text-muted line-clamp-2 leading-relaxed">
                                {example.prompt}
                              </p>
                            </button>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-callout font-medium text-text-main mb-1">Pro Tip for Instagram</p>
                              <p className="text-caption-1 text-text-muted">For Instagram Reels, add "vertical 9:16 format" to your prompt. For feed posts, use "square 1:1 format".</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Duration Selector - only show for video model */}
                {activeModel === "kling" && (
                    <div>
                      <label className="block text-callout font-medium text-text-main mb-3">
                      Video Duration
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {[5, 10].map((duration) => (
                      <button
                            key={duration}
                            onClick={() => setVideoDuration(duration as 5 | 10)}
                            className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                              videoDuration === duration
                                ? "border-primary bg-primary/5 shadow-primary-glow"
                                : "border-border/50 bg-surface/60 hover:border-primary/30"
                            }`}
                          >
                            <div className="text-callout font-semibold text-text-main">
                              {duration} seconds
                            </div>
                            <div className="text-caption-1 text-text-muted mt-1">
                              ${duration === 5 ? '1.40' : '2.80'}
                            </div>
                            <p className="mt-1 text-text-muted text-xs">
                              {Math.ceil((duration === 5 ? 1.40 : 2.80) / 0.10)} credits
                            </p>
                      </button>
                        ))}
                    </div>
                  </div>
                )}

                  {/* Credit Preview */}
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-border/30">
                    <span className="text-sm text-text-muted">
                      You will spend <span className="font-medium text-text-main">{Math.ceil(currentModelCost / 0.10)} credits</span>
                    </span>
                    <span className="text-xs text-accent">
                      ${currentModelCost.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-callout font-semibold">Generating...</span>
                      </div>
                    ) : (
                      <span className="text-callout font-semibold">Generate Content</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Results */}
              {result && (
                <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
                  <h2 className="text-title-2 font-semibold text-text-main mb-6 tracking-tight">Generated Result</h2>
                  
                  {/* Display Images */}
                  {result.data?.data?.images && result.data.data.images.length > 0 && (
                    <div className="space-y-4">
                      {result.data.data.images.map((image: { url: string }, idx: number) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={image.url} 
                            alt={`Generated: ${prompt}`}
                            className="w-full h-auto rounded-2xl shadow-lg border border-border/30 transition-transform duration-300 group-hover:scale-[1.02]"
                            onError={(e) => console.error("Image load error:", e)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl"></div>
                        <button
                            onClick={() => downloadImage(image.url)}
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-primary p-3 rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                            title="Download Image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Display Video */}
                  {result.data?.data?.video && (
                    <div className="relative group">
                      <video 
                        src={result.data.data.video.url} 
                        controls 
                        className="w-full h-auto rounded-2xl shadow-lg border border-border/30"
                        onError={(e) => console.error("Video load error:", e)}
                      />
                      <button 
                        onClick={() => downloadImage(result.data.data?.video?.url || '')}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-primary p-3 rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                        title="Download Video"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Show prompt below image */}
                  <div className="mt-4 p-4 bg-surface/60 rounded-xl border border-border/30">
                    <div className="text-caption-1 text-text-muted">
                      &ldquo;{prompt.length > 60 ? `${prompt.substring(0, 60)}...` : prompt}&rdquo;
                    </div>
                    <p className="text-caption-1 text-text-muted mt-1">Generated with {activeModel === 'imagen4' ? 'AI Image Generation' : 'AI Video Creation'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Creations */}
              <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-6 border border-border/50 shadow-lg">
                <h3 className="text-title-3 font-semibold text-text-main mb-4 tracking-tight">Recent Creations</h3>
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-surface/60 rounded-xl border border-border/30 hover:border-primary/30 transition-colors duration-200 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-callout text-text-main truncate font-medium">{item.prompt.slice(0, 20)}...</p>
                          <p className="text-caption-1 text-text-muted font-normal">{new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-footnote text-text-muted">
                        No creations yet. Generate your first AI masterpiece!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-6 border border-border/50 shadow-lg">
                <h3 className="text-title-3 font-semibold text-text-main mb-4 tracking-tight">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-surface/60 rounded-xl border border-border/30 hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                              </div>
                      <div>
                        <p className="text-callout text-text-main font-medium">Image Generator</p>
                        <p className="text-caption-1 text-text-muted font-normal">Create images from text</p>
                          </div>
                    </div>
                  </button>
                  
                  <button className="w-full text-left p-3 bg-surface/60 rounded-xl border border-border/30 hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-callout text-text-main font-medium">Video Creator</p>
                        <p className="text-caption-1 text-text-muted font-normal">Generate AI videos</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Usage Stats */}
              <UsageBars />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: { ...buildClerkProps(ctx.req) } };
};

export default Dashboard;
