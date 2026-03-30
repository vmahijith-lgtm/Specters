import os
# Allow HTTP (non-HTTPS) for local dev OAuth flows. Remove in production.
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from scheduler import start_scheduler, shutdown_scheduler
from routers import jobs, signals, resume, outreach, pipeline, auth, hiring_managers

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()

app = FastAPI(title="HireSignal API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://hiresignal.vercel.app", 
        "https://hire-signal-web.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.(vercel\.app|up\.railway\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(jobs.router,     prefix="/jobs",     tags=["jobs"])
app.include_router(signals.router,  prefix="/signals",  tags=["signals"])
app.include_router(resume.router,   prefix="/resume",   tags=["resume"])
app.include_router(outreach.router, prefix="/outreach", tags=["outreach"])
app.include_router(pipeline.router, prefix="/pipeline", tags=["pipeline"])
app.include_router(hiring_managers.router, prefix="/hiring-managers", tags=["hiring-managers"])

@app.get("/health")
@app.head("/health")
async def health():
    return {"status": "ok"}
