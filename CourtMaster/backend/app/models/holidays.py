from sqlalchemy import Column, Integer, Date
from ..database import Base

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
