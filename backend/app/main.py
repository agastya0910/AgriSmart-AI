import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import database  # noqa: F401 (loads .env)
from app.database import init_db
from app.routes import auth_routes, crops, dashboard, monitoring, notifications, profile, recommendations, weather


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()                       # automatic database initialisation
    from app.ml.predict import ensure_model
    ensure_model()                  # trains the model on first start if it does not exist
    yield


app = FastAPI(title="AgriSmart AI API", version="1.0.0",
              description="AI-assisted smart agriculture monitoring and crop recommendation.", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for r in (auth_routes, monitoring, recommendations, crops, notifications, dashboard, profile, weather):
    app.include_router(r.router)


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok"}
