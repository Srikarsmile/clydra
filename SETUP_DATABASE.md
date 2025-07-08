# Database Setup Instructions

## Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Open your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Schema**
   - Copy the entire contents of `supabase/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Verify Setup**
   - Go to "Table Editor" in the sidebar
   - You should see all tables: users, threads, messages, etc.

## Option 2: Using the Setup Script

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

3. **Run setup script**
   ```bash
   node scripts/setup-database.js
   ```

## What Gets Created

### Core Tables
- **users** - User profiles from Clerk authentication
- **threads** - Chat conversation threads
- **messages** - Individual messages in threads
- **message_responses** - Model-specific response data

### Token Management
- **token_usage** - Monthly token consumption tracking
- **daily_tokens** - Daily token grants and limits
- **usage_meter** - General usage metrics

### API Management
- **api_keys** - Future API key management
- **api_requests** - API usage logging
- **chat_history** - Backup/export functionality

### Features Included

✅ **Row Level Security (RLS)** - Users can only access their own data  
✅ **Automatic Timestamps** - created_at/updated_at auto-managed  
✅ **Foreign Key Constraints** - Data integrity enforced  
✅ **Indexes** - Optimized for performance  
✅ **Functions** - Daily token management, thread updates  
✅ **Triggers** - Auto-update timestamps and thread activity  

## Testing the Setup

After setup, test with:

1. **Start your app**
   ```bash
   npm run dev
   ```

2. **Sign up/Login** - This creates your user record

3. **Start a chat** - This creates threads and messages

4. **Check the database** - Verify data appears in Supabase

## Troubleshooting

### Common Issues

1. **"relation does not exist" errors**
   - Re-run the schema SQL in Supabase dashboard
   - Check that all tables were created

2. **Permission denied errors**
   - Verify your service role key is correct
   - Check RLS policies are enabled

3. **Connection timeouts**
   - Check your Supabase URL and keys
   - Verify network connectivity

### Environment Variables

Make sure these are set correctly:
```env
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk authentication (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Database Schema Overview

```
users (UUID, clerk_id, email, plan...)
  ↓
threads (id, user_id, title, timestamps)
  ↓  
messages (id, thread_id, role, content, timestamp)
  ↓
message_responses (id, message_id, model, content, tokens)

token_usage (user_id, month, tokens_used)
daily_tokens (user_id, date, granted, remaining)
usage_meter (user_id, total_tokens, total_requests)
```

This schema supports:
- Multi-user chat with isolated data
- Thread-based conversations
- Token tracking and limits
- Model-specific responses
- Usage analytics
- Future API key management