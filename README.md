# EquiPay

**Track, split, and settle — the equitable way.**

> 🌐 Live at [equi-pay.me](https://equi-pay.me)

---

## What is EquiPay?

EquiPay is a full-stack expense-splitting web app that helps friends, roommates, and teams track shared costs, split bills, and settle debts without the awkwardness. Built with a modern React/Next.js stack and backed by a real-time database.

---

## Features

- **Individual & Group Expenses** — Track 1-on-1 bills or create groups for trips, roommates, and events
- **Flexible Split Modes** — Equal, percentage, or exact-amount splits with a live waterfall auto-balancer
- **Settlements** — Record payments and clear balances; supports both personal and group settlements
- **Dashboard** — Overview of what you owe and what you're owed, with a monthly bar chart
- **Balance Details** — Per-person and per-group net balances updated in real time
- **Expense Analytics** — Monthly spending breakdown by category
- **Payment Reminders** — Automated daily email reminders for outstanding debts (via Inngest cron)
- **AI Spending Insights** — Monthly personalised financial analysis emails powered by Gemini 2.5 Flash
- **Dark Mode** — Full light/dark theme support with system preference detection
- **Authentication** — Clerk-powered sign-in/sign-up with Google and other providers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Database | Convex (real-time, serverless) |
| Auth | Clerk |
| Charts | Recharts |
| Background Jobs | Inngest (cron functions) |
| Email | Resend |
| AI | Google Gemini 2.5 Flash |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
equipay/
├── app/
│   ├── (auth)/           # Sign-in / Sign-up pages (Clerk)
│   ├── (main)/
│   │   ├── dashboard/    # Overview, balance cards, expense chart
│   │   ├── contacts/     # People and groups list
│   │   ├── groups/[id]/  # Group expense & settlement view
│   │   └── person/[id]/  # 1-on-1 expense & settlement view
│   ├── expenses/new/     # Add expense form (individual or group)
│   ├── settlements/      # Record a settlement
│   └── api/inngest/      # Inngest webhook endpoint
├── convex/               # Database schema, queries, mutations, actions
├── components/           # Shared UI components
├── hooks/                # useConvexQuery, useConvexMutation, useStoreUser
└── lib/
    ├── inngest/          # payment-reminders.js, spending-insights.js
    ├── expense-categories.js
    └── utils.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account
- A [Resend](https://resend.com) account (for emails)
- A [Google AI Studio](https://aistudio.google.com) API key (for insights)
- An [Inngest](https://inngest.com) account (for cron jobs)

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=

# Resend
RESEND_API_KEY=

# Google Gemini
GEMINI_API_KEY=
```

### Installation

```bash
# Install dependencies
npm install

# Start the Convex dev server (separate terminal)
npx convex dev

# Start the Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed the Database (Optional)

To populate dummy data for testing, run this once from the Convex dashboard or CLI:

```bash
npx convex run seed:seedDatabase
```

---

## Automated Jobs

Two Inngest functions run on a schedule:

- **Payment Reminders** — Runs daily at 10:00 AM. Emails every user who has outstanding 1-on-1 debts.
- **Spending Insights** — Runs on the 1st of each month at 8:00 AM. Uses Gemini to generate and email a personalised monthly spending analysis.

To test these locally, start the Inngest dev server alongside the app:

```bash
npx inngest-cli@latest dev
```

---

Made with ❤️ by [Koushik Chennupati](https://github.com/koushik-267)