from pydantic import BaseModel
from datetime import date

class HolidayBase(BaseModel):
    date: date

class HolidayCreate(HolidayBase):
    pass

CreateHoliday = HolidayCreate

class Holiday(HolidayBase):
    id: int

    class Config:
        orm_mode = True
