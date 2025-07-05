# 🌍 Environment Configuration Guide

This guide covers all environment variables needed for the Clydra Chat application.

## 📋 Quick Setup

1. **Copy the example file:**

   ```bash
   cp env.example .env.local
   ```

2. **Fill in your API keys** (see sections below)

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## 🔑 Required API Keys & Services

### 1. Clerk Authentication

**Purpose:** User authentication and management  
**Get from:** [https://dashboard.clerk.com/](https://dashboard.clerk.com/)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Optional, for webhooks
```

### 2. Supabase Database

**Purpose:** Data storage, user management, chat history  
**Get from:** [https://supabase.com/dashboard/](https://supabase.com/dashboard/)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
```

### 3. OpenRouter (Primary AI Provider)

**Purpose:** Access to multiple AI models (GPT-4, Claude, Gemini, etc.)  
**Get from:** [https://openrouter.ai/keys](https://openrouter.ai/keys)

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE=https://openrouter.ai/api/v1
```

## 🤖 AI Provider Configuration

### Multi-Provider Setup

The application supports three AI providers:

| Provider       | Models                       | Configuration         | Features                    |
| -------------- | ---------------------------- | --------------------- | --------------------------- |
| **OpenRouter** | GPT-4o, Claude, Gemini, etc. | Environment variables | Web search, Multiple models |
| **Kluster AI** | Llama 3.3 70B, Mistral Small | Hardcoded in server   | High performance            |
| **Sarvam AI**  | sarvam-m                     | Hardcoded in server   | Wiki grounding              |

### Currently Configured API Keys

✅ **Kluster AI**: `9f2ddf46-4401-48d1-b3d7-72c05edb44f2`  
✅ **Sarvam AI**: `sk_wq9yiszy_Jewt6e5hC7N99X4khkVVNE7m`

_These are hardcoded in `server/api/chat.ts` and don't require environment variables._

## ⚙️ Application Configuration

### Feature Flags

```env
NEXT_PUBLIC_USE_OPENROUTER=true     # Enable OpenRouter integration
NEXT_PUBLIC_CHAT_ENABLED=true      # Enable chat functionality
```

### Site Configuration

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Your site URL
NODE_ENV=development                         # Environment mode
```

## 🔧 Optional Services

### Redis (Caching & Rate Limiting)

```env
REDIS_URL=redis://localhost:6379  # Optional, improves performance
```

### FAL (Additional AI Services)

```env
FAL_KEY=your_fal_key_here  # Optional, for extended AI features
```

## 🔒 Security Notes

### Public vs Private Variables

**NEXT*PUBLIC*\*** variables are **exposed to the browser**:

- ✅ Use for: Site URLs, feature flags, public keys
- ❌ Don't use for: Secret keys, API keys, database credentials

**Regular variables** are **server-side only**:

- ✅ Use for: API keys, database credentials, secrets

### API Key Security

1. **Never commit** `.env.local` to version control
2. **Use different keys** for development and production
3. **Rotate keys** regularly
4. **Monitor usage** on provider dashboards

## 🚀 Environment-Specific Setup

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 🔍 Troubleshooting

### Common Issues

**1. Chat not working:**

- Check `NEXT_PUBLIC_USE_OPENROUTER=true`
- Verify `OPENROUTER_API_KEY` is set

**2. Authentication errors:**

- Verify Clerk keys are correct
- Check webhook secret if using webhooks

**3. Database errors:**

- Verify Supabase URL and keys
- Check service role key permissions

### Testing Environment Variables

```bash
# Check if variables are loaded
npm run dev

# Check environment in browser console
console.log(process.env.NEXT_PUBLIC_SITE_URL)
```

## 📁 File Structure

```
.env.local          # Your actual environment variables (never commit)
env.example         # Template file (safe to commit)
.env.local.backup*  # Automatic backups
ENVIRONMENT_SETUP.md # This guide
```

## 🆘 Support

If you encounter issues:

1. Check this guide first
2. Verify all required API keys are set
3. Restart your development server
4. Check provider dashboards for API usage/errors

---

_Last updated: $(date +"%Y-%m-%d")_
