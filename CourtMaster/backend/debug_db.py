import os
from sqlalchemy import create_engine
import sys

url = os.environ.get("DATABASE_URL")
print(f"Testing connection...")
if not url:
    print("DATABASE_URL not set")
    sys.exit(1)

try:
    engine = create_engine(url)
    conn = engine.connect()
    print("Connection Successful!")
    conn.close()
except Exception as e:
    print(f"Connection Failed: {e}")
    sys.exit(1)
