from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, bookings, reports, courts, settings
# from .routers import holidays  # enable later if needed

# Load settings
app_settings = get_settings()

app = FastAPI(title="Venue Manager API")

# =========================
# CORS CONFIGURATION
# =========================

origins = [
    app_settings.FRONTEND_URL,          # production frontend (from env)
    "http://localhost:5173",             # local Vite
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
]

# Fallback: if FRONTEND_URL is not set, allow all (safe for now)
if not app_settings.FRONTEND_URL:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROUTERS
# =========================

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(bookings.router, tags=["bookings"])
app.include_router(reports.router, tags=["reports"])
app.include_router(courts.router, tags=["courts"])
app.include_router(settings.router, tags=["settings"])
# app.include_router(holidays.router, prefix="/holidays", tags=["holidays"])

# =========================
# HEALTH CHECK
# =========================

@app.get("/")
def read_root():
    return {"message": "CourtMaster API is running"}
