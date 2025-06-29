# Token Meter System Setup Guide

## 🎯 Overview

This token metering system implements a **1,500,000 tokens/month quota** for Pro users with automatic monthly resets, real-time usage tracking, and quota enforcement.

## 📋 Setup Steps

### 1. Database Setup

Run the following SQL in your **Supabase SQL Editor**:

```sql
-- @token-meter - Token usage table for monthly tracking
CREATE TABLE IF NOT EXISTS token_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
);

-- @token-meter - Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_month_start ON token_usage(month_start);

-- @token-meter - Enable RLS for token_usage
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- @token-meter - Token usage policies
CREATE POLICY "Users can view own token usage" ON token_usage
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own token usage" ON token_usage
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- @token-meter - Grant permissions
GRANT ALL ON token_usage TO anon, authenticated;
```

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```bash
# Required for token meter
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for OpenRouter integration
OPENROUTER_API_KEY=your_openrouter_key
NEXT_PUBLIC_USE_OPENROUTER=true

# Required for Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 3. Install Dependencies

The following packages are already included:

```bash
npm install sonner date-fns  # Already installed ✅
```

## 🏗️ System Architecture

### Core Components

1. **server/lib/tokens.ts** - Core token utilities
   - `addTokens(userId, tokens)` - Add token usage
   - `getUsage(userId)` - Get current month usage  
   - `getCap(plan)` - Get quota limit
   - `checkQuota(userId, tokens, plan)` - Pre-request validation

2. **pages/api/tokens/current.ts** - REST endpoint for frontend
   - Returns `{ used, cap }` for authenticated users

3. **components/Sidebar/TokenGauge.tsx** - Usage display widget
   - Real-time progress bar with color coding
   - Toast warnings at 80% and 95%
   - Auto-refresh every 30 seconds

### Integration Points

- **server/api/chat.ts** - Quota validation before OpenRouter requests
- **components/Layout/Sidebar.tsx** - TokenGauge display
- **pages/_app.tsx** - Sonner Toaster for notifications

## 📊 Token Policy

| Plan | Monthly Limit | Features |
|------|--------------|----------|
| Free | 40,000 tokens/day | Basic models |
| Pro | 1,500,000 tokens/month | Advanced models |
| Max | 1,500,000 tokens/month | Premium models |

## 🎨 User Experience

### Visual Indicators
- **Green**: < 80% usage ✅
- **Yellow**: 80-95% usage ⚡
- **Red**: > 95% usage ⚠️

### Notifications
- **80% Warning**: "You've hit 80% of monthly tokens"
- **95% Alert**: "You've hit 95% of monthly tokens"
- **Quota Exceeded**: Chat requests blocked until next month

## 🔧 Customization

### Changing Quota Limits

Edit `server/lib/tokens.ts`:

```typescript
const CAP_PRO = 2_000_000;        // Change to 2M tokens
const CAP_FREE_DAILY = 50_000;    // Change to 50k daily
```

### Plan-Based Quotas

To implement plan detection, update the TODO in:
- `server/api/chat.ts` line 95
- `pages/api/tokens/current.ts` line 33

### Custom Warning Thresholds

Edit `components/Sidebar/TokenGauge.tsx`:

```typescript
if (percentage >= 90 && !hasShownWarning90) {  // 90% instead of 95%
  toast.error("You've hit 90% of monthly tokens");
}
```

## 🚀 Testing

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Token Usage**:
   - Make chat requests in the dashboard
   - Watch the TokenGauge update in real-time
   - Check Supabase `token_usage` table for data

3. **Test Quota Enforcement**:
   - Manually set `tokens_used` to near the limit in Supabase
   - Try making chat requests to see quota blocking

## 📈 Production Considerations

1. **Monthly Reset**: The system auto-resets on the 1st of each month
2. **Performance**: Indexes are optimized for user_id and month_start queries  
3. **Scalability**: Uses Supabase RLS for multi-tenant security
4. **Monitoring**: All quota violations are logged via console.error

## 🐛 Troubleshooting

### Common Issues

1. **TokenGauge not showing**:
   - Check Supabase connection
   - Verify user authentication
   - Check browser console for errors

2. **Quota not enforcing**:
   - Verify `token_usage` table exists
   - Check `server/api/chat.ts` integration
   - Ensure OpenRouter is enabled

3. **Toasts not appearing**:
   - Verify Sonner Toaster in `_app.tsx`
   - Check percentage calculations

### Debug Tools

```typescript
// In browser console
fetch('/api/tokens/current')
  .then(r => r.json())
  .then(console.log);
```

## ✅ Verification Checklist

- [ ] SQL table created in Supabase
- [ ] Environment variables configured
- [ ] TokenGauge visible in sidebar
- [ ] Usage updates after chat messages
- [ ] Warning toasts at 80% and 95%
- [ ] Quota blocking at 100%
- [ ] Monthly reset functionality tested

---

**🎉 Your token metering system is now fully operational!**

The system provides enterprise-grade quota management with a beautiful user experience. Users can monitor their usage in real-time and receive proactive warnings before hitting limits. 