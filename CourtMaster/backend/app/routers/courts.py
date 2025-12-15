from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/courts",
    tags=["courts"],
)

@router.get("/", response_model=List[schemas.Court])
def read_courts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Map DB 'active' to Schema 'is_active'
    # We can do this manually or let Pydantic handle it if mapped.
    # The Schema has from_attributes=True.
    # But field names differ: db.active vs schema.is_active.
    # We can alias it in the query or just construct the list.
    courts = db.query(models.Court).offset(skip).limit(limit).all()
    # Manual mapping to ensure correctness
    return [
        schemas.Court(id=c.id, name=c.name, is_active=c.active)
        for c in courts
    ]

@router.post("/", response_model=schemas.Court)
def create_court(court: schemas.CreateCourt, db: Session = Depends(get_db)):
    # Map Schema 'is_active' to DB 'active'
    db_court = models.Court(name=court.name, active=court.is_active)
    db.add(db_court)
    db.commit()
    db.refresh(db_court)
    # Map back
    return schemas.Court(id=db_court.id, name=db_court.name, is_active=db_court.active)

@router.put("/{court_id}", response_model=schemas.Court)
def update_court(court_id: int, court: schemas.CreateCourt, db: Session = Depends(get_db)):
    db_court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    db_court.name = court.name
    db_court.active = court.is_active
    
    db.commit()
    db.refresh(db_court)
    return schemas.Court(id=db_court.id, name=db_court.name, is_active=db_court.active)

@router.delete("/{court_id}")
def delete_court(court_id: int, db: Session = Depends(get_db)):
    db_court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    db.delete(db_court)
    db.commit()
    return {"ok": True}
