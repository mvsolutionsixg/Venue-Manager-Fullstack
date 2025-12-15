from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/holidays",
    tags=["holidays"],
)

@router.get("/", response_model=List[schemas.Holiday])
def read_holidays(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    holidays = db.query(models.Holiday).offset(skip).limit(limit).all()
    return holidays

@router.post("/", response_model=schemas.Holiday)
def create_holiday(holiday: schemas.HolidayCreate, db: Session = Depends(get_db)):
    db_holiday = models.Holiday(**holiday.dict())
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.delete("/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    db_holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(db_holiday)
    db.commit()
    return {"ok": True}
