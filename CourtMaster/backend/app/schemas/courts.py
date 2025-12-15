from pydantic import BaseModel
from typing import Optional

class CourtBase(BaseModel):
    name: str
    active: Optional[bool] = True

class CourtCreate(CourtBase):
    pass

class Court(CourtBase):
    id: int

    class Config:
        orm_mode = True
