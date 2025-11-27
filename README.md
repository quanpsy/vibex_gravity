# vibeX - Campus Social App 🎉

A location-based social platform for campus life, built with React, TypeScript, Supabase, and Leaflet maps.

## 🚀 Live Demo

[Coming Soon - Deploy to Vercel]

## Features

- 🗺️ **Interactive Campus Map** - Real-time location-based sessions
- 🎯 **Four Session Types**:
  - **Vibes** - Casual hangouts
  - **Help** - Academic assistance (seeking/offering)
  - **Cookie** - Skill-sharing sessions with vouch system
  - **Query** - Quick borrowed item requests
- 👥 **Social Features** - Friends, custom tags, direct messaging
- 🔔 **Real-time Notifications** - Supabase Realtime integration
- 🍪 **Cookie Score System** - F1-style vouch points (10, 7, 5, 2, 1)
- 🎨 **Modern UI** - Clean, responsive design

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Maps**: Leaflet + React-Leaflet
- **Build Tool**: Vite
- **Deployment**: Vercel
- **Styling**: CSS with CSS Variables

## 📋 Prerequisites

- Node.js 18+ (for local development)
- Supabase account
- Vercel account (for deployment)

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/quanpsy/vibex_gravity.git
cd vibex_gravity
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Supabase Database

1. Go to your Supabase project at: **https://pnfxxaryrtpxtmoeujqo.supabase.co**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy the contents of `FRESH_DATABASE_SCHEMA.sql`
5. Paste and click **"Run"**
6. Wait for **"Success"** message
7. Your database is ready! ✅

**Note:** The schema has been updated to match the frontend code perfectly.

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 🌐 Deploy to Vercel

### Quick Deploy (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Sign in with GitHub
4. Click "New Project"
5. Import your `vibex_gravity` repository
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Deploy"
8. Done! You'll get a live URL in ~2 minutes

### Manual Deploy

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📁 Project Structure

```
vibex_gravity/
├── components/          # React components
│   ├── auth/           # Login/signup
│   ├── layout/         # Header, navbar
│   ├── pages/          # Main app pages
│   ├── sessions/       # Session-related components
│   ├── social/         # Friends, tags
│   ├── map/            # Map components
│   └── ...
├── lib/                # Utilities and services
│   ├── supabaseClient.ts      # Supabase configuration
│   ├── supabaseService.ts     # Database operations
│   ├── profanityFilter.ts     # Content moderation
│   ├── sessionLimits.ts       # Business logic
│   └── ...
├── styles/             # CSS files
├── App.tsx             # Main app component
├── MainApp.tsx         # Authenticated app
├── types.ts            # TypeScript definitions
├── index.tsx           # Entry point
└── FRESH_DATABASE_SCHEMA.sql  # Database schema

## 🎯 Key Features Explained

### Session Types

1. **Vibe** - Casual meetups (1 active max)
2. **Help** - Academic help (seeking or offering, 1 active max)
3. **Cookie** - Skill exchange with vouch system (1 active max)
4. **Query** - Item borrowing (up to 4: 2 seeking + 2 offering)

### Cookie Score System

- Diminishing returns: First vouch = 10 points, decreases to minimum 2
- Max 5 vouches per voucher-receiver pair per skill
- F1-style scoring system
- Skills tracked separately in `skill_scores` JSONB

### Privacy Levels

- **Public** - Visible to everyone
- **Private** - Visible only to tagged friends
- **Friends** - (Reserved for future use)

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- PKCE auth flow for enhanced security
- Environment variables for sensitive data
- Profanity filtering on user-generated content

## 📝 Environment Variables

Required variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 🐛 Known Issues & TODOs

- [ ] Session participants table migration needed (currently using arrays)
- [ ] Extend session duration feature
- [ ] Recent emojis feature
- [ ] User gender filter implementation
- [ ] Unread message count
- [ ] Push notifications

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🙏 Acknowledgments

- Built during campus life at IIT Gandhinagar
- Inspired by the need for better campus social coordination
- Thanks to Supabase for the amazing backend platform

## 📞 Contact

For questions or feedback, reach out via GitHub issues.

---

**Made with ❤️ for campus communities**
```
