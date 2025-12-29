from sqlalchemy import Column, Integer, Time
from ..database import Base

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    slot_duration = Column(Integer, default=60)
    open_time = Column(Time)
    close_time = Column(Time)
    price_per_hour = Column(Integer, default=400)
