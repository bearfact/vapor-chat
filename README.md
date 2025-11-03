# VaporChat

Private. Ephemeral. Secure.

VaporChat is a real-time chat application built for VaporWatch that provides private, ephemeral chat rooms that disappear without a trace. No accounts required, no permanent history.

## Features

- Create or join private chat rooms with password protection
- Real-time messaging with live updates
- Choose your display name per session
- Clear chat history at any time
- All messages automatically deleted when users leave the room
- Mobile-responsive design
- VaporWatch visual identity with high-contrast, neon aesthetics

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL with real-time subscriptions)
- **Deployment:** Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from Project Settings > API

3. Configure environment variables:
   - Copy `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

Run the SQL schema in your Supabase SQL editor to create the necessary tables:

```sql
-- See supabase-schema.sql for complete schema
```

The schema includes:
- `rooms` table for chat room metadata
- `messages` table for chat messages
- Row Level Security policies for public access
- Real-time subscription configuration

## Project Structure

```
vapor-chat/
├── app/
│   ├── layout.tsx          # Root layout with navbar and footer
│   ├── page.tsx            # Home page (create/join room)
│   └── room/[id]/
│       └── page.tsx        # Chat room interface
├── components/
│   ├── Navbar.tsx          # Shared navigation component
│   └── Footer.tsx          # Shared footer component
├── lib/
│   └── supabase.ts         # Supabase client configuration
└── public/                 # Static assets
```

## Design System

The application follows the VaporWatch visual identity:

- **Typography:** Inter font family with tight tracking
- **Colors:**
  - Background: Off-black (#0D0D0D)
  - Accents: Electric magenta (#FF1FF0), Acid lime (#C4FF1A), Cyan (#00FFFF), Orange (#FF4D00)
- **Aesthetic:** High-contrast, "controlled explosion" with tension and release in layouts

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vapor-chat)

Or manually:

```bash
npm run build
```

Make sure to add your environment variables in the Vercel dashboard.

## Security Notes

- Room passwords are stored in plain text (suitable for ephemeral rooms, but consider hashing for production)
- All users have equal permissions in a room (anyone can clear history or leave)
- No authentication system - privacy through obscurity
- Messages are permanently deleted when rooms are destroyed

## License

MIT

---

Built with VaporWatch's "Make Them Say Whoa" philosophy.
