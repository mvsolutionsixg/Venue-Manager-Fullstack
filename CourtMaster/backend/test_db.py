from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Testing connection to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("Connection Successful!")
    connection.close()
except Exception as e:
    print(f"Connection Failed: {e}")
