from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, bookings, reports, courts, settings as settings_router

app = FastAPI(title="Venue Manager API")

# Cors Root Fix
origins = [
    "http://localhost:5173",
    "http://localhost:5174",  # Fallback vite ports
    "http://localhost:3000",  # Common React port
    "https://venue-manager-fullstack.onrender.com",
    "https://venue-manager-fullstack.onrender.com/", # Trailing slash variant
    "https://venue-manager-frontend.onrender.com",
    "https://venue-manager-frontend.onrender.com/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers (no changes to routes themselves)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(courts.router, prefix="/courts", tags=["courts"])
app.include_router(settings_router.router, prefix="/settings", tags=["settings"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "CourtMaster API"}
