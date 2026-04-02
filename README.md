# Specters

Specters is a proactive job-seeking platform designed to find top jobs *before* they are officially posted. By scanning early social and business signals—like TechCrunch funding rounds, GitHub open-source spikes, or leadership changes—Specters identifies expanding companies so you can reach out to Hiring Managers ahead of the competition.

## 🏗 Architecture
This project is built as a complete monorepo, containing:
- **Backend (`/backend`)**: A robust Python/FastAPI service operating background workers, Playwright web-scrapers, automated outreach LLM integrations (OpenAI, Anthropic, Gemini), and the Signal Radar engine.
- **Web App (`/apps/web`)**: A modern Next.js React frontend that provides the User Dashboard, Job Pipeline management, Settings, and Radar view.
- **Mobile App (`/apps/mobile`)**: A React Native (Expo) companion app for mobile push notifications and on-the-go pipeline tracking.

## ✨ Core Features
1. **Radar (Signal Detection)**: Finds companies with positive predictive hiring signals (e.g., fast headcount growth, new funding, unusual open-source activity).
2. **Daily Job Hunt (Scraper)**: Automatically runs scheduled, tailored daily searches across LinkedIn jobs using headless Playwright to fetch roles that match your target criteria.
3. **Application Pipeline**: Tracks the jobs you save and automatically generates highly-tailored resume variants synced directly to your Google Drive via OAuth.
4. **Outreach Generator**: Uses context-aware LLMs to draft personalized connection request messages for Hiring Managers or Recruiters.

---

## 🚀 Deployment (Render + Vercel)

This repository is ready to be connected to GitHub and deployed directly across modern cloud platforms.

### **Backend (Render)**
The backend is completely containerized via `render.yaml`. 
1. Create a new **Web Service** on [Render](https://render.com/).
2. Select your GitHub repository.
3. Render will automatically detect the `render.yaml` file in the root. This configuration provisions:
   - Python 3.11 environment.
   - Installs all dependencies via `backend/render-build.sh`.
   - Downloads necessary Playwright Chromium binaries.
   - Starts the Uvicorn web server.
4. Provide the following **Environment Variables** in Render's dashboard:
   - `SUPABASE_URL`: Your Supabase generic URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase admin key (required for automated scraper inserts).
   - Additional LLM API Keys as needed.

### **Frontend Web (Vercel)**
1. Connect the repository to [Vercel](https://vercel.com/).
2. Set the **Framework Preset** to Next.js.
3. Set the **Root Directory** to `apps/web`.
4. Provide standard Next.js environment variables (like `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
5. Deploy!

### **Database (Supabase)**
All schemas, row-level security policies, and constraints are located in `supabase_schema.sql`. You can initialize or update any newly provisioned Supabase Postgres database simply by running this SQL file via the Supabase SQL Editor.

---

## 🛠 Local Development Setup

### Prerequisites
- Node.js 18+ (for Web/Mobile)
- Python 3.10+ (for Backend)
- PostgreSQL (via Supabase platform natively or locally)

### 1. Database
1. Run the script `supabase_schema.sql` in your Supabase SQL interface.

### 2. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```
*Copy `.env.example` to `.env` and fill in necessary keys.*
```bash
uvicorn main:app --reload
```

### 3. Frontend Web
```bash
cd apps/web
npm install
npm run dev
```

## 📝 Troubleshooting & Notes
- **Testing the Scraper Locally:** You can invoke an immediate Playwright scrape by activating the python virtual environment and running `python backend/test_scraper.py`.
- **Database Idempotency:** The `supabase_schema.sql` file is specifically designed to be idempotent. Running it sequentially will intelligently skip resources that already exist while creating missing tables, indices, and constraints.
