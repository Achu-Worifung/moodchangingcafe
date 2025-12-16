# db.py
import os
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

# Load environment variables from .env if available
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

# Create a global connection pool
pool = SimpleConnectionPool(
    1,                     # min connections
    10,                    # max connections
    **DB_CONFIG
)

def get_conn():
    """Get a connection from the pool."""
    return pool.getconn()

def release_conn(conn):
    """Return a connection to the pool."""
    pool.putconn(conn)

def query(sql, params=None):
    """Run a SELECT query and return results."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        release_conn(conn)

def execute(sql, params=None):
    """Run INSERT/UPDATE/DELETE queries."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
    finally:
        release_conn(conn)
