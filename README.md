# Charity Slot

A multiplayer slot machine game where winners direct the entire pot to their chosen charity. Built with Next.js 14+, TypeScript, Tailwind CSS, Supabase, and Stripe.

**Marketing Website**: The landing page showcases live stats, recent winners, and drives users to sign up
**Game App**: Authenticated users can play the slot machine and make charitable impact

## Features

- 🎰 5x5 slot machine with wild symbols
- 💰 Real money gameplay via Stripe
- 🏥 Pre-selected charities for winnings
- 🔥 Live pot tracking
- 📊 Recent winners feed
- 🔐 Magic link authentication
- 📱 Responsive design
- 🎁 20 free credits for new users ($5 value)
- 📋 Guided onboarding flow

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Payments**: Stripe
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd charity-slot
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy your project URL and anon key
3. Go to SQL Editor and run the contents of `supabase-schema.sql`

### 3. Set Up Stripe (Coming Soon - Currently Disabled)

Credit purchases are temporarily disabled. When ready to enable:
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your publishable and secret keys from the Dashboard
3. Set up a webhook endpoint for `checkout.session.completed` events
4. Rename `.disabled` files back to `.ts` in `src/app/api/`

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qdiohylnhfvolnccoiqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Add all environment variables from `.env.local`
3. Deploy!

### 3. Update Environment Variables

After deployment, update these in your `.env.local` and Vercel:

- `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL
- `STRIPE_WEBHOOK_SECRET`: Create a new webhook endpoint in Stripe pointing to `your-domain.vercel.app/api/stripe/webhook`

### 4. Configure Supabase Auth

In your Supabase project:

1. Go to Authentication > URL Configuration
2. Add your Vercel domain to Redirect URLs: `https://your-domain.vercel.app/auth/callback`

## Game Rules

- Each credit costs $0.25
- Losing spins add (bet_size × $0.25) to the global pot
- Winning spin: entire pot goes to winner's charity
- Win conditions: 5 matching symbols in any row, column, or diagonal
- Wild symbols (🕉) substitute for any other symbol
- Symbols: ⭐️, 🔔, 🍇, 🍋, 7️⃣, 🕉 (wild)

## Database Schema

- **users**: Player profiles with credits and selected charity
- **charities**: Approved charities for donations
- **global_state**: Current pot amount
- **spins**: Game history
- **donations**: Charity donation records
- **credit_purchases**: Stripe payment records

## Security Features

- Row Level Security (RLS) policies
- Server-side game logic
- Atomic database operations
- Stripe webhook verification
- Rate limiting on API routes

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
