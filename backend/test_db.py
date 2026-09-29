import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine

def test_connection():
    load_dotenv()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Database connection successful! Result: {result.scalar()}")
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    test_connection()
