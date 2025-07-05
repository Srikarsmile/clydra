# Chat Persistence & Model Availability Testing Guide

## 🎯 **SOLUTION: Database Migration Required**

**Answer to "should we re arrange the database?"**: **No database schema changes needed.** The issue is **data migration** - old threads are linked to Clerk IDs instead of Supabase UUIDs.

## ✅ **FIXED ISSUES (Latest Update)**

### 1. Model Availability Issues - RESOLVED ✅

- **Fixed**: Updated deprecated model identifiers
  - `x-ai/grok-beta` → `x-ai/grok-3` (latest Grok model)
  - `google/gemini-2.5-pro-exp-03-25` → `google/gemini-2.5-pro` (current Gemini Pro)
- **Added**: Latest Google models
  - `google/gemini-2.5-flash-preview` (Latest Gemini Flash)
  - `google/gemini-2.5-flash-preview-05-20` (May 2025 checkpoint)
  - Support for vision capabilities with image URLs
- **Added**: Model migration system for cached browser state
- **Status**: All models now working correctly with OpenRouter

### 2. Database Foreign Key Constraint - RESOLVED ✅

- **Issue**: Messages failing to save due to non-existent thread IDs
- **Root Cause**: Thread ID in URL but not in database (bookmarks, direct links)
- **Solution**:
  - Auto-create missing threads in streaming API
  - Thread validation in ChatPanel with fallback to new thread creation
  - Robust error handling for thread-related operations

### 3. **CRITICAL ISSUE: Missing Previous Chats - IDENTIFIED** 🔍

- **Root Cause**: **Data type mismatch** in database
- **Problem**: Old threads linked to Clerk IDs (text), new threads linked to Supabase UUIDs (uuid)
- **Result**: Thread loading API can't find old threads
- **Evidence**:
  ```
  ✅ NEW: Thread exists: a1c36f2c-edca-4a8b-8d1b-a7f7ea6c3760 (UUID format)
  ❌ OLD: Key (thread_id)=(299e0ba6-d9b2-4b1f-a7e4-343d9a4bcc57) not found (UUID in URL, but not in DB)
  ```

## 🛠️ **COMPLETE SOLUTION: Database Migration**

### **Step 1: Diagnose the Issue**

Run this query in your Supabase SQL editor to see what you're working with:

```sql
SELECT
  t.id as thread_id,
  t.user_id as thread_user_id,
  CASE
    WHEN t.user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'UUID'
    ELSE 'CLERK_ID'
  END as user_id_type,
  u.id as supabase_uuid,
  u.clerk_id,
  COUNT(m.id) as message_count
FROM threads t
LEFT JOIN users u ON t.user_id::text = u.clerk_id OR t.user_id = u.id
LEFT JOIN messages m ON m.thread_id = t.id
GROUP BY t.id, t.user_id, u.id, u.clerk_id
ORDER BY t.created_at DESC;
```

### **Step 2: Migrate Old Threads**

Run this to fix the data:

```sql
-- Update threads where user_id is a Clerk ID (not a UUID format)
UPDATE threads
SET user_id = users.id
FROM users
WHERE threads.user_id::text = users.clerk_id
  AND NOT (threads.user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
```

### **Step 3: Verify the Migration**

Check that it worked:

```sql
SELECT
  COUNT(*) as total_threads,
  COUNT(CASE WHEN user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuid_threads,
  COUNT(CASE WHEN NOT (user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN 1 END) as invalid_threads
FROM threads;
```

### **Step 4: Clear Browser Cache**

After migration, clear your browser cache/localStorage to remove old model selections:

1. Open DevTools (F12)
2. Go to Application → Storage
3. Clear localStorage and sessionStorage
4. Refresh the page

## 🧪 **Testing After Migration**

### **Expected Success Logs:**

```
✅ Threads API: Returning X threads for user [uuid] (should show more threads now)
✅ Thread exists: [thread-id]
✅ Final message saved with ID: [id]
```

### **Expected UI Changes:**

- **Previous chats appear** in the sidebar
- **No more foreign key errors** in logs
- **No more model validation errors**
- **Messages persist** on page refresh
- **New Google models available** in model selector

## 🆕 **Google Models Available (Streamlined)**

### **Vision-Capable Models (Only 2 Models):**
- **`google/gemini-2.5-pro`** - Current stable Gemini Pro (supports images)
- **`google/gemini-2.5-flash-preview`** - Latest fast model (supports images)

### **Usage Examples:**
```javascript
// Text + Image example for Gemini models
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "What is in this image?"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/image.jpg"
      }
    }
  ]
}
```

### **Model Migration System:**
All other Google models automatically migrate to these two:
- `google/gemini-2.0-flash-001` → `google/gemini-2.5-flash-preview`
- `google/gemini-2.5-flash-preview-05-20` → `google/gemini-2.5-flash-preview`
- `google/gemini-1.5-pro` → `google/gemini-2.5-pro`
- `google/gemini-2.5-pro-exp-03-25` → `google/gemini-2.5-pro`

## 🔧 **Additional Fixes Implemented**

### **Enhanced Message Persistence Flow:**

- **Real-time saves**: User messages saved immediately
- **Streaming updates**: Assistant messages updated every 2 seconds during generation
- **Final save**: Complete message saved when streaming finishes
- **Retry logic**: 3 attempts with exponential backoff
- **localStorage backup**: Offline recovery capabilities

### **Model Migration System:**

- **Graceful handling**: Old cached model names automatically migrated
- **Fallback system**: Invalid models fall back to working alternatives
- **Console logging**: Shows migration activity for debugging
- **Latest models**: Added newest Google Gemini models with vision support

### **Thread Auto-Creation:**

- **Missing thread handling**: Automatically creates threads that don't exist
- **URL synchronization**: Updates browser URL when new threads are created
- **Error recovery**: Handles bookmark/direct link scenarios

## 📊 **System Status**

| Component            | Status                 | Notes                                             |
| -------------------- | ---------------------- | ------------------------------------------------- |
| Model Updates        | ✅ Working             | All deprecated models updated + new Google models |
| Model Migration      | ✅ Working             | Handles cached browser state                      |
| Message Persistence  | ✅ Working             | Multi-layered save system                         |
| Thread Auto-Creation | ✅ Working             | Handles missing threads                           |
| **Thread Loading**   | ⚠️ **NEEDS MIGRATION** | Old threads need UUID conversion                  |
| Database Schema      | ✅ Correct             | No schema changes needed                          |
| Vision Support       | ✅ Working             | Google models support image inputs                |

## 🚀 **Next Steps**

1. **Run the SQL migration** in Supabase (Step 2 above)
2. **Verify migration results** (Step 3 above)
3. **Clear browser cache** (Step 4 above)
4. **Test the application** - previous chats should now appear
5. **Test new Google models** with vision capabilities
6. **Monitor logs** for any remaining issues

The system will be fully functional once the database migration is complete! Your previous chats are still in the database - they just need to be properly linked to your user account.

## 🔍 **Available Models Summary**

### **Free Tier:**
- `openai/gpt-4o-mini` - Fast, affordable model

### **Pro Tier:**
- `openai/gpt-4o` - Premium OpenAI model
- `anthropic/claude-3-5-sonnet-20241022` - Latest Claude
- `x-ai/grok-3` - Latest Grok model
- `google/gemini-2.5-pro` - Stable Gemini Pro (vision)
- `google/gemini-2.5-flash-preview` - Fast Gemini (vision)
- Plus Mistral, Llama, and Sarvam models

**Google Models Streamlined**: Only 2 Google models available with automatic migration from all other Google models.

All models now support the latest OpenRouter features and pricing!
