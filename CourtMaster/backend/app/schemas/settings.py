from pydantic import BaseModel
from datetime import time

class SettingsBase(BaseModel):
    slot_duration: int
    open_time: time
    close_time: time
    price_per_hour: int = 400

class SettingsCreate(SettingsBase):
    pass

CreateSettings = SettingsCreate

class Settings(SettingsBase):
    id: int

    class Config:
        orm_mode = True
