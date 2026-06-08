# Clienta Pulse - AI-Powered Music Discovery Platform

![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC)

A production-ready SaaS web application for music professionals to discover emerging artists, analyze growth potential, generate intelligence reports, and prepare personalized outreach.

## Features

- 🎵 **Artist Discovery** - Search and discover emerging artists from Spotify
- 🤖 **AI-Powered Analysis** - Generate detailed intelligence reports using OpenAI
- 📊 **Growth Analytics** - Analyze artist metrics and growth potential
- 💾 **Save & Organize** - Save promising artists for later review
- ✉️ **Outreach Templates** - Generate personalized outreach drafts for manual review
- 🔐 **Secure Authentication** - Supabase Auth with row-level security
- 📱 **Fully Responsive** - Mobile and desktop support
- ✨ **Premium UI** - Glassmorphism design with smooth animations

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Components**: shadcn/ui + Radix UI

### Backend
- **Runtime**: Next.js API Routes
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **AI**: OpenAI API (Claude 3.5 Sonnet)
- **External APIs**: Spotify Web API

### Deployment
- **Hosting**: Vercel
- **Database**: Supabase
- **CDN**: Vercel Edge Network

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Spotify Developer credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/ClientaPulse/clienta-pulse.git
cd clienta-pulse

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

Update `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-your-key

# Spotify
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the migrations from `docs/database-schema.sql`
4. Enable RLS policies

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
clienta-pulse/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard page
│   │   ├── discover/         # Artist discovery page
│   │   ├── report/[id]/      # Artist report page
│   │   ├── saved/            # Saved artists page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Sign up page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── nav/              # Navigation
│   │   ├── home/             # Home page sections
│   │   ├── dashboard/        # Dashboard components
│   │   ├── discover/         # Discover page components
│   │   └── report/           # Report page components
│   ├── lib/
│   │   ├── supabase.ts       # Supabase clients
│   │   ├── spotify.ts        # Spotify API integration
│   │   ├── openai.ts         # OpenAI integration
│   │   ├── validation.ts     # Zod schemas
│   │   └── utils.ts          # Utility functions
│   ├── hooks/
│   │   ├── use-auth.ts       # Auth hook
│   │   └── use-toast.ts      # Toast notifications
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── styles/
│       └── globals.css       # Global styles
├── public/                   # Static assets
├── docs/                     # Documentation
├── .env.local.example        # Example env variables
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## Pages & Features

### Landing Page (`/`)
- Hero section with call-to-action
- Feature showcase
- Footer with links

### Authentication
- **Sign Up** (`/signup`) - Create new account
- **Sign In** (`/login`) - User authentication

### Dashboard (`/dashboard`)
- Key metrics (artists analyzed, saved, reports)
- Recent activity feed
- Quick access to saved artists
- Pro tips and resources

### Discover (`/discover`)
- Search artists by name and genre
- Filter results
- Save artists for later
- View artist details

### Artist Report (`/report/[id]`)
- Detailed artist profile
- AI-generated lead score (0-100)
- Executive summary
- Strengths & weaknesses analysis
- Growth potential assessment
- Marketing opportunities
- Risk factors
- Personalized outreach draft
- Save/unsave functionality

### Saved Artists (`/saved`)
- View all saved artists
- Search and filter
- Quick access to reports
- Remove artists

## API Routes

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out

### Reports
- `POST /api/generate-report` - Generate AI report for artist

### Stats
- `GET /api/user-stats` - Get user statistics

## Database Schema

### profiles
```sql
- id (UUID, PK, FK to auth.users)
- email (TEXT, UNIQUE)
- name (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### artists
```sql
- id (UUID, PK)
- spotify_id (TEXT, UNIQUE)
- name (TEXT)
- image_url (TEXT)
- genre (TEXT)
- monthly_listeners (INTEGER)
- followers (INTEGER)
- popularity (INTEGER)
- created_at (TIMESTAMP)
```

### reports
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- artist_id (UUID, FK)
- report_json (JSONB)
- lead_score (INTEGER)
- created_at (TIMESTAMP)
```

### saved_artists
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- artist_id (UUID, FK)
- created_at (TIMESTAMP)
- UNIQUE(user_id, artist_id)
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Using Vercel CLI
npm install -g vercel
vercel
```

### Database Backups

Supabase automatically creates backups. Configure in your project settings.

## Security

- ✅ Input validation with Zod
- ✅ API route authentication checks
- ✅ Supabase Row-Level Security (RLS)
- ✅ Environment variables for secrets
- ✅ HTTPS only in production
- ✅ CORS protection

## Performance Optimizations

- Image optimization with Next.js Image
- Lazy loading for components
- Code splitting
- Caching strategies
- Optimized bundle size

## Error Handling

- Loading states on all pages
- Error boundary components
- Toast notifications for user feedback
- Retry logic for API calls
- Graceful error messages

## Future Enhancements

- [ ] Batch analysis capabilities
- [ ] Export reports to PDF
- [ ] Advanced filtering and sorting
- [ ] Team collaboration features
- [ ] Email notifications
- [ ] API webhooks
- [ ] Custom integrations
- [ ] Advanced analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@clientapulse.com or open an issue on GitHub.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Data from [Spotify Web API](https://developer.spotify.com/)
- AI powered by [OpenAI](https://openai.com/)
- Database by [Supabase](https://supabase.com/)

---

Made with ❤️ for music professionals
