BEGIN;

---------------------------------------------------------
-- CATEGORY TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS category (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trg_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_set_updated_at
BEFORE UPDATE ON category
FOR EACH ROW
EXECUTE FUNCTION trg_category_updated_at();


---------------------------------------------------------
-- ITEM TABLE 
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS item (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    unit_price NUMERIC(12,2) DEFAULT 0.00,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    tax_rate NUMERIC(5,2) DEFAULT 0.0,
    img BYTEA,

    -- NEW: CATEGORY RELATION
    category varchar(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_name ON item(name);

-- Trigger to notify on item updates
CREATE OR REPLACE FUNCTION notify_item_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'item_updates',
        json_build_object(
            'item_id', NEW.id,
            'quantity_in_stock', NEW.quantity_in_stock
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER item_notify_update
AFTER UPDATE ON item
FOR EACH ROW
EXECUTE FUNCTION notify_item_update();


---------------------------------------------------------
-- ORDERS & ORDER ITEM
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "order" (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    total_price NUMERIC(14,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_item (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES item(id) ON DELETE RESTRICT,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_item ON order_item(item_id);


---------------------------------------------------------
-- TRIGGERS FOR UPDATED_AT
---------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_set_updated_at
BEFORE UPDATE ON "order"
FOR EACH ROW
EXECUTE FUNCTION trg_order_updated_at();

CREATE TRIGGER order_item_set_updated_at
BEFORE UPDATE ON order_item
FOR EACH ROW
EXECUTE FUNCTION trg_order_updated_at();


---------------------------------------------------------
-- NOTIFY FUNCTIONS FOR WEBSOCKET
---------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_item_quantity_change(p_item_id BIGINT)
RETURNS VOID AS $$
DECLARE
    payload JSONB;
    q INTEGER;
BEGIN
    SELECT quantity_in_stock INTO q FROM item WHERE id = p_item_id;
    payload := jsonb_build_object(
        'item_id', p_item_id,
        'new_quantity', q,
        'ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SSZ')
    );
    PERFORM pg_notify('item_quantity_changed', payload::text);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION notify_order_change(p_order_id BIGINT, p_action TEXT)
RETURNS VOID AS $$
DECLARE
    payload JSONB;
    t NUMERIC;
BEGIN
    SELECT total_price INTO t FROM "order" WHERE id = p_order_id;
    payload := jsonb_build_object(
        'order_id', p_order_id,
        'action', p_action,
        'total_price', COALESCE(t, 0),
        'ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SSZ')
    );
    PERFORM pg_notify('order_changed', payload::text);
END;
$$ LANGUAGE plpgsql;


---------------------------------------------------------
-- INVENTORY CHANGE TRIGGERS
---------------------------------------------------------

-- INSERT → subtract stock
CREATE OR REPLACE FUNCTION trg_order_item_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE item
    SET quantity_in_stock = quantity_in_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;

    PERFORM notify_item_quantity_change(NEW.item_id);
    PERFORM notify_order_change(NEW.order_id, 'order_item_insert');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- DELETE → restore stock
CREATE OR REPLACE FUNCTION trg_order_item_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE item
    SET quantity_in_stock = quantity_in_stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.item_id;

    PERFORM notify_item_quantity_change(OLD.item_id);
    PERFORM notify_order_change(OLD.order_id, 'order_item_delete');

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- UPDATE quantity or item_id → adjust stock difference
CREATE OR REPLACE FUNCTION trg_order_item_after_update()
RETURNS TRIGGER AS $$
DECLARE
    qty_diff INTEGER;
BEGIN
    qty_diff := NEW.quantity - OLD.quantity;

    -- Quantity changed
    IF qty_diff <> 0 THEN
        UPDATE item
        SET quantity_in_stock = quantity_in_stock - qty_diff,
            updated_at = now()
        WHERE id = NEW.item_id;

        PERFORM notify_item_quantity_change(NEW.item_id);
    END IF;

    -- Item ID changed
    IF NEW.item_id IS DISTINCT FROM OLD.item_id THEN
        UPDATE item
        SET quantity_in_stock = quantity_in_stock + OLD.quantity
        WHERE id = OLD.item_id;

        PERFORM notify_item_quantity_change(OLD.item_id);
    END IF;

    PERFORM notify_order_change(NEW.order_id, 'order_item_update');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Attach triggers
CREATE TRIGGER order_item_after_insert
AFTER INSERT ON order_item
FOR EACH ROW EXECUTE FUNCTION trg_order_item_after_insert();

CREATE TRIGGER order_item_after_delete
AFTER DELETE ON order_item
FOR EACH ROW EXECUTE FUNCTION trg_order_item_after_delete();

CREATE TRIGGER order_item_after_update
AFTER UPDATE ON order_item
FOR EACH ROW EXECUTE FUNCTION trg_order_item_after_update();


---------------------------------------------------------
-- NOTIFY ON MANUAL STOCK CHANGE
---------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_item_after_update_notify_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity_in_stock IS DISTINCT FROM OLD.quantity_in_stock THEN
        PERFORM notify_item_quantity_change(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_after_update_notify
AFTER UPDATE ON item
FOR EACH ROW
WHEN (OLD.quantity_in_stock IS DISTINCT FROM NEW.quantity_in_stock)
EXECUTE FUNCTION trg_item_after_update_notify_quantity();


---------------------------------------------------------
-- PREVENT NEGATIVE STOCK
---------------------------------------------------------
ALTER TABLE item
ADD CONSTRAINT check_item_nonnegative_stock CHECK (quantity_in_stock >= 0);


---------------------------------------------------------
-- ORDER TOTAL RECALC
---------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_order_recalc_total(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
    new_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(line_total),0)
    INTO new_total
    FROM order_item
    WHERE order_id = p_order_id;

    UPDATE "order"
    SET total_price = new_total,
        updated_at = now()
    WHERE id = p_order_id;

    PERFORM notify_order_change(p_order_id, 'order_total_recalc');
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------
-- 1) USERS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_account" (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,         -- store bcrypt/argon2 hash, NOT plaintext
    role TEXT NOT NULL DEFAULT 'user',   -- e.g. admin, user, support
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_username ON "user_account"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user_account"(email);



---------------------------------------------------------
-- 2) Wire orders.customer_id -> user_account(id)
-- If "order.customer_id" already contains values which map to user ids, the FK will succeed.
-- If not, either populate/migrate customer ids first or keep the column nullable.
---------------------------------------------------------

-- 2a) Ensure the column exists (it was created earlier as BIGINT NULL in your schema)
ALTER TABLE "order"
  ALTER COLUMN customer_id TYPE BIGINT USING customer_id::BIGINT
  -- leave it NULLable; you can enforce NOT NULL later if desired
  ;

-- 2b) Add FK constraint to reference user_account(id). Use ON DELETE SET NULL to avoid cascading deletes.
-- If the DB already has rows with customer_id values that don't match an existing user_account.id, this will fail.
-- In that case, create the constraint after you migrate user data or fill NULLs.
ALTER TABLE "order"
  ADD CONSTRAINT fk_order_customer
  FOREIGN KEY (customer_id) REFERENCES "user_account"(id) ON DELETE SET NULL;



-- attach recalc triggers
CREATE OR REPLACE FUNCTION trg_after_insert_recalc()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM trg_order_recalc_total(NEW.order_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_after_delete_recalc()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM trg_order_recalc_total(OLD.order_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_after_update_recalc()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM trg_order_recalc_total(NEW.order_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_item_after_insert_recalc
AFTER INSERT ON order_item
FOR EACH ROW EXECUTE FUNCTION trg_after_insert_recalc();

CREATE TRIGGER order_item_after_delete_recalc
AFTER DELETE ON order_item
FOR EACH ROW EXECUTE FUNCTION trg_after_delete_recalc();

CREATE TRIGGER order_item_after_update_recalc
AFTER UPDATE ON order_item
FOR EACH ROW EXECUTE FUNCTION trg_after_update_recalc();

COMMIT;
