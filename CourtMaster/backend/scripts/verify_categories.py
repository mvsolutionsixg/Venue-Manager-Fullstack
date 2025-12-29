import sys
import os
import datetime

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import crud, models, schemas
from app.database import SessionLocal, engine

def verify_logic():
    print("Verifying Revenue Logic for Categories...")
    db = SessionLocal()
    try:
        # Create Dummy Data
        today = datetime.date.today()
        
        # 1. Booking (Paid) - 1 hour - 400 (default)
        b1 = schemas.BookingCreate(
            court_id=1,
            date=today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            customer_name="Test Booking",
            status="confirmed",
            category="booking"
        )
        
        # 2. Coaching (Free) - 1 hour - Should be 0
        b2 = schemas.BookingCreate(
            court_id=1,
            date=today,
            start_time=datetime.time(11, 0),
            end_time=datetime.time(12, 0),
            customer_name="Test Coaching",
            status="confirmed",
            category="coaching"
        )
        
        # 3. Event (Free) - 1 hour - Should be 0
        b3 = schemas.BookingCreate(
            court_id=1,
            date=today,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(13, 0),
            customer_name="Test Event",
            status="confirmed",
            category="event"
        )
        
        print("Creating bookings...")
        print("Creating bookings...")
        try:
             # Cleanup ALL bookings for today to avoid interference
             db.query(models.Booking).filter(models.Booking.date == today).delete(synchronize_session=False)
             db.commit()
             
             crud.create_booking(db, b1)
             crud.create_booking(db, b2)
             crud.create_booking(db, b3)
        except Exception as e:
            print(f"Error creating bookings: {e}")
            return

        # Calculate Expected Revenue
        # Assuming price is default 400 (or whatever is in settings)
        settings = db.query(models.Settings).first()
        price = settings.price_per_hour if settings else 400
        
        expected_revenue = price * 1 # Only b1 counts
        
        print(f"Price per hour: {price}")
        print(f"Expected Revenue: {expected_revenue}")

        # Get Stats
        stats = crud.get_dashboard_stats(db, period="today")
        actual_revenue = stats["revenue"]
        
        print(f"Actual Revenue: {actual_revenue}")
        
        if abs(actual_revenue - expected_revenue) < 1: # Floating point tolerance
            print("✅ SUCCESS: Revenue calculation is correct!")
        else:
            print(f"❌ FAILURE: Expected {expected_revenue}, got {actual_revenue}")
            
    finally:
        # Cleanup
        db.query(models.Booking).filter(models.Booking.customer_name.like("Test %")).delete(synchronize_session=False)
        db.commit()
        db.close()

if __name__ == "__main__":
    verify_logic()
