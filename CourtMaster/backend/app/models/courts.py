from sqlalchemy import Column, Integer, String, Boolean
from ..database import Base

class Court(Base):
    __tablename__ = "courts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    active = Column(Boolean, default=True)
