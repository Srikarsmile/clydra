# Clydra

**Advanced AI Chat Platform**

Clydra provides cutting-edge conversational AI through an intuitive web interface, featuring multiple premium AI models and intelligent token management.

## ✨ Features

- **Multi-Model Chat**: Access GPT-4o, Claude Sonnet, Gemini Pro, and more through one interface
- **Real-time Streaming**: Natural, conversational interactions with live response streaming  
- **Smart Token Management**: Monthly quota system with real-time usage tracking and warnings
- **Thread Management**: Organize conversations with persistent chat history
- **Premium UI**: Beautiful glassmorphism design with smooth animations

## 🚀 Live Demo

Visit [your-domain.com](https://your-domain.com) to try Clydra.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenRouter (GPT-4o, Claude, Gemini, etc.)
- **Deployment**: Vercel

## �� Available Models

The application supports multiple AI models through OpenRouter integration:

### Pro Plan Models
- **GPT-4o** - OpenAI's latest flagship model
- **Claude 4 Sonnet** - Anthropic's balanced model  
- **Grok-3 Beta** - xAI's latest experimental model with enhanced capabilities
- **Gemini 2.5 Pro** - Google's advanced multimodal model

### Free Plan Models  
- **Gemini 2.5 Flash** - Google's fast and efficient model

### Model Integration

The application uses OpenRouter API with the following configuration for all models including Grok-3 Beta:

```typescript
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL,
    "X-Title": "Rivo Chat",
  },
});

// Example request to Grok-3 Beta
const completion = await openai.chat.completions.create({
  model: "x-ai/grok-3-beta",
  messages: [
    {
      role: "user", 
      content: "What is the meaning of life?"
    }
  ],
  temperature: 0.7,
  max_tokens: 4000,
  top_p: 0.95,
  frequency_penalty: 0,
  presence_penalty: 0,
});
```

### Model Features

- **Smart Model Switching**: Switch between models mid-conversation with context preservation options
- **Retry with Different Models**: Hover over AI responses to retry with alternative models
- **Web Search Support**: Available for all Pro plan models including Grok-3 Beta
- **Token Optimization**: Intelligent token usage tracking and optimization

## 💡 Smart Usage Tracking

- **Real-time Monitoring**: Live token usage display in sidebar
- **Proactive Warnings**: Notifications at 80% and 95% usage
- **Monthly Quotas**: Automatic reset on the 1st of each month
- **Color-coded Progress**: Green → Yellow → Red visual indicators

## 🔒 Security & Privacy

- **Secure Authentication**: Enterprise-grade user management with Clerk
- **Data Protection**: All conversations are encrypted and secured
- **Row-level Security**: Database access control with Supabase RLS

## 📞 Support

- **Email**: support@clydra.com
- **Documentation**: Built-in usage tracking and clear UI

---

**Built with ❤️ for conversational AI**
