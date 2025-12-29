from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from .. import models, schemas, crud
from ..database import get_db

router = APIRouter(
    tags=["bookings"],
)

@router.get("/calendar")
def read_calendar_view(
    year: int,
    month: int,
    court_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Reuse crud logic or custom query
    # If filtering by court_id, we need a filtered versions of aggregation
    # For now, let's use the simple one and assume court_id logic can be added if needed
    
    # Determine full day range for month? 
    # Use crud.get_monthly_calendar logic
    return crud.get_monthly_calendar(db, year, month)

@router.get("/", response_model=List[schemas.Booking])
def read_bookings(
    skip: int = 0, 
    limit: int = 100, 
    date: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Use 'date' query param as requested in prompt, mapped to target_date in crud
    bookings = crud.get_bookings(db, skip=skip, limit=limit, target_date=date, search=search)
    return bookings

@router.post("/", response_model=schemas.Booking)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    # Check for holiday
    holiday = db.query(models.Holiday).filter(models.Holiday.date == booking.date).first()
    if holiday:
        raise HTTPException(status_code=400, detail="Cannot book on a holiday")

    try:
        return crud.create_booking(db=db, booking=booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{booking_id}", response_model=schemas.Booking)
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    db_booking = crud.delete_booking(db, booking_id)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return db_booking

@router.post("/bulk-delete")
def delete_bookings_bulk(
    period: str = Query(..., regex="^(weekly|monthly|yearly)$"),
    db: Session = Depends(get_db)
):
    try:
        count = crud.bulk_delete_bookings(db, period)
        if count == 0:
            return {"message": "No data available for selected period", "count": 0}
        return {"message": "Selected booking data deleted successfully", "count": count}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
