<div align="center">

# 🍽️ GourmetQR

**The smart digital menu platform for restaurants, cafes, bars, and hotels.**

Turn a PDF menu into an interactive, AI-powered experience — QR-code ordering, instant translations, and appetizing AI-generated descriptions and photos.

</div>

---

## ✨ Features

- **Digital menu builder** — organize categories and items, toggle availability, and manage pricing from a clean admin dashboard.
- **AI content generation** (powered by Google Gemini) — generate mouth-watering descriptions, photorealistic dish photos, and marketing copy in one click.
- **Menu photo import** — snap a photo of an existing paper menu and let AI extract categories, items, prices, and dietary tags automatically.
- **Instant translation** — translate your entire menu into 30+ languages so every guest feels at home.
- **QR code menus** — generate a QR code once, then update your menu anytime without reprinting anything.
- **In-menu guest actions** — let diners call a waiter, request the bill, ask for water, leave feedback, or submit their email for promotions, right from their phone.
- **Multiple themes** — Modern, Classic, Dark, and Minimal templates to match your venue's brand.
- **Insights dashboard** — track menu views, popular items, leads, and guest feedback.

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Routing | React Router |
| Data fetching | TanStack Query |
| Backend | Supabase (Postgres, Auth, Storage, Row Level Security) |
| AI | Google Gemini API |
| Hosting | Vercel |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A free [Supabase](https://supabase.com/) project
- A [Google Gemini API key](https://ai.google.dev/)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql) once — this creates every table, security policy, and storage bucket the app needs.
3. Copy your **Project URL** and **anon public key** from *Project Settings → API*.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Where it's used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Client | Safe to expose in the browser |
| `VITE_SUPABASE_ANON_KEY` | Client | Safe to expose — protected by Row Level Security |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Never** prefix with `VITE_` — must never reach the browser |
| `GEMINI_API_KEY` | Server only | **Never** prefix with `VITE_` — used only by serverless AI functions |

### 4. Run the app

```bash
npm run dev
```

The app runs at `http://localhost:3000`. AI features additionally require running through `vercel dev` (rather than plain `vite dev`) so the serverless `/api/*` functions used to proxy Gemini requests are available locally.

## 📁 Project Structure

```
menuapp/
├── components/
│   ├── admin/       # Admin dashboard, QR modal, super-admin panel
│   ├── auth/        # Login, register, social auth
│   ├── public/      # Public-facing menu (what diners see)
│   └── ui/          # Shared UI primitives (icons, toasts)
├── services/        # Supabase client, data access, Gemini AI service
├── api/             # Vercel serverless functions (AI proxy)
├── supabase/        # Database schema and seed scripts
├── types.ts         # Shared TypeScript types
└── App.tsx          # Root component and route table
```

## 🗺️ Status

This project is under active development as it moves from prototype to production. See open issues and the project board for what's in progress.

## 📄 License

Private project — all rights reserved.
