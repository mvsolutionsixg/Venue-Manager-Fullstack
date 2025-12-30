import sys
import os
from datetime import date, time, timedelta

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app import models, crud

def setup_test_data(db):
    # Clear existing bookings first
    db.query(models.Booking).delete()
    db.commit()

    test_bookings = [
        # Year 2023
        models.Booking(customer_name="2023 Jan W1", date=date(2023, 1, 1), start_time=time(10, 0), end_time=time(11, 0), court_id=1, category="booking"),
        models.Booking(customer_name="2023 Jan W2", date=date(2023, 1, 8), start_time=time(10, 0), end_time=time(11, 0), court_id=1, category="coaching"),
        models.Booking(customer_name="2023 Feb", date=date(2023, 2, 1), start_time=time(10, 0), end_time=time(11, 0), court_id=1, category="event"),
        
        # Year 2024
        models.Booking(customer_name="2024 Jan", date=date(2024, 1, 1), start_time=time(10, 0), end_time=time(11, 0), court_id=1, category="booking"),
    ]
    db.add_all(test_bookings)
    db.commit()

def test_deletions():
    db = SessionLocal()
    try:
        print("--- Setting up test data ---")
        setup_test_data(db)
        
        # Test 1: Delete Weekly (2023, Jan, Week 1)
        print("\nTest 1: Delete Weekly (2023, Jan, Week 1)")
        count = crud.bulk_delete_bookings(db, period="weekly", year=2023, month=1, week=1)
        print(f"Deleted {count} records. Expected: 1")
        assert count == 1
        
        # Test 2: Delete Monthly (2023, Feb)
        print("\nTest 2: Delete Monthly (2023, Feb)")
        count = crud.bulk_delete_bookings(db, period="monthly", year=2023, month=2)
        print(f"Deleted {count} records. Expected: 1")
        assert count == 1
        
        # Test 3: Delete Yearly (2024)
        print("\nTest 3: Delete Yearly (2024)")
        count = crud.bulk_delete_bookings(db, period="yearly", year=2024)
        print(f"Deleted {count} records. Expected: 1")
        assert count == 1
        
        # Test 4: Remaining Check
        print("\nTest 4: Checking remaining data")
        remaining = db.query(models.Booking).all()
        print(f"Remaining records: {[r.customer_name for r in remaining]}. Expected: ['2023 Jan W2']")
        assert len(remaining) == 1
        assert remaining[0].customer_name == "2023 Jan W2"
        
        # Test 5: Empty delete
        print("\nTest 5: Empty delete (2025 Yearly)")
        count = crud.bulk_delete_bookings(db, period="yearly", year=2025)
        print(f"Deleted {count} records. Expected: 0")
        assert count == 0

        # Test 6: Years endpoint
        print("\nTest 6: Testing get_booking_years")
        years = crud.get_booking_years(db)
        print(f"Available years: {years}. Expected: [2023]")
        assert 2023 in years

        print("\n--- All Backend Tests Passed ---")

    finally:
        db.query(models.Booking).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    test_deletions()
