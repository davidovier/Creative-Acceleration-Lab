"""
Supabase Database Connection Module
Provides connection pooling and query execution for the Creative Acceleration Lab
"""

import os
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseConnection:
    """
    Manages database connections to Supabase using the session pooler
    """

    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        self.supabase_url = os.getenv('SUPABASE_URL')
        self._connection = None

        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable not set. Check your .env file.")

    def get_connection_string(self) -> str:
        """Returns the pooled connection string"""
        return self.database_url

    def connect_with_psycopg2(self):
        """
        Create a connection using psycopg2

        Usage:
            db = DatabaseConnection()
            conn = db.connect_with_psycopg2()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM your_table")
            results = cursor.fetchall()
            cursor.close()
            conn.close()
        """
        try:
            import psycopg2
            conn = psycopg2.connect(self.database_url)
            return conn
        except ImportError:
            raise ImportError("psycopg2 not installed. Run: pip install psycopg2-binary")
        except Exception as e:
            raise ConnectionError(f"Failed to connect to database: {e}")

    def connect_with_sqlalchemy(self):
        """
        Create a SQLAlchemy engine

        Usage:
            db = DatabaseConnection()
            engine = db.connect_with_sqlalchemy()

            # With pandas
            import pandas as pd
            df = pd.read_sql("SELECT * FROM your_table", engine)

            # With SQLAlchemy ORM
            from sqlalchemy.orm import sessionmaker
            Session = sessionmaker(bind=engine)
            session = Session()
        """
        try:
            from sqlalchemy import create_engine
            engine = create_engine(self.database_url)
            return engine
        except ImportError:
            raise ImportError("sqlalchemy not installed. Run: pip install sqlalchemy")
        except Exception as e:
            raise ConnectionError(f"Failed to create SQLAlchemy engine: {e}")

    async def connect_with_asyncpg(self):
        """
        Create an async connection pool using asyncpg

        Usage:
            import asyncio

            async def main():
                db = DatabaseConnection()
                pool = await db.connect_with_asyncpg()

                async with pool.acquire() as conn:
                    result = await conn.fetch("SELECT * FROM your_table")
                    print(result)

                await pool.close()

            asyncio.run(main())
        """
        try:
            import asyncpg
            pool = await asyncpg.create_pool(self.database_url)
            return pool
        except ImportError:
            raise ImportError("asyncpg not installed. Run: pip install asyncpg")
        except Exception as e:
            raise ConnectionError(f"Failed to create async connection pool: {e}")

    def test_connection(self) -> bool:
        """
        Test if the database connection works

        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            conn = self.connect_with_psycopg2()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return result[0] == 1
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False


# Convenience function for quick connections
def get_db_connection():
    """
    Quick helper to get a database connection

    Usage:
        from db_connection import get_db_connection

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM your_table")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
    """
    db = DatabaseConnection()
    return db.connect_with_psycopg2()


def get_db_engine():
    """
    Quick helper to get a SQLAlchemy engine

    Usage:
        from db_connection import get_db_engine
        import pandas as pd

        engine = get_db_engine()
        df = pd.read_sql("SELECT * FROM your_table", engine)
    """
    db = DatabaseConnection()
    return db.connect_with_sqlalchemy()


if __name__ == "__main__":
    # Test the connection
    print("Testing database connection...")
    db = DatabaseConnection()

    if db.test_connection():
        print("✅ Database connection successful!")
        print(f"Connected to: {db.supabase_url}")
    else:
        print("❌ Database connection failed!")
        print("Please check your .env file and credentials.")
