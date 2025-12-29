from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    tags=["settings"],
)

@router.get("/", response_model=schemas.Settings)
@router.get("", include_in_schema=False)
def read_settings(db: Session = Depends(get_db)):
    from datetime import time
    settings = db.query(models.Settings).first()
    if not settings:
        return schemas.Settings(
            id=0, 
            open_time=time(5, 0), 
            close_time=time(12, 0), 
            slot_duration=60,
            price_per_hour=400
        )
    return settings

@router.post("/", response_model=schemas.Settings)
def save_settings(settings: schemas.SettingsCreate, db: Session = Depends(get_db)):
    # Upsert logic: If exists, update. If not, create.
    db_settings = db.query(models.Settings).first()
    
    if db_settings:
        # Update existing
        for key, value in settings.dict().items():
            setattr(db_settings, key, value)
    else:
        # Create new ehioh
        db_settings = models.Settings(**settings.dict())
        db.add(db_settings)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings
