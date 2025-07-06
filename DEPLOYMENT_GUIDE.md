# Clydra Chat API Deployment Guide

## Required Environment Variables

### Core Configuration
```bash
# OpenRouter API (Primary provider)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE=https://openrouter.ai/api/v1

# Enable chat features
NEXT_PUBLIC_USE_OPENROUTER=true
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Supabase Database (Required for chat functionality)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Clerk Authentication (Required for user management)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Optional Provider APIs (for specialized models)
```bash
# Kluster AI (for Mistral and Llama models)
KLUSTER_API_KEY=your_kluster_api_key_here

# Sarvam AI (for Sarvam M model)
SARVAM_API_KEY=your_sarvam_api_key_here
```

## Model Configuration

### Working Models
1. **Google Gemini 2.5 Flash** (Free tier default) - Uses OpenRouter
2. **GPT-4o** - Uses OpenRouter
3. **Claude 3.5 Sonnet** - Uses OpenRouter
4. **Grok 3** - Uses OpenRouter
5. **Google Gemini 2.5 Pro** - Uses OpenRouter

### Models with Fallback Support
6. **Mistral Small** - Uses Kluster AI, falls back to OpenRouter
7. **Llama 3.3 70B** - Uses Kluster AI, falls back to OpenRouter
8. **Sarvam M** - Uses Sarvam AI, falls back to OpenRouter

## Performance Optimizations Applied

### API Response Speed
- Reduced timeout from 10s to 8s
- Disabled retries for faster responses
- Reduced max_tokens to 1000 for streaming, 1500 for non-streaming
- Optimized temperature settings (0.5-0.7)
- Reduced response cache TTL to 5 minutes

### Model Integration
- Added automatic fallback for missing API keys
- Proper model mapping for third-party providers
- Improved error handling with specific provider messages

## Vercel Deployment

### Environment Variables Setup
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all required variables listed above
4. Deploy your changes

### Minimum Required Variables
```bash
# API Keys
OPENROUTER_API_KEY=your_key_here

# Feature Flags
NEXT_PUBLIC_USE_OPENROUTER=true
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

## Troubleshooting

### If you get "supabaseUrl is required" error:
1. Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel environment variables
2. Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel environment variables  
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables
4. Redeploy after adding the environment variables

### If models are not working:
1. Check that `OPENROUTER_API_KEY` is set correctly
2. Verify `NEXT_PUBLIC_USE_OPENROUTER=true` is set
3. Check Vercel deployment logs for API key errors
4. Ensure your OpenRouter account has sufficient credits

### If authentication errors occur:
1. Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
2. Check that `CLERK_SECRET_KEY` is set
3. Verify your Clerk webhook endpoints are configured

### If responses are slow:
- The optimizations should reduce response times to 2-5 seconds
- Check network connectivity to OpenRouter
- Monitor Vercel function execution times

### For specialized models:
- Mistral/Llama models will fall back to OpenRouter if `KLUSTER_API_KEY` is not set
- Sarvam model will fall back to Gemini Flash if `SARVAM_API_KEY` is not set
- This ensures all models work with just the OpenRouter API key

## Notes
- All models now have proper fallback mechanisms
- Performance has been optimized for sub-5-second response times
- Streaming responses should start appearing within 1-2 seconds
- The system is designed to work with minimal configuration (just OpenRouter)