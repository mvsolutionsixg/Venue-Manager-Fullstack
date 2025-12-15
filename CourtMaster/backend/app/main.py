from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import auth, bookings, reports, courts, settings as settings_router
from .config import get_settings

# Create FastAPI app
app = FastAPI(title="Venue Manager API")

settings = get_settings()

# =========================
# CORS CONFIG (FIXED)
# =========================
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    settings.FRONTEND_URL,   # Render / production frontend
]

# TEMPORARY SAFE OPTION (recommended while deploying)
# This avoids all CORS headaches during setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔥 IMPORTANT
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROUTERS
# =========================
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(courts.router, prefix="/courts", tags=["courts"])
app.include_router(settings_router.router, prefix="/settings", tags=["settings"])

# =========================
# ROOT
# =========================
@app.get("/")
def read_root():
    return {"message": "CourtMaster API is running"}
