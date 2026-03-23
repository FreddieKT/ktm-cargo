-- ==============================================================================
-- ENHANCE RBAC SECURITY POLICIES
-- Fixes:
-- 1. Add granular permission helpers aligned with frontend PERMISSIONS
-- 2. Apply least-privilege RLS per role (not just admin-or-director binary)
-- 3. Add explicit authorization to RPC functions (must stay SECURITY INVOKER)
-- 4. Add security audit log for role-sensitive operations
-- ==============================================================================

-- 1. GRANULAR PERMISSION HELPERS
-- Frontend PERMISSIONS mapped to DB-level checks

-- Check if user can view shipments (managing_director, finance_lead, marketing_manager)
CREATE OR REPLACE FUNCTION public.can_view_shipments()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead', 'marketing_manager') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage (create/update/delete) shipments (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_manage_shipments()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage procurement (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_manage_procurement()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can approve purchase orders (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_approve_purchase_orders()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage vendors (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_manage_vendors()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage shopping orders (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_manage_shopping_orders()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage inventory (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage tasks (managing_director only)
CREATE OR REPLACE FUNCTION public.can_manage_tasks()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role = 'managing_director' THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage campaigns (managing_director, marketing_manager)
CREATE OR REPLACE FUNCTION public.can_manage_campaigns()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'marketing_manager') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can export reports (managing_director, finance_lead)
CREATE OR REPLACE FUNCTION public.can_export_reports()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role IN ('managing_director', 'finance_lead') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage business settings (managing_director only)
CREATE OR REPLACE FUNCTION public.can_manage_settings()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_staff_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT role, staff_role INTO v_role, v_staff_role
  FROM public.profiles
  WHERE id = auth.uid();
  IF v_role = 'admin' OR v_staff_role = 'managing_director' THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SECURITY AUDIT LOG TABLE
-- Track role changes and security-sensitive mutations

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_role TEXT,
  new_role TEXT,
  old_staff_role TEXT,
  new_staff_role TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB
);

-- Log every profile role/staff_role change
DROP TRIGGER IF EXISTS security_audit_profile_role_changes ON public.profiles;
CREATE TRIGGER security_audit_profile_role_changes
  AFTER UPDATE OF role, staff_role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.staff_role IS DISTINCT FROM NEW.staff_role)
  EXECUTE FUNCTION public.log_security_audit();

-- Helper function for audit logging
CREATE OR REPLACE FUNCTION public.log_security_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id,
    old_role, new_role, old_staff_role, new_staff_role
  ) VALUES (
    auth.uid(),
    'ROLE_CHANGE',
    'profiles',
    NEW.id::TEXT,
    OLD.role,
    NEW.role,
    OLD.staff_role,
    NEW.staff_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SECURE SHIPMENT RPCS WITH EXPLICIT PERMISSION CHECKS
-- Keep as SECURITY INVOKER so auth.uid() works, add explicit checks

-- NOTE: Re-create these after the original migration is applied.
-- The body should match add_shipment_po_allocation_rpcs.sql exactly,
-- with these two lines added at the start of each BEGIN block:
--
--   IF NOT public.can_manage_shipments() THEN
--     RAISE EXCEPTION 'Unauthorized: insufficient permissions to create/update/delete shipments';
--   END IF;

-- Example authorization wrapper (apply to each shipment RPC):
-- CREATE OR REPLACE FUNCTION public.create_shipment_with_po_rebalance(p_payload JSONB)
-- RETURNS ... AS $$
-- BEGIN
--   IF NOT public.can_manage_shipments() THEN
--     RAISE EXCEPTION 'Unauthorized: insufficient permissions to create shipments';
--   END IF;
--   -- ... rest of original function body ...
-- END;
-- $$ LANGUAGE plpgsql SECURITY INVOKER;

-- 4. UPDATE RLS POLICIES TO USE GRANULAR PERMISSION FUNCTIONS
-- Apply least-privilege policies per table

-- SHIPMENTS: read for all staff, write for managing_director/finance_lead only
DROP POLICY IF EXISTS "Staff Full Access shipments" ON public.shipments;
CREATE POLICY "Shipments view for staff" ON public.shipments
  FOR SELECT USING (public.can_view_shipments() = TRUE);

CREATE POLICY "Shipments manage for directors" ON public.shipments
  FOR ALL USING (public.can_manage_shipments() = TRUE);

-- SHOPPING ORDERS: read for all staff, write for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access shopping_orders" ON public.shopping_orders;
CREATE POLICY "Shopping orders view for staff" ON public.shopping_orders
  FOR SELECT USING (public.can_view_shipments() = TRUE);

CREATE POLICY "Shopping orders manage for directors" ON public.shopping_orders
  FOR ALL USING (public.can_manage_shopping_orders() = TRUE);

-- PURCHASE ORDERS: view + manage for managing_director/finance_lead only
DROP POLICY IF EXISTS "Staff Full Access purchase_orders" ON public.purchase_orders;
CREATE POLICY "Purchase orders access for procurement" ON public.purchase_orders
  FOR ALL USING (public.can_manage_procurement() = TRUE);

-- VENDORS: view + manage for managing_director/finance_lead only
DROP POLICY IF EXISTS "Staff Full Access vendors" ON public.vendors;
CREATE POLICY "Vendors access for procurement" ON public.vendors
  FOR ALL USING (public.can_manage_vendors() = TRUE);

-- INVENTORY: view + manage for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access inventory_items" ON public.inventory_items;
CREATE POLICY "Inventory access for staff" ON public.inventory_items
  FOR ALL USING (public.can_manage_inventory() = TRUE);

-- CAMPAIGNS: view + manage for managing_director/marketing_manager
DROP POLICY IF EXISTS "Staff Full Access campaigns" ON public.campaigns;
CREATE POLICY "Campaigns access for marketing" ON public.campaigns
  FOR ALL USING (public.can_manage_campaigns() = TRUE);

-- TASKS: view for all staff, manage for managing_director only
DROP POLICY IF EXISTS "Staff Full Access tasks" ON public.tasks;
CREATE POLICY "Tasks view for staff" ON public.tasks
  FOR SELECT USING (public.can_view_shipments() = TRUE);

CREATE POLICY "Tasks manage for directors" ON public.tasks
  FOR ALL USING (public.can_manage_tasks() = TRUE);

-- EXPENSES: view + manage for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access expenses" ON public.expenses;
CREATE POLICY "Expenses access for finance" ON public.expenses
  FOR ALL USING (public.can_manage_shipments() = TRUE);

-- CUSTOMER INVOICES: view + manage for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access customer_invoices" ON public.customer_invoices;
CREATE POLICY "Invoices access for finance" ON public.customer_invoices
  FOR ALL USING (public.can_export_reports() = TRUE);

-- SERVICE PRICING: view for all staff, manage for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access service_pricing" ON public.service_pricing;
CREATE POLICY "Pricing view for staff" ON public.service_pricing
  FOR SELECT USING (public.can_view_shipments() = TRUE);

CREATE POLICY "Pricing manage for directors" ON public.service_pricing
  FOR ALL USING (public.can_manage_settings() = TRUE);

-- VENDOR ORDERS: view + manage for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access vendor_orders" ON public.vendor_orders;
CREATE POLICY "Vendor orders access for procurement" ON public.vendor_orders
  FOR ALL USING (public.can_manage_procurement() = TRUE);

-- GOODS RECEIPTS: view + manage for managing_director/finance_lead
DROP POLICY IF EXISTS "Staff Full Access goods_receipts" ON public.goods_receipts;
CREATE POLICY "Goods receipts access for procurement" ON public.goods_receipts
  FOR ALL USING (public.can_manage_procurement() = TRUE);

-- NOTES:
-- - Remaining tables (company_settings, notifications, etc.) keep existing is_admin_or_director()
-- - RPC authorization checks (can_manage_shipments etc.) should be added to function bodies
-- - Apply this migration AFTER add_shipment_po_allocation_rpcs.sql and fix_rls_policies.sql
