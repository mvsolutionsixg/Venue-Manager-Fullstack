from pydantic import BaseModel

class CreateCourt(BaseModel):
    name: str
    is_active: bool = True

class Court(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True
