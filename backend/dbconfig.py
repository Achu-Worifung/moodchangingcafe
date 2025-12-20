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
    "database": os.getenv("DB_NAME", "moodchangingcafe"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
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

def purchase(itemid, quantity, email, total_price):
    """
    Insert order, decrement stock and insert order_item safely.
    Uses SELECT ... FOR UPDATE to lock the item row and avoid races.
    Returns the new order id.
    """
    print("purchase called with:", itemid, quantity, email, total_price)
    conn = get_conn()
    try:
        # ensure we're in transactional mode
        conn.autocommit = False

        with conn.cursor() as cur:
            # 1) lock item row and read price + stock
            cur.execute(
                "SELECT unit_price, quantity_in_stock FROM item WHERE id = %s FOR UPDATE",
                (itemid,),
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError("Item not found")
            unit_price, qty_in_stock = row
            print("item row:", unit_price, qty_in_stock)

            # 2) check stock
            if qty_in_stock < quantity:
                raise ValueError("Insufficient stock")

            # 3) create order and get id
            cur.execute(
                'INSERT INTO "order" (customer_email, status, total_price) VALUES (%s, %s, %s) RETURNING id',
                (email, "pending", total_price),
            )
            order_id = cur.fetchone()[0]
            print("created order id:", order_id)

            # 4) decrement stock
            cur.execute(
                "UPDATE item SET quantity_in_stock = quantity_in_stock - %s WHERE id = %s",
                (quantity, itemid),
            )
            # don't call fetchone() here — UPDATE without RETURNING doesn't return rows

            # 5) insert order_item using the unit_price we read earlier
            cur.execute(
                """
                INSERT INTO order_item (order_id, item_id, unit_price, quantity)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, itemid, unit_price, quantity),
            )

        # commit the whole transaction
        conn.commit()
        print("purchase complete:", order_id)
        return order_id

    except Exception as e:
        # rollback on error (very important)
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        release_conn(conn)
