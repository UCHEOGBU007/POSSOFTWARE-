-- ============================================================
-- NaijaPOS Pro — Unified Hardened Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BASE DATA TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name       text NOT NULL,
  owner_name          text NOT NULL,
  email               text NOT NULL UNIQUE,
  phone               text NOT NULL,
  password_hash       text, -- Legacy column retained for compatibility; revoked below
  tier                text NOT NULL CHECK (tier IN ('basic','standard','premium')),
  subscription_status text NOT NULL CHECK (subscription_status IN ('active','expired','trial')),
  subscription_expiry timestamptz NOT NULL,
  address             text,
  logo                text,
  currency            text NOT NULL DEFAULT 'NGN',
  tax_rate            numeric(5,2) NOT NULL DEFAULT 7.5,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outlets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  address         text NOT NULL,
  phone           text,
  outlet_code     text UNIQUE,
  currency        text,
  pin             text, -- Legacy column
  is_active       boolean NOT NULL DEFAULT true,
  tax_enabled     boolean NOT NULL DEFAULT true,
  receipt_footer  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outlets_merchant_id_idx ON public.outlets(merchant_id);
CREATE INDEX IF NOT EXISTS outlets_outlet_code_idx ON public.outlets(outlet_code);

CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id   uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_outlet_id_idx ON public.categories(outlet_id);

CREATE TABLE IF NOT EXISTS public.products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id       uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  category_id     uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name            text NOT NULL,
  sku             text NOT NULL,
  barcode         text,
  description     text,
  price           numeric(12,2) NOT NULL,
  cost_price      numeric(12,2) NOT NULL DEFAULT 0,
  stock           integer NOT NULL DEFAULT 0,
  low_stock_alert integer NOT NULL DEFAULT 5,
  unit            text NOT NULL DEFAULT 'pcs',
  image           text,
  is_active       boolean NOT NULL DEFAULT true,
  track_stock     boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outlet_id, sku),
  CONSTRAINT products_non_negative_values CHECK (price >= 0 AND cost_price >= 0 AND stock >= 0 AND low_stock_alert >= 0)
);

CREATE INDEX IF NOT EXISTS products_outlet_id_idx ON public.products(outlet_id);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products(sku);

CREATE TABLE IF NOT EXISTS public.customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id       uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name            text NOT NULL,
  phone           text NOT NULL,
  email           text,
  address         text,
  loyalty_points  integer NOT NULL DEFAULT 0,
  total_spent     numeric(15,2) NOT NULL DEFAULT 0,
  visit_count     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outlet_id, phone)
);

CREATE INDEX IF NOT EXISTS customers_outlet_id_idx ON public.customers(outlet_id);

CREATE TABLE IF NOT EXISTS public.staff (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id   uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  phone       text,
  pin         text, -- Legacy column
  role        text NOT NULL CHECK (role IN ('manager','cashier')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_outlet_id_idx ON public.staff(outlet_id);
CREATE INDEX IF NOT EXISTS staff_email_idx ON public.staff(email);

CREATE TABLE IF NOT EXISTS public.sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id       uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  receipt_number  text NOT NULL,
  items           jsonb NOT NULL DEFAULT '[]',
  subtotal        numeric(12,2) NOT NULL,
  tax_amount      numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL,
  amount_paid     numeric(12,2) NOT NULL,
  change          numeric(12,2) NOT NULL DEFAULT 0,
  payment_method  text NOT NULL CHECK (payment_method IN ('cash','card','transfer','pos','wallet')),
  status          text NOT NULL CHECK (status IN ('completed','refunded','void')) DEFAULT 'completed',
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name   text,
  staff_id        uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  staff_name      text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_non_negative_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total >= 0 AND amount_paid >= 0 AND change >= 0),
  CONSTRAINT sales_outlet_receipt_unique UNIQUE (outlet_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS sales_outlet_id_idx ON public.sales(outlet_id);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS sales_receipt_number_idx ON public.sales(receipt_number);

CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id    uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  category     text NOT NULL,
  amount       numeric(12,2) NOT NULL,
  description  text NOT NULL,
  expense_date date NOT NULL,
  staff_id     uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expenses_positive_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS expenses_outlet_id_idx ON public.expenses(outlet_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses(expense_date);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id    uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  type         text NOT NULL CHECK (type IN ('in','out','adjust','sale','return')),
  qty          integer NOT NULL,
  prev_stock   integer NOT NULL,
  new_stock    integer NOT NULL,
  note         text,
  sale_id      uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_outlet_id_idx ON public.stock_movements(outlet_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON public.stock_movements(product_id);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id         bigserial PRIMARY KEY,
  actor_id   uuid NOT NULL,
  action     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_rate_limits_lookup_idx ON public.api_rate_limits(actor_id, action, created_at DESC);

-- 2. ACCESS RESTRICTIONS & LEGACY SECURITY CLEANUP
-- ============================================================

REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;
REVOKE ALL (password_hash) ON TABLE public.merchants FROM anon, authenticated;
REVOKE ALL (pin) ON TABLE public.staff FROM anon, authenticated;

-- 3. AUTOMATED MERCHANT PROFILING
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_merchant_profile()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.merchants (
    id, business_name, owner_name, email, phone, tier,
    subscription_status, subscription_expiry, currency, tax_rate
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'business_name', 'New business'),
    COALESCE(new.raw_user_meta_data->>'owner_name', 'Merchant'),
    LOWER(new.email),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'tier', 'basic'),
    'trial', NOW() + INTERVAL '30 days', 'NGN', 7.5
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_merchant ON auth.users;
CREATE TRIGGER on_auth_user_created_merchant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_merchant_profile();

-- Backfill legacy users
INSERT INTO public.merchants (
  id, business_name, owner_name, email, phone, tier,
  subscription_status, subscription_expiry, currency, tax_rate
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'business_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'owner_name', split_part(u.email, '@', 1)),
  LOWER(u.email),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  COALESCE(u.raw_user_meta_data->>'tier', 'basic'),
  'trial', NOW() + INTERVAL '30 days', 'NGN', 7.5
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 4. RLS HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_staff_of_outlet(outlet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = auth.uid()
      AND staff.outlet_id = $1
      AND staff.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_merchant_of_outlet(outlet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.outlets o
    WHERE o.id = $1
      AND o.merchant_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_outlet(outlet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT public.is_staff_of_outlet($1) OR public.is_merchant_of_outlet($1);
$$;

-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- MERCHANTS: View/update own account profile only
DROP POLICY IF EXISTS "merchants_own_data" ON public.merchants;
CREATE POLICY "merchants_own_data" ON public.merchants
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- OUTLETS: Merchant full administration; staff read-only
DROP POLICY IF EXISTS "outlets_select" ON public.outlets;
DROP POLICY IF EXISTS "outlets_merchant_insert" ON public.outlets;
DROP POLICY IF EXISTS "outlets_merchant_update" ON public.outlets;
DROP POLICY IF EXISTS "outlets_merchant_delete" ON public.outlets;

CREATE POLICY "outlets_select" ON public.outlets FOR SELECT
  USING (merchant_id = auth.uid() OR public.is_staff_of_outlet(id));

CREATE POLICY "outlets_merchant_insert" ON public.outlets FOR INSERT
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "outlets_merchant_update" ON public.outlets FOR UPDATE
  USING (merchant_id = auth.uid()) WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "outlets_merchant_delete" ON public.outlets FOR DELETE
  USING (merchant_id = auth.uid());

-- STAFF: Merchant manages account rows; staff members can read self/outlet team
DROP POLICY IF EXISTS "staff_select" ON public.staff;
DROP POLICY IF EXISTS "staff_merchant_insert" ON public.staff;
DROP POLICY IF EXISTS "staff_merchant_update" ON public.staff;
DROP POLICY IF EXISTS "staff_merchant_delete" ON public.staff;

CREATE POLICY "staff_select" ON public.staff FOR SELECT
  USING (id = auth.uid() OR public.is_merchant_of_outlet(outlet_id));

CREATE POLICY "staff_merchant_insert" ON public.staff FOR INSERT
  WITH CHECK (public.is_merchant_of_outlet(outlet_id));

CREATE POLICY "staff_merchant_update" ON public.staff FOR UPDATE
  USING (public.is_merchant_of_outlet(outlet_id))
  WITH CHECK (public.is_merchant_of_outlet(outlet_id));

CREATE POLICY "staff_merchant_delete" ON public.staff FOR DELETE
  USING (public.is_merchant_of_outlet(outlet_id));

-- STANDARD OUTLET-LEVEL TABLES
DROP POLICY IF EXISTS "categories_access" ON public.categories;
CREATE POLICY "categories_access" ON public.categories
  FOR ALL USING (public.can_access_outlet(outlet_id))
  WITH CHECK (public.can_access_outlet(outlet_id));

DROP POLICY IF EXISTS "products_access" ON public.products;
CREATE POLICY "products_access" ON public.products
  FOR ALL USING (public.can_access_outlet(outlet_id))
  WITH CHECK (public.can_access_outlet(outlet_id));

DROP POLICY IF EXISTS "customers_access" ON public.customers;
CREATE POLICY "customers_access" ON public.customers
  FOR ALL USING (public.can_access_outlet(outlet_id))
  WITH CHECK (public.can_access_outlet(outlet_id));

DROP POLICY IF EXISTS "expenses_access" ON public.expenses;
CREATE POLICY "expenses_access" ON public.expenses
  FOR ALL USING (public.can_access_outlet(outlet_id))
  WITH CHECK (public.can_access_outlet(outlet_id));

DROP POLICY IF EXISTS "stock_movements_access" ON public.stock_movements;
CREATE POLICY "stock_movements_access" ON public.stock_movements
  FOR ALL USING (public.can_access_outlet(outlet_id))
  WITH CHECK (public.can_access_outlet(outlet_id));

-- SALES: Read-only via client. Writes managed exclusively by record_sale
DROP POLICY IF EXISTS "sales_read_access" ON public.sales;
CREATE POLICY "sales_read_access" ON public.sales FOR SELECT
  USING (public.can_access_outlet(outlet_id));

-- 6. AUDIT & CHECKOUT TRANSACTION ENGINE
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_expense_author()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND outlet_id = new.outlet_id AND is_active) THEN
    new.staff_id := auth.uid();
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS expense_author_before_write ON public.expenses;
CREATE TRIGGER expense_author_before_write 
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_expense_author();

CREATE OR REPLACE FUNCTION public.record_sale(
  p_outlet_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_amount_paid numeric,
  p_customer_id uuid DEFAULT null,
  p_note text DEFAULT null
) RETURNS public.sales
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
DECLARE
  v_staff           public.staff%rowtype;
  v_outlet          public.outlets%rowtype;
  v_merchant        public.merchants%rowtype;
  v_customer_name   text := null;
  v_item            jsonb;
  v_product         public.products%rowtype;
  v_qty             integer;
  v_discount        numeric;
  v_subtotal        numeric := 0;
  v_discount_total numeric := 0;
  v_tax             numeric := 0;
  v_total           numeric := 0;
  v_sale            public.sales%rowtype;
  v_items           jsonb := '[]'::jsonb;
BEGIN
  -- 1. Input Validation
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'A sale must contain between 1 and 100 items' USING errcode = '22023';
  END IF;
  
  IF p_payment_method NOT IN ('cash','card','transfer','pos','wallet') OR p_amount_paid < 0 THEN
    RAISE EXCEPTION 'Invalid payment details provided' USING errcode = '22023';
  END IF;

  -- 2. Context & Permission Verification
  SELECT * INTO v_staff FROM public.staff WHERE id = auth.uid() AND outlet_id = p_outlet_id AND is_active;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Active staff authentication required' USING errcode = '42501'; 
  END IF;

  SELECT * INTO v_outlet FROM public.outlets WHERE id = p_outlet_id AND is_active;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Target outlet is disabled or inactive' USING errcode = '42501'; 
  END IF;

  SELECT * INTO v_merchant FROM public.merchants WHERE id = v_outlet.merchant_id;
  IF v_merchant.subscription_status NOT IN ('active', 'trial') OR v_merchant.subscription_expiry < NOW() THEN
    RAISE EXCEPTION 'Merchant subscription is inactive or expired' USING errcode = '42501';
  END IF;

  IF p_customer_id IS NOT NULL THEN
    SELECT name INTO v_customer_name FROM public.customers WHERE id = p_customer_id AND outlet_id = p_outlet_id;
    IF NOT FOUND THEN 
      RAISE EXCEPTION 'Selected customer is not registered to this outlet' USING errcode = '22023'; 
    END IF;
  END IF;

  -- 3. Item Calculation & Inventory Lock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::integer;
    v_discount := COALESCE((v_item->>'discount_percent')::numeric, 0);
    
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 10000 OR v_discount < 0 OR v_discount > 100 THEN
      RAISE EXCEPTION 'Invalid item line values: quantity or discount out of range' USING errcode = '22023';
    END IF;

    SELECT * INTO v_product FROM public.products
      WHERE id = (v_item->>'product_id')::uuid AND outlet_id = p_outlet_id AND is_active FOR UPDATE;
      
    IF NOT FOUND THEN 
      RAISE EXCEPTION 'Product ID % unavailable', (v_item->>'product_id') USING errcode = '22023'; 
    END IF;
    
    IF v_product.track_stock AND v_product.stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %)', v_product.name, v_product.stock, v_qty USING errcode = '22023';
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_discount_total := v_discount_total + (v_product.price * v_qty * v_discount / 100);
    
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product.id, 
      'productName', v_product.name, 
      'sku', v_product.sku, 
      'qty', v_qty, 
      'unitPrice', v_product.price, 
      'discount', v_discount, 
      'total', v_product.price * v_qty * (1 - v_discount / 100)
    ));

    IF v_product.track_stock THEN
      UPDATE public.products SET stock = stock - v_qty, updated_at = NOW() WHERE id = v_product.id;
    END IF;
  END LOOP;

  -- 4. Totals Calculation
  v_tax := CASE WHEN v_outlet.tax_enabled THEN ROUND((v_subtotal - v_discount_total) * 0.075, 2) ELSE 0 END;
  v_total := ROUND(v_subtotal - v_discount_total + v_tax, 2);

  IF p_amount_paid < v_total THEN 
    RAISE EXCEPTION 'Amount paid (%) insufficient for total (%)', p_amount_paid, v_total USING errcode = '22023'; 
  END IF;

  -- 5. Record Creation
  INSERT INTO public.sales(
    outlet_id, receipt_number, items, subtotal, tax_amount, 
    discount_amount, total, amount_paid, change, payment_method, 
    customer_id, customer_name, staff_id, staff_name, note
  ) VALUES (
    p_outlet_id, 
    UPPER(SUBSTR(p_outlet_id::text, 1, 4)) || '-' || TO_CHAR(CLOCK_TIMESTAMP(), 'YYMMDDHH24MISSMS'), 
    v_items, v_subtotal, v_tax, v_discount_total, v_total, p_amount_paid, 
    p_amount_paid - v_total, p_payment_method, p_customer_id, v_customer_name, 
    v_staff.id, v_staff.name, LEFT(p_note, 500)
  ) RETURNING * INTO v_sale;

  -- 6. Stock Movement Auditing
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'productId')::uuid;
    IF v_product.track_stock THEN
      INSERT INTO public.stock_movements(
        outlet_id, product_id, product_name, type, qty, prev_stock, new_stock, sale_id
      ) VALUES (
        p_outlet_id, v_product.id, v_product.name, 'sale', 
        -((v_item->>'qty')::integer), 
        v_product.stock + ((v_item->>'qty')::integer), 
        v_product.stock, v_sale.id
      );
    END IF;
  END LOOP;

  -- 7. Update Customer Statistics
  IF p_customer_id IS NOT NULL THEN
    UPDATE public.customers 
    SET total_spent = total_spent + v_total,
        visit_count = visit_count + 1,
        loyalty_points = loyalty_points + FLOOR(v_total / 100)::integer,
        updated_at = NOW()
    WHERE id = p_customer_id;
  END IF;

  RETURN v_sale;
END;
$$;

REVOKE ALL ON FUNCTION public.record_sale(uuid, jsonb, text, numeric, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_sale(uuid, jsonb, text, numeric, uuid, text) TO authenticated;

-- 7. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.outlet_daily_summary 
WITH (security_invoker = true) AS
SELECT
  o.id AS outlet_id,
  o.name AS outlet_name,
  o.merchant_id,
  DATE_TRUNC('day', s.created_at) AS sale_date,
  COUNT(s.id) AS transaction_count,
  SUM(s.total) AS revenue,
  SUM(s.discount_amount) AS total_discounts,
  SUM(s.tax_amount) AS total_tax
FROM public.outlets o
LEFT JOIN public.sales s ON s.outlet_id = o.id AND s.status = 'completed'
GROUP BY o.id, o.name, o.merchant_id, DATE_TRUNC('day', s.created_at);