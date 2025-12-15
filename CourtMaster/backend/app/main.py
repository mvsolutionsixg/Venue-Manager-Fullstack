from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, bookings, reports
# Import other routers if they exist and are compatible, otherwise comment out until fixed
from .routers import courts, settings, holidays, bookings  

# Create all tables (will create 'users' if not exists)
#Base.metadata.create_all(bind=engine)

app = FastAPI(title="Venue Manager API")

from .config import get_settings

app_settings = get_settings()

# Fix CORS to allow Frontend
origins = [
    app_settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(bookings.router) # Prefix handled in router
app.include_router(reports.router)
app.include_router(courts.router) 
app.include_router(settings.router) 
# app.include_router(holidays.router, prefix="/holidays", tags=["holidays"])
# app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])

@app.get("/")
def read_root():
    return {"message": "CourtMaster API is running"}
