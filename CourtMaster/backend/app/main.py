from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, bookings, reports, courts, settings as settings_router

app = FastAPI(title="Venue Manager API")

# Stable, explicit CORS (root fix)
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "https://venue-manager-fullstack.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
