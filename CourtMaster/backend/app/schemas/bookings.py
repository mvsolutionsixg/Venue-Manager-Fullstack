from datetime import date, time
from typing import Optional
from pydantic import BaseModel, validator

class BookingBase(BaseModel):
    customer_name: str
    mobile: Optional[str] = None
    date: date
    court_id: int
    start_time: time
    end_time: time
    status: Optional[str] = "booked"
    category: Optional[str] = "booking"

class BookingCreate(BookingBase):
    @validator('start_time', 'end_time', pre=True)
    def parse_time(cls, v):
        if isinstance(v, str):
            # If string length is 5 (HH:MM), append :00
            if len(v) == 5:
                v = v + ":00"
            return time.fromisoformat(v)
        return v

CreateBooking = BookingCreate

class Booking(BookingBase):
    id: int

    class Config:
        orm_mode = True
