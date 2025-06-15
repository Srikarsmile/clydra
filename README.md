# Rivo Labs

**Professional AI Content Generation Platform**

Rivo Labs provides cutting-edge AI services for content creation, including high-quality image generation, video creation, and image enhancement through an intuitive web interface.

## ✨ Features

- **AI Image Generation**: Create stunning images from text descriptions using Google's Imagen4
- **AI Video Creation**: Generate professional videos with custom settings using Kling Video 2.0
- **Credit-Based System**: Transparent, pay-per-use pricing model
- **User Dashboard**: Track usage, manage credits, and view generation history
- **Real-time Processing**: Live status updates during content generation

## 🚀 Live Demo

Visit [your-domain.com](https://your-domain.com) to try Rivo Labs.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI Services**: Fal.AI (Imagen4, Kling Video)
- **Deployment**: Vercel

## 📖 API Usage

### Authentication

All API requests require authentication via Clerk session tokens.

### Generate Content

```bash
POST /api/v1/generate
Content-Type: application/json

{
  "model": "fal-ai/imagen4/preview",
  "prompt": "A beautiful sunset over mountains",
  "settings": {
    "width": 1024,
    "height": 1024
  }
}
```

### Available Models

- **Image Generation**: `fal-ai/imagen4/preview` - $0.10 per image
- **Video Creation**: `fal-ai/kling-video/v2/master/text-to-video` - $1.40 per 5s, $2.80 per 10s

## 💳 Pricing

- **Images**: $0.10 per generation
- **Videos**: $0.28 per second (5s minimum)
- **Credits**: Purchase in packages starting from $5

## 🔒 Security & Privacy

- **Secure Authentication**: Enterprise-grade user management
- **Data Protection**: All user data is encrypted and secured
- **Content Rights**: Users retain full rights to generated content

## 📞 Support

- **Email**: support@rivolabs.com
- **Documentation**: [docs.rivolabs.com](https://docs.rivolabs.com)

---

**Built with ❤️ by the Rivo Labs team**
