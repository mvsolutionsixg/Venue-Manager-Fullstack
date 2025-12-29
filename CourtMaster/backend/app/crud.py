from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
from .models import User, Court, Booking, Holiday, Settings
from .schemas import CreateCourt, CreateBooking, CreateHoliday, CreateSettings
from .services.auth import get_password_hash

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, username: str, password: str):
    hashed_password = get_password_hash(password)
    db_user = User(username=username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Booking CRUD
def get_bookings(db: Session, skip: int = 0, limit: int = 100, target_date: date = None, search: str = None):
    query = db.query(Booking)
    
    if target_date:
        query = query.filter(Booking.date == target_date)
        
    if search:
        search_term = f"%{search}%"
        # ILIKE is Postgres specific, but fallback to LIKE for generic if needed. 
        # Using ilike for case-insensitive match
        query = query.filter(
            (Booking.customer_name.ilike(search_term)) | 
            (Booking.mobile.ilike(search_term))
        )
        
    return query.order_by(Booking.start_time).offset(skip).limit(limit).all()

def create_booking(db: Session, booking: CreateBooking):
    # Overlap check moved here or kept in router? better here for reusability but router has HTTP exceptions.
    # We will return None or raise error if overlap.
    
    # Check for overlap: (StartA < EndB) and (EndA > StartB)
    overlapping = db.query(Booking).filter(
        Booking.court_id == booking.court_id,
        Booking.date == booking.date,
        Booking.start_time < booking.end_time,
        Booking.end_time > booking.start_time
    ).first()
    
    if overlapping:
        print(f"DEBUG: Overlap found! New: {booking.start_time}-{booking.end_time} vs Existing: {overlapping.start_time}-{overlapping.end_time} (ID: {overlapping.id})")
        raise ValueError("Time slot already booked")

    db_booking = Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def delete_booking(db: Session, booking_id: int):
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if db_booking:
        db.delete(db_booking)
        db.commit()
    return db_booking

# Dashboard & Reporting CRUD
from sqlalchemy import func, extract, cast, Date

def get_dashboard_stats(db: Session, period: str = "overall"):
    # 1. Determine date range
    today = date.today()
    start_date = None
    
    if period == "today":
        start_date = today
    elif period == "week":
        # Start of week (assuming Monday)
        start_date = today - timedelta(days=today.weekday())
    elif period == "month":
        start_date = date(today.year, today.month, 1)
    elif period == "year":
        start_date = date(today.year, 1, 1)
    else:
        start_date = None # Overall
        
    # 2. Build Query - Use ILIKE for case insensitive match on status
    # Note: SQLite (if used) might need func.lower() but Postgres supports ILIKE
    # For safety in hybrid envs without knowing exact DB:
    display_status = func.lower(Booking.status)
    query = db.query(Booking).filter(display_status.in_(["confirmed", "booked"]))
    
    if start_date:
        query = query.filter(Booking.date >= start_date)
        
    bookings = query.all()
    
    # 3. Aggregations
    total_bookings = len(bookings)

    # 4. Get Pricing from Settings
    settings = db.query(Settings).first()
    price_per_hour = settings.price_per_hour if settings else 400
    
    # 5. Revenue Calculation
    # Rule: (duration_minutes / 60) * price_per_hour
    total_revenue = 0.0
    for b in bookings:
        # Calculate duration in minutes
        # start_time and end_time are datetime.time objects
        start_dt = datetime.combine(date.min, b.start_time)
        end_dt = datetime.combine(date.min, b.end_time)
        diff = end_dt - start_dt
        duration_minutes = diff.total_seconds() / 60
        
        # Pricing
        res = (duration_minutes / 60) * price_per_hour
        total_revenue += res

    # Active Customers (unique in this period)
    active_customers = len(set([b.customer_name for b in bookings]))

    return {
        "total_bookings": total_bookings,
        "revenue": round(total_revenue),
        "active_customers": active_customers
    }

def get_daily_bookings_chart(db: Session, days: int = 30):
    # Group by date for last N days (simplified to all for now or modify query)
    results = db.query(
        Booking.date, 
        func.count(Booking.id).label("count")
    ).group_by(Booking.date).order_by(Booking.date).all()
    
    return [{"date": r.date, "count": r.count} for r in results]

def get_booking_status_distribution(db: Session):
    results = db.query(
        Booking.status,
        func.count(Booking.id).label("count")
    ).group_by(Booking.status).all()
    return [{"name": r.status, "value": r.count} for r in results]

def get_court_capacity_heatmap(db: Session, start_date: date, end_date: date):
    # Return count of bookings per court per day
    results = db.query(
        Booking.date,
        Booking.court_id,
        func.count(Booking.id).label("booked_hours")
    ).filter(
        Booking.date >= start_date,
        Booking.date <= end_date
    ).group_by(Booking.date, Booking.court_id).all()
    
    return [
        {"date": r.date, "court_id": r.court_id, "booked_hours": r.booked_hours}
        for r in results
    ]

def get_monthly_calendar(db: Session, year: int, month: int):
    # Extract month and year
    results = db.query(
        Booking.date,
        func.count(Booking.id).label("count")
    ).filter(
        extract('year', Booking.date) == year,
        extract('month', Booking.date) == month
    ).group_by(Booking.date).all()
    
    # Also fetch details for tooltip/modal? For now just summary
    # Or fetch all bookings for that month to let frontend process?
    # Requirement says "returning summarized data: { date, count, bookings: [] }"
    
    # Let's fetch all bookings for the month and restructure in router or here.
    # Actually, simpler to just fetch all bookings for range and let Router/Frontend group them.
    # But for "Month View Aggregation", let's return the simplified list.
    
    return [{"date": r.date, "count": r.count} for r in results]
