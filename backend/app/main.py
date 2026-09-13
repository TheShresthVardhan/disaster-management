from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.ai import router as ai_router
from app.api.landslide import router as landslide_router
from app.api.optimize import router as optimize_router

app = FastAPI(
    title="Disaster Intelligence API",
    description="AI-Powered Disaster Intelligence & Response System",
    version="0.6.0"
)

# CORS for frontend integration (local + deployed frontends).
# Override/extend via env: CORS_ORIGINS="https://a.vercel.app,https://b.vercel.app"
# or FRONTEND_URL="https://your-app.vercel.app".
_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_extra_origins = [
    o.strip().rstrip("/")
    for o in os.getenv("CORS_ORIGINS", "").split(",")
    if o.strip()
]
_frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if _frontend_url:
    _extra_origins.append(_frontend_url)
allow_origins = _default_origins + [o for o in _extra_origins if o not in _default_origins]
# Allow any Vercel preview/production deployment by default (safe for hackathon prototype;
# restrict in production via CORS_ORIGINS).
allow_origin_regex = r"https://.*\.vercel\.app"

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI routes
app.include_router(ai_router)
# Include Landslide Risk routes
app.include_router(landslide_router)
# Include Demo Resource Optimization routes
app.include_router(optimize_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}