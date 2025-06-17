// @or OpenRouter feature flag utility
export const useOpenRouter = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_OPENROUTER === 'true';
}; 