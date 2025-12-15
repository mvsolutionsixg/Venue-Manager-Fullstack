from sqlalchemy import create_engine
import os

# IPv6 Address for db.dbocytqzhrxishvyynhy.supabase.co
DATABASE_URL = "postgresql://postgres:Br%401932002@[2406:da18:243:740c:dfa:5c6:b072:d72b]:5432/postgres"

print(f"Testing connection to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("Connection Successful!")
    connection.close()
except Exception as e:
    print(f"Connection Failed: {e}")
