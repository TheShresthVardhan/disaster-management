from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import router as ai_router
from app.api.landslide import router as landslide_router

app = FastAPI(
    title="Disaster Intelligence API",
    description="AI-Powered Disaster Intelligence & Response System",
    version="0.6.0"
)

# CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI routes
app.include_router(ai_router)
# Include Landslide Risk routes
app.include_router(landslide_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}