// @or OpenRouter feature flag utility
export const useOpenRouter = (): boolean => {
  const useOpenRouterFlag = process.env.NEXT_PUBLIC_USE_OPENROUTER;
  
  // Validate that the environment variable is set
  if (!useOpenRouterFlag) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_USE_OPENROUTER");
  }
  
  return useOpenRouterFlag === "true";
};
