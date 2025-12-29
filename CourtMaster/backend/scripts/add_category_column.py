import sys
import os

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def add_category_column():
    print("Attempting to add 'category' column to 'bookings' table...")
    with engine.connect() as connection:
        try:
            # Check if column exists first (Postgres specific, but using soft try/catch for generic)
            # Actually, standard SQL ADD COLUMN IF NOT EXISTS is safest if supported, 
            # but standard SQLite/Postgres syntax differs slightly.
            # Let's try direct add and catch error if exists.
            
            # Using text() for raw SQL
            # Postgres/SQLite compatible for simple ADD COLUMN
            connection.execute(text("ALTER TABLE bookings ADD COLUMN category VARCHAR"))
            
            # Set default for existing rows
            connection.execute(text("UPDATE bookings SET category = 'booking' WHERE category IS NULL"))
            
            # Commit
            connection.commit()
            print("Successfully added 'category' column.")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print("Column 'category' already exists. Skipping.")
            else:
                print(f"Error adding column: {e}")
                # Depending on DB driver, commit might be needed even on fail or just pass
                
if __name__ == "__main__":
    add_category_column()
