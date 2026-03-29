# HireSignal 📡

Predictive job intelligence. Detect hiring signals 48-72 hours before listings go public and automate your application pipeline.

## System Architecture

HireSignal is a monorepo containing three layers:
1. **Frontend**: Next.js 14 web app and Expo / React Native mobile app.
2. **Backend**: FastAPI with automated Playwright scrapers and LLM pipelines (OpenAI/Anthropic/Gemini).
3. **Database**: Supabase (PostgreSQL) handling Auth, RLS, and data.

## Features
- 💰 **Signal Detection Engine**: Scrapes funding rounds, headcount growth, GitHub spikes before jobs exist.
- 🎯 **AI Resume Tailoring**: Rewrite resumes automatically to match specific job descriptions using LLMs.
- ✉️ **Outreach Generator**: Generates concise, personalised LinkedIn DMs to hiring managers based on your top achievements.
- 🔀 **Pipeline Management**: Kanban-style board to track applications from 'Saved' to 'Offer'.
- 📱 **Cross-Platform**: Full Next.js Web Dashboard + React Native Mobile App.

## Local Development

### 1. Database Setup
1. Create a [Supabase](https://supabase.com/) project.
2. Run the `supabase_schema.sql` file in the SQL Editor to generate the schema, RLS policies, and triggers.

### 2. Environment Variables
Copy `.env.example` to `.env` in the root and fill in the values:
```bash
cp .env.example .env
```
- Include Supabase credentials.
- Add Google OAuth credentials for Drive integration.
- Add Resend API key for daily digests.
- Configure Cron secret for secure scheduler endpoints.

### 3. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload
```

### 4. Web Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```

### 5. Mobile App (Expo)
```bash
cd apps/mobile
npm install
npx expo start
```

## Production Deployment
- **Web**: Deploy `apps/web` to Vercel. Add environment variables.
- **Backend**: Deploy `backend` to Railway/Render (using Dockerfile or standard Python environment). Schedule `scheduler.py` cron jobs using external pingers (or built-in apscheduler if persistent).
- **Mobile**: Use EAS build (`eas build -p all`) for iOS and Android deployment.

## Tech Stack
- **Web**: Next.js App Router, TailwindCSS, React, Supabase Auth.
- **Mobile**: Expo, React Native, React Navigation.
- **Backend / Workers**: Python, FastAPI, Playwright (async), APScheduler, httpx, Beautifulsoup4, Google API client.
- **AI**: OpenAI, Anthropic, Google Generative AI SDKs.
- **Database**: PostgreSQL (Supabase) + Prisma/SQL.
