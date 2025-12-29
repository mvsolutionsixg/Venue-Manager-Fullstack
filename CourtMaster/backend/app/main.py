from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .routers import auth, bookings, reports, courts, settings as settings_router
from .database import SessionLocal
from .models.user import User
from .services.auth import get_password_hash

from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database and Migrate
    db = SessionLocal()
    try:
        # 1. Seed Admin
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("Creating default admin user...")
            hashed = get_password_hash("admin123")
            user = User(username="admin", password_hash=hashed)
            db.add(user)
            db.commit()
            print("Admin user created.")
        
        # 2. Schema Migration (Auto-fix for missing column)
        try:
            # Check if column exists by trying to select it
            db.execute(text("SELECT price_per_hour FROM settings LIMIT 1"))
        except Exception:
            print("Column 'price_per_hour' missing in settings. Migrating...")
            db.rollback() # Reset transaction after error
            try:
                # Add the column
                db.execute(text("ALTER TABLE settings ADD COLUMN price_per_hour INTEGER DEFAULT 400"))
                db.commit()
                print("Migration successful: Added price_per_hour to settings.")
            except Exception as e:
                print(f"Migration failed: {e}")
                db.rollback()

    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        db.close()
    
    yield
    # Shutdown logic if needed

app = FastAPI(title="Venue Manager API", lifespan=lifespan)

import os

# Cors Root Fix
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://venue-manager-fullstack.onrender.com",
    "https://venue-manager-frontend.onrender.com",
]

# Add env allowed origins
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([origin.strip() for origin in env_origins.split(",")])    

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
