from pydantic import BaseModel
from datetime import time

class SettingsBase(BaseModel):
    slot_duration: int
    open_time: time
    close_time: time

class SettingsCreate(SettingsBase):
    pass

CreateSettings = SettingsCreate

class Settings(SettingsBase):
    id: int

    class Config:
        orm_mode = True
