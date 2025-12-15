from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from ..database import Base

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    mobile = Column(String, nullable=True)
    date = Column(Date, index=True)
    court_id = Column(Integer, ForeignKey("courts.id"))
    start_time = Column(Time)
    end_time = Column(Time)
    status = Column(String, default="booked")
